"""Two-Tier Async Cache (L1 Bounded LRU + L2 Redis) with Singleflight & Stale-While-Revalidate (SWR)."""

import asyncio
from collections import OrderedDict
import json
import logging
import time
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple

import redis.asyncio as aioredis

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class AsyncTieredCache:
    """High-concurrency L1/L2 cache with Singleflight coalescing and Stale-While-Revalidate (SWR)."""

    def __init__(self, namespace: str = "belooga", l1_max_size: int = 4096):
        self.namespace = namespace
        self.l1_max_size = l1_max_size
        # Maps full_key -> (fresh_until_monotonic, stale_until_monotonic, value)
        self._l1: OrderedDict[str, Tuple[float, float, Any]] = OrderedDict()
        self._inflight: Dict[str, asyncio.Future[Any]] = {}
        self._redis: Optional[aioredis.Redis] = None
        self._redis_disabled_until: float = 0.0
        self._metrics: Dict[str, int] = {
            "l1_hits": 0,
            "l2_hits": 0,
            "stale_swr_hits": 0,
            "misses": 0,
            "coalesced_requests": 0,
            "invalidations": 0,
        }

    def _full_key(self, key: str) -> str:
        return f"{self.namespace}:{key}"

    def get_stats(self) -> Dict[str, Any]:
        total_lookups = (
            self._metrics["l1_hits"]
            + self._metrics["l2_hits"]
            + self._metrics["stale_swr_hits"]
            + self._metrics["misses"]
            + self._metrics["coalesced_requests"]
        )
        effective_hits = (
            self._metrics["l1_hits"]
            + self._metrics["l2_hits"]
            + self._metrics["stale_swr_hits"]
            + self._metrics["coalesced_requests"]
        )
        hit_ratio = round((effective_hits / total_lookups) * 100.0, 2) if total_lookups > 0 else 100.0
        return {
            **self._metrics,
            "l1_entries": len(self._l1),
            "l1_max_size": self.l1_max_size,
            "inflight_keys": len(self._inflight),
            "hit_ratio_pct": hit_ratio,
        }

    async def _get_redis(self) -> Optional[aioredis.Redis]:
        if get_settings().ENVIRONMENT == "testing":
            return None
        now = time.monotonic()
        if now < self._redis_disabled_until:
            return None
        if self._redis is None:
            redis_url = get_settings().REDIS_URL
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
                logger.warning("Redis init failed, using L1-only cache for 15s: %s", type(exc).__name__)
                return None
        return self._redis

    def _l1_get(self, full_key: str) -> Tuple[bool, Any]:
        """Return (is_fresh_hit, value). Used by callers and tests checking fresh L1 state."""
        entry = self._l1.get(full_key)
        if entry is None:
            return False, None
        fresh_until, stale_until, val = entry
        now = time.monotonic()
        if now >= stale_until:
            self._l1.pop(full_key, None)
            return False, None
        if now >= fresh_until:
            return False, val
        self._l1.move_to_end(full_key)
        return True, val

    def _l1_lookup_with_swr(self, full_key: str) -> Tuple[str, Any]:
        """Return ('FRESH' | 'STALE' | 'MISS', value)."""
        entry = self._l1.get(full_key)
        if entry is None:
            return "MISS", None
        fresh_until, stale_until, val = entry
        now = time.monotonic()
        if now < fresh_until:
            self._l1.move_to_end(full_key)
            return "FRESH", val
        if now < stale_until:
            return "STALE", val
        self._l1.pop(full_key, None)
        return "MISS", None

    def _l1_set(
        self, full_key: str, value: Any, ttl_seconds: int, stale_ttl_seconds: int = 0
    ) -> None:
        now = time.monotonic()
        fresh_until = now + max(1, ttl_seconds)
        stale_until = fresh_until + max(0, stale_ttl_seconds)
        self._l1[full_key] = (fresh_until, stale_until, value)
        self._l1.move_to_end(full_key)
        while len(self._l1) > self.l1_max_size:
            self._l1.popitem(last=False)

    async def _populate_singleflight(
        self,
        full_key: str,
        ttl_seconds: int,
        stale_ttl_seconds: int,
        loader: Callable[[], Awaitable[Any]],
        l1_ttl_seconds: Optional[int],
        fut: asyncio.Future[Any],
        check_l2: bool = True,
    ) -> Any:
        try:
            r_client = await self._get_redis()
            if check_l2 and r_client is not None:
                try:
                    raw = await r_client.get(full_key)
                    if raw is not None:
                        loaded = json.loads(raw)
                        effective_l1 = min(ttl_seconds, l1_ttl_seconds or 15)
                        self._l1_set(full_key, loaded, effective_l1, stale_ttl_seconds)
                        self._metrics["l2_hits"] += 1
                        if not fut.done():
                            fut.set_result(loaded)
                        return loaded
                except Exception as exc:
                    self._redis_disabled_until = time.monotonic() + 10.0
                    logger.warning("Redis read failed, falling back to loader (L2 off 10s): %s", type(exc).__name__)

            result = await loader()
            effective_l1 = min(ttl_seconds, l1_ttl_seconds or ttl_seconds)
            self._l1_set(full_key, result, effective_l1, stale_ttl_seconds)

            if r_client is not None:
                try:
                    await r_client.setex(full_key, ttl_seconds, json.dumps(result, default=str))
                except Exception as exc:
                    self._redis_disabled_until = time.monotonic() + 10.0
                    logger.warning("Redis write failed (L2 off 10s): %s", type(exc).__name__)

            if not fut.done():
                fut.set_result(result)
            return result
        except Exception as exc:
            if not fut.done():
                fut.set_exception(exc)
            raise
        finally:
            self._inflight.pop(full_key, None)

    async def get_or_set(
        self,
        key: str,
        ttl_seconds: int,
        loader: Callable[[], Awaitable[Any]],
        l1_ttl_seconds: Optional[int] = None,
        stale_ttl_seconds: int = 0,
        force_cache: bool = False,
    ) -> Any:
        full_key = self._full_key(key)
        status, val = self._l1_lookup_with_swr(full_key)
        if status == "FRESH":
            self._metrics["l1_hits"] += 1
            return val

        if status == "STALE":
            self._metrics["stale_swr_hits"] += 1
            if full_key not in self._inflight:
                loop = asyncio.get_running_loop()
                bg_fut: asyncio.Future[Any] = loop.create_future()
                self._inflight[full_key] = bg_fut
                asyncio.create_task(
                    self._populate_singleflight(
                        full_key,
                        ttl_seconds,
                        stale_ttl_seconds,
                        loader,
                        l1_ttl_seconds,
                        bg_fut,
                        check_l2=False,
                    )
                )
            return val

        inflight = self._inflight.get(full_key)
        if inflight is not None:
            self._metrics["coalesced_requests"] += 1
            return await asyncio.shield(inflight)

        self._metrics["misses"] += 1
        loop = asyncio.get_running_loop()
        fut: asyncio.Future[Any] = loop.create_future()
        self._inflight[full_key] = fut
        return await self._populate_singleflight(
            full_key, ttl_seconds, stale_ttl_seconds, loader, l1_ttl_seconds, fut, check_l2=True
        )

    async def invalidate_prefix(self, prefix: str = "") -> None:
        self._metrics["invalidations"] += 1
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
                logger.warning("Redis prefix invalidation failed; other pods may serve stale L2 entries until TTL: %s", type(exc).__name__)


platform_cache = AsyncTieredCache(namespace="belooga_v1", l1_max_size=4096)


async def invalidate_candidate_cache(username: str) -> None:
    """Unified cross-module cache invalidation for candidate profile, trust, trajectory, and search."""
    clean = username.lower().strip()
    await platform_cache.invalidate_prefix(f"pub_profile:{clean}")
    await platform_cache.invalidate_prefix(f"trust:{clean}")
    await platform_cache.invalidate_prefix(f"trajectory:{clean}")
    await platform_cache.invalidate_prefix("search:")
    await platform_cache.invalidate_prefix("suggest:")
    await platform_cache.invalidate_prefix("bookmarks:")

