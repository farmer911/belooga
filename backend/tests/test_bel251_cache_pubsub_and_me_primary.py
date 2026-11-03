"""BEL-251: cross-pod L1 invalidation subscriber + /auth/me/ read-your-writes on the primary."""

import asyncio

import pytest

from app.core.cache import AsyncTieredCache
from app.core.database import get_db, get_read_db
from app.main import app, lifespan


class FakePubSub:
    def __init__(self, messages, fail=False):
        self.messages = list(messages)
        self.fail = fail
        self.subscribed = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def subscribe(self, channel):
        if self.fail:
            raise ConnectionError("redis down")
        self.subscribed.append(channel)

    async def get_message(self, ignore_subscribe_messages=False, timeout=0.0):
        if self.messages:
            return {"type": "message", "data": self.messages.pop(0)}
        await asyncio.sleep(0.01)
        return None


class FakeRedis:
    def __init__(self, pubsubs):
        self.pubsubs = list(pubsubs)
        self.published = []

    def pubsub(self):
        return self.pubsubs.pop(0) if len(self.pubsubs) > 1 else self.pubsubs[0]

    async def scan(self, cursor=0, match=None, count=100):
        return 0, []

    async def publish(self, channel, data):
        self.published.append((channel, data))


def _cache_with(fake: FakeRedis) -> AsyncTieredCache:
    cache = AsyncTieredCache(namespace="bel251", l1_max_size=16)

    async def _get_redis():
        return None if cache.circuit_state == "OPEN" else fake

    cache._get_redis = _get_redis
    return cache


async def _run_until(cache: AsyncTieredCache, cond, timeout: float = 2.0) -> None:
    task = asyncio.create_task(cache.run_invalidation_listener(retry_seconds=0.01))
    try:
        async with asyncio.timeout(timeout):
            while not cond():
                await asyncio.sleep(0.01)
    finally:
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task


@pytest.mark.asyncio
async def test_publish_tags_pod_id_and_listener_applies_only_remote_events():
    fake = FakeRedis([])
    cache = _cache_with(fake)
    await cache.invalidate_prefix("pub_profile:")
    assert fake.published == [("bel251:inval", f"{cache.pod_id}|bel251:pub_profile:")]

    cache._l1_set("bel251:pub_profile:alice", {"u": 1}, 60)
    cache._l1_set("bel251:trust:alice", {"t": 1}, 60)
    fake.pubsubs = [FakePubSub([f"{cache.pod_id}|bel251:trust:", "other-pod|bel251:pub_profile:"])]

    await _run_until(cache, lambda: "bel251:pub_profile:alice" not in cache._l1)
    assert fake.pubsubs[0].subscribed == ["bel251:inval"]
    assert "bel251:trust:alice" in cache._l1  # own-pod echo skipped
    assert cache.get_stats()["pubsub_invalidations_received"] == 1


@pytest.mark.asyncio
async def test_listener_survives_redis_outage_via_circuit_breaker():
    fake = FakeRedis([FakePubSub([], fail=True), FakePubSub(["other-pod|bel251:cms:"])])
    cache = _cache_with(fake)
    cache._trip_circuit = lambda cooldown_seconds=10.0: AsyncTieredCache._trip_circuit(cache, 0.05)
    cache._l1_set("bel251:cms:faq", ["q"], 60)

    await _run_until(cache, lambda: "bel251:cms:faq" not in cache._l1)
    assert cache.circuit_state == "CLOSED"


@pytest.mark.asyncio
async def test_lifespan_starts_and_cancels_invalidation_listener(monkeypatch):
    from app.core.cache import platform_cache

    started, cancelled = asyncio.Event(), asyncio.Event()

    async def fake_listener(retry_seconds: float = 1.0):
        started.set()
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            cancelled.set()
            raise

    monkeypatch.setattr(platform_cache, "run_invalidation_listener", fake_listener)
    async with lifespan(app):
        async with asyncio.timeout(1):
            await started.wait()
    assert cancelled.is_set()


def test_auth_me_reads_primary_for_read_your_writes():
    from app.api.v1.endpoints.auth import router

    route = next(r for r in router.routes if r.path == "/auth/me/")
    deps = [d.call for d in route.dependant.dependencies]
    assert get_db in deps and get_read_db not in deps
