"""Two-Tier Async Cache (L1 Bounded Memory + L2 Redis) with Singleflight Stampede Protection."""

import asyncio
import json
import logging
import os
import time
from collections import OrderedDict
from typing import Any, Awaitable, Callable, Optional

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)


class AsyncTieredCache:
    """High-concurrency L1/L2 cache with singleflight request coalescing for 10k-25k CCU bursts."""

    def __init__(self, namespace: str = "belooga", l1_max_size: int = 2048):
        self.namespace = namespace
        self.l1_max_size = l1_max_size
        self._l1: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._inflight: dict[str, asyncio.Future[Any]] = {}
        self._redis: Optional[aioredis.Redis] = None
        self._redis_disabled_until: float = 0.0

    def _full_key(self, key: str) -> str:
        return f"{self.namespace}:{key}"

    async def _get_redis(self) -> Optional[aioredis.Redis]:
        if os.getenv("ENVIRONMENT") == "testing":
            return None
        now = time.monotonic()
        if now < self._redis_disabled_until:
            return None
        if self._redis is None:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            try:
                self._redis = aioredis.from_url(
                    redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    max_connections=128,
                    socket_connect_timeout=0.25,
                    socket_timeout=0.5,
                )
            except Exception as exc:
                self._redis_disabled_until = now + 15.0
                logger.debug("Redis init skipped, using L1 cache: %s", exc)
                return None
        return self._redis

    def _l1_get(self, full_key: str) -> tuple[bool, Any]:
        entry = self._l1.get(full_key)
        if entry is None:
            return False, None
        expires_at, val = entry
        if time.monotonic() >= expires_at:
            self._l1.pop(full_key, None)
            return False, None
        self._l1.move_to_end(full_key)
        return True, val

    def _l1_set(self, full_key: str, value: Any, ttl_seconds: int) -> None:
        self._l1[full_key] = (time.monotonic() + ttl_seconds, value)
        self._l1.move_to_end(full_key)
        while len(self._l1) > self.l1_max_size:
            self._l1.popitem(last=False)

    async def get_or_set(
        self,
        key: str,
        ttl_seconds: int,
        loader: Callable[[], Awaitable[Any]],
        l1_ttl_seconds: Optional[int] = None,
    ) -> Any:
        full_key = self._full_key(key)
        hit, val = self._l1_get(full_key)
        if hit:
            return val

        inflight = self._inflight.get(full_key)
        if inflight is not None:
            return await asyncio.shield(inflight)

        loop = asyncio.get_running_loop()
        fut: asyncio.Future[Any] = loop.create_future()
        self._inflight[full_key] = fut

        try:
            r_client = await self._get_redis()
            if r_client is not None:
                try:
                    raw = await r_client.get(full_key)
                    if raw is not None:
                        loaded = json.loads(raw)
                        self._l1_set(full_key, loaded, min(ttl_seconds, l1_ttl_seconds or 10))
                        fut.set_result(loaded)
                        return loaded
                except Exception as exc:
                    self._redis_disabled_until = time.monotonic() + 10.0
                    logger.debug("Redis read fallback to DB loader: %s", exc)

            result = await loader()
            self._l1_set(full_key, result, min(ttl_seconds, l1_ttl_seconds or ttl_seconds))

            if r_client is not None:
                try:
                    await r_client.setex(full_key, ttl_seconds, json.dumps(result, default=str))
                except Exception as exc:
                    self._redis_disabled_until = time.monotonic() + 10.0
                    logger.debug("Redis write skipped: %s", exc)

            fut.set_result(result)
            return result
        except Exception as exc:
            if not fut.done():
                fut.set_exception(exc)
            raise
        finally:
            self._inflight.pop(full_key, None)

    async def invalidate_prefix(self, prefix: str = "") -> None:
        target = self._full_key(prefix)
        keys_to_drop = [k for k in self._l1 if k.startswith(target)]
        for k in keys_to_drop:
            self._l1.pop(k, None)
        r_client = await self._get_redis()
        if r_client is not None:
            try:
                cursor = 0
                while True:
                    cursor, keys = await r_client.scan(cursor=cursor, match=f"{target}*", count=100)
                    if keys:
                        await r_client.delete(*keys)
                    if cursor == 0:
                        break
            except Exception as exc:
                logger.debug("Redis prefix invalidation fallback: %s", exc)


platform_cache = AsyncTieredCache(namespace="belooga_v1", l1_max_size=4096)
