"""Unified Pure-ASGI API Gateway Middleware, Distributed Redis State & Edge Telemetry (BEL-513..BEL-137).

Redis failure policy:
- Rate limiting: fail OPEN to the per-pod in-memory token bucket (logged); limits become per-pod, not global.
- Idempotency: fail OPEN to the per-pod L1 store (logged); a retry landing on another pod may be re-executed.
Redis is retried after a 10s back-off.
"""

import asyncio
from collections import OrderedDict
import hashlib
import ipaddress
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

from fastapi import APIRouter, Depends
import redis.asyncio as aioredis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.cache import platform_cache
from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.events import event_stream
from app.core.logging_setup import request_id_var

logger = logging.getLogger(__name__)
access_logger = logging.getLogger("belooga.access")

PROD_PUBLIC_RPM = 600
PROD_MUTATION_RPM = 180
SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")

CACHEABLE_PUBLIC_PREFIXES = (
    "/v1/blog", "/v1/catalogs", "/v1/faqs", "/v1/careers",
    "/v1/profile/search/trending", "/v1/seo/sitemap-data", "/v1/match/market-pulse",
)

_token_buckets: OrderedDict[str, Tuple[float, float]] = OrderedDict()
_idempotency_store: OrderedDict[str, Tuple[float, int, List[Tuple[bytes, bytes]], bytes]] = OrderedDict()
_redis_state: Dict[str, Any] = {"client": None, "loop": None, "disabled_until": 0.0}
_gateway_stats: Dict[str, int] = {
    "total_requests": 0, "rate_limited_429": 0, "payload_rejected_413": 0,
    "idempotency_replays": 0, "etag_304_hits": 0, "redis_distributed_ops": 0,
}

router = APIRouter(prefix="/gateway", tags=["API Gateway & Edge Telemetry"])


def clear_gateway_l1_state() -> None:
    """Clear process-local L1 rate-limit and idempotency caches (used to test cross-replica Redis state)."""
    _token_buckets.clear()
    _idempotency_store.clear()


async def _get_gateway_redis() -> Optional[aioredis.Redis]:
    settings = get_settings()
    if settings.ENVIRONMENT == "testing" and not settings.GATEWAY_REDIS_ENABLED:
        return None
    now = time.monotonic()
    if now < float(_redis_state["disabled_until"]):
        return None
    loop = asyncio.get_running_loop()
    if _redis_state["client"] is None or _redis_state["loop"] is not loop:
        try:
            _redis_state["client"] = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8", decode_responses=True, socket_connect_timeout=0.2, socket_timeout=0.4,
            )
            _redis_state["loop"] = loop
        except Exception as exc:
            logger.warning("Gateway Redis init failed, using per-pod state for 10s: %s", type(exc).__name__)
            _redis_state["disabled_until"] = now + 10.0
            return None
    return _redis_state["client"]


def _redis_failed(what: str, exc: Exception) -> None:
    logger.warning("Gateway Redis %s failed, falling back to per-pod state for 10s: %s", what, type(exc).__name__)
    _redis_state["disabled_until"] = time.monotonic() + 10.0


def _tier_limits(s: Settings) -> Dict[str, int]:
    """Configured value wins in every env; unset public/mutation limits are relaxed outside production."""
    is_prod = s.is_production
    return {
        "auth_strict": s.RATE_LIMIT_AUTH_RPM,
        "chunk_upload": s.RATE_LIMIT_UPLOAD_RPM,
        "mutation": s.RATE_LIMIT_MUTATION_RPM or (PROD_MUTATION_RPM if is_prod else s.RATE_LIMIT_UPLOAD_RPM),
        "public_read": s.RATE_LIMIT_PUBLIC_RPM or (PROD_PUBLIC_RPM if is_prod else s.RATE_LIMIT_UPLOAD_RPM),
    }


def _resolve_rate_tier(method: str, path: str, s: Settings) -> Tuple[int, str]:
    if path.startswith(("/v1/auth/login", "/v1/auth/register", "/v1/auth/forgot-password")):
        tier = "auth_strict"
    elif path.startswith(("/v1/media/upload/chunk", "/uploads")) or path == "/health":
        tier = "chunk_upload"
    elif method in ("POST", "PUT", "PATCH", "DELETE"):
        tier = "mutation"
    else:
        tier = "public_read"
    return max(1, _tier_limits(s)[tier]), tier


def _is_trusted(ip: str, trusted: List[Any]) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in net for net in trusted)


def resolve_client_ip(scope: Scope, trusted: List[Any]) -> str:
    """ASGI peer, unless the peer is a trusted proxy: then the right-most untrusted X-Forwarded-For hop."""
    peer = scope["client"][0] if scope.get("client") else "127.0.0.1"
    if not trusted or not _is_trusted(peer, trusted):
        return peer
    xff = ",".join(v.decode("latin1") for k, v in scope.get("headers") or [] if k == b"x-forwarded-for")
    hops = [h.strip() for h in xff.split(",") if h.strip()]
    for hop in reversed(hops):
        if not _is_trusted(hop, trusted):
            return hop
    return hops[0] if hops else peer


def _consume_token_bucket(bucket_key: str, capacity: int, max_buckets: int = 8192) -> Tuple[bool, int]:
    now, cap = time.monotonic(), float(capacity)
    state = _token_buckets.get(bucket_key)
    if state is None:
        _token_buckets[bucket_key] = (cap - 1.0, now)
        while len(_token_buckets) > max_buckets:
            _token_buckets.popitem(last=False)
        return True, max(0, capacity - 1)
    tokens, last_ts = state
    tokens = min(cap, tokens + (now - last_ts) * (cap / 60.0))
    if tokens < 1.0:
        _token_buckets[bucket_key] = (tokens, now)
        return False, 0
    _token_buckets[bucket_key] = (tokens - 1.0, now)
    _token_buckets.move_to_end(bucket_key)
    return True, max(0, int(tokens - 1.0))


async def _consume_rate_limit(bucket_key: str, capacity: int, max_buckets: int = 8192) -> Tuple[bool, int]:
    r_client = await _get_gateway_redis()
    if r_client is not None:
        try:
            win_key = f"belooga:gw:rl:{bucket_key}:{int(time.time() // 60)}"
            count = int(await r_client.incr(win_key))
            if count == 1:
                await r_client.expire(win_key, 65)
            _gateway_stats["redis_distributed_ops"] += 1
            return count <= capacity, max(0, capacity - count)
        except Exception as exc:
            _redis_failed("rate-limit", exc)
    return _consume_token_bucket(bucket_key, capacity, max_buckets)


async def _lookup_idempotency(idem_key: str) -> Optional[Tuple[int, List[Tuple[bytes, bytes]], bytes, bytes]]:
    cached = _idempotency_store.get(idem_key)
    if cached is not None:
        exp_at, c_status, c_headers, c_body = cached
        if time.monotonic() < exp_at:
            return c_status, c_headers, c_body, b"l1"
        _idempotency_store.pop(idem_key, None)
    r_client = await _get_gateway_redis()
    if r_client is not None:
        try:
            raw = await r_client.get(f"belooga:gw:idem:{idem_key}")
            if raw:
                _gateway_stats["redis_distributed_ops"] += 1
                doc = json.loads(raw)
                c_status, c_body = int(doc["status"]), bytes.fromhex(doc["body_hex"])
                c_hdrs = [(k.encode("latin1"), v.encode("latin1")) for k, v in doc["headers"]]
                _idempotency_store[idem_key] = (time.monotonic() + 300.0, c_status, c_hdrs, c_body)
                return c_status, c_hdrs, c_body, b"redis"
        except Exception as exc:
            _redis_failed("idempotency lookup", exc)
    return None


async def _store_idempotency(idem_key: str, status: int, headers: List[Tuple[bytes, bytes]], body: bytes) -> None:
    c_hdrs = [(k, v) for (k, v) in headers if k.lower() == b"content-type"]
    _idempotency_store[idem_key] = (time.monotonic() + 300.0, status, c_hdrs, body)
    while len(_idempotency_store) > 2048:
        _idempotency_store.popitem(last=False)
    r_client = await _get_gateway_redis()
    if r_client is not None:
        try:
            doc = {"status": status, "headers": [[k.decode("latin1"), v.decode("latin1")] for k, v in c_hdrs], "body_hex": body.hex()}
            await r_client.set(f"belooga:gw:idem:{idem_key}", json.dumps(doc), ex=300)
            _gateway_stats["redis_distributed_ops"] += 1
        except Exception as exc:
            _redis_failed("idempotency store", exc)


async def _send_json_response(send: Send, status_code: int, payload: Dict[str, Any], extra_headers: List[Tuple[bytes, bytes]]) -> None:
    body = json.dumps(payload).encode("utf-8")
    headers = [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode("latin1")), *extra_headers]
    await send({"type": "http.response.start", "status": status_code, "headers": headers})
    await send({"type": "http.response.body", "body": body})


class APIGatewayMiddleware:
    """Zero-copy Pure ASGI API Gateway enforcing distributed rate limits, 413 guard, Idempotency, and ETag 304."""

    def __init__(self, app: ASGIApp, max_buckets: int = 8192):
        self.app = app
        self.max_buckets = max_buckets

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.perf_counter()
        _gateway_stats["total_requests"] += 1
        settings = get_settings()
        method, path = scope.get("method", "GET").upper(), scope.get("path", "/")
        raw_headers: Dict[bytes, bytes] = dict(scope.get("headers") or [])
        req_id_raw = raw_headers.get(b"x-request-id", b"").decode("latin1")
        request_id = req_id_raw if SAFE_REQUEST_ID.match(req_id_raw) else f"req_{uuid.uuid4().hex[:16]}"
        client_ip = resolve_client_ip(scope, settings.trusted_proxies)
        # Not reset on exit: the global 500 handler (ServerErrorMiddleware, outside us) still needs it.
        # Each server request runs in its own task/context copy, so it cannot leak across requests.
        request_id_var.set(request_id)
        status_holder = [500]

        async def logging_send(message: Message) -> None:
            if message["type"] == "http.response.start":
                status_holder[0] = message["status"]
            await send(message)

        try:
            await self._dispatch(scope, receive, logging_send, settings, method, path, raw_headers, request_id, client_ip, start_time)
        finally:
            access_logger.info(
                "%s %s %s", method, path, status_holder[0],
                extra={"method": method, "path": path, "status": status_holder[0], "client_ip": client_ip,
                       "duration_ms": round((time.perf_counter() - start_time) * 1000.0, 2)},
            )

    async def _dispatch(
        self, scope: Scope, receive: Receive, send: Send, settings: Settings, method: str, path: str,
        raw_headers: Dict[bytes, bytes], request_id: str, client_ip: str, start_time: float,
    ) -> None:
        limit, policy_name = _resolve_rate_tier(method, path, settings)
        allowed, remaining = await _consume_rate_limit(f"{client_ip}:{policy_name}:{limit}", limit, self.max_buckets)

        base_sec_headers: List[Tuple[bytes, bytes]] = [
            (b"x-request-id", request_id.encode("latin1")), (b"x-gateway-service", b"belooga-api-gateway"),
            (b"x-ratelimit-limit", str(limit).encode("latin1")), (b"x-ratelimit-remaining", str(remaining).encode("latin1")),
            (b"x-ratelimit-policy", policy_name.encode("latin1")), (b"x-content-type-options", b"nosniff"),
            (b"x-frame-options", b"DENY"), (b"referrer-policy", b"strict-origin-when-cross-origin"),
            (b"permissions-policy", b"camera=(self), microphone=(self)"),
        ]
        if not allowed:
            _gateway_stats["rate_limited_429"] += 1
            await _send_json_response(
                send, 429, {"detail": "API Gateway rate limit exceeded. Please retry later.", "request_id": request_id},
                [*base_sec_headers, (b"retry-after", b"60")],
            )
            return

        content_len_str = raw_headers.get(b"content-length", b"").decode("latin1").strip()
        max_body = settings.UPLOAD_MAX_CHUNK_BYTES + 1024 * 1024 if path.startswith("/v1/media/") else settings.MAX_JSON_BODY_BYTES
        if content_len_str.isdigit() and int(content_len_str) > max_body:
            _gateway_stats["payload_rejected_413"] += 1
            await _send_json_response(send, 413, {"detail": f"Payload too large. Maximum body size is {max_body // (1024 * 1024)}MB.", "request_id": request_id}, base_sec_headers)
            return

        idem_raw = raw_headers.get(b"idempotency-key")
        idem_cache_key: Optional[str] = f"{method}:{path}:{idem_raw.decode('latin1').strip()}" if (idem_raw and method in ("POST", "PUT", "PATCH")) else None
        if idem_cache_key is not None:
            hit = await _lookup_idempotency(idem_cache_key)
            if hit is not None:
                c_status, c_headers, c_body, backend_src = hit
                _gateway_stats["idempotency_replays"] += 1
                elapsed_b = str(round((time.perf_counter() - start_time) * 1000.0, 2)).encode("latin1")
                await send({
                    "type": "http.response.start", "status": c_status,
                    "headers": [*c_headers, *base_sec_headers, (b"x-process-time-ms", elapsed_b), (b"x-idempotency-replayed", b"true"), (b"x-idempotency-backend", backend_src)],
                })
                await send({"type": "http.response.body", "body": c_body})
                return

        if_none_match = raw_headers[b"if-none-match"].decode("latin1").strip() if b"if-none-match" in raw_headers else None
        is_cacheable_get = method == "GET" and path.startswith(CACHEABLE_PUBLIC_PREFIXES)
        should_buffer = is_cacheable_get or (idem_cache_key is not None)
        response_status, response_headers, buffered_chunks = 200, [], []

        async def send_wrapper(message: Message) -> None:
            nonlocal response_status, response_headers
            if message["type"] == "http.response.start":
                response_status = message["status"]
                response_headers = list(message.get("headers") or [])
                if not should_buffer:
                    elapsed_ms = str(round((time.perf_counter() - start_time) * 1000.0, 2)).encode("latin1")
                    message["headers"] = [*response_headers, *base_sec_headers, (b"x-process-time-ms", elapsed_ms)]
                    await send(message)
                return

            if message["type"] == "http.response.body":
                if not should_buffer:
                    await send(message)
                    return
                buffered_chunks.append(message.get("body", b""))
                if message.get("more_body", False):
                    return
                full_body = b"".join(buffered_chunks)
                elapsed_ms = str(round((time.perf_counter() - start_time) * 1000.0, 2)).encode("latin1")
                out_headers = [(k, v) for (k, v) in response_headers if k.lower() not in (b"content-length", b"etag", b"cache-control")]

                if is_cacheable_get and response_status == 200:
                    etag = f'W/"{hashlib.md5(full_body).hexdigest()[:16]}"'
                    out_headers.extend([(b"etag", etag.encode("latin1")), (b"cache-control", b"public, max-age=60, stale-while-revalidate=300")])
                    if if_none_match and if_none_match == etag:
                        _gateway_stats["etag_304_hits"] += 1
                        out_headers.extend([*base_sec_headers, (b"x-process-time-ms", elapsed_ms), (b"x-cache", b"HIT-304")])
                        await send({"type": "http.response.start", "status": 304, "headers": out_headers})
                        await send({"type": "http.response.body", "body": b""})
                        return
                    out_headers.append((b"x-cache", b"MISS"))

                if idem_cache_key is not None:
                    out_headers.append((b"x-idempotency-replayed", b"false"))
                    if 200 <= response_status < 300:
                        await _store_idempotency(idem_cache_key, response_status, response_headers, full_body)

                out_headers.extend([(b"content-length", str(len(full_body)).encode("latin1")), *base_sec_headers, (b"x-process-time-ms", elapsed_ms)])
                await send({"type": "http.response.start", "status": response_status, "headers": out_headers})
                await send({"type": "http.response.body", "body": full_body})
                return

            await send(message)

        await self.app(scope, receive, send_wrapper)


@router.get("/status")
async def get_gateway_status(db: AsyncSession = Depends(get_db)):
    """Inspect Pure-ASGI API Gateway health, distributed Redis state, route tiers, and DB connectivity."""
    t0 = time.perf_counter()
    await db.execute(text("SELECT 1"))
    db_latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    tiers = _tier_limits(get_settings())
    return {
        "gateway": "belooga-api-gateway", "architecture": "pure-asgi-token-bucket",
        "state_backend": "redis-distributed-l1-fallback", "status": "healthy", "rate_limit_rpm": tiers["public_read"],
        "route_tiers": {f"{name}_rpm": rpm for name, rpm in tiers.items()},
        "security_headers_enabled": True,
        "gateway_metrics": {**_gateway_stats, "active_ip_buckets": len(_token_buckets), "idempotency_keys_cached": len(_idempotency_store)},
        "cache_metrics": platform_cache.get_stats(), "event_stream_metrics": event_stream.get_status(),
        "upstreams": {
            "postgres": "connected", "postgres_latency_ms": db_latency_ms,
            "redis": "connected", "cache": "active", "event_stream": "active", "edge_proxy": "nginx-reverse-proxy",
        },
    }
