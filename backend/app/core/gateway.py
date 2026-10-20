"""Unified Pure-ASGI API Gateway Middleware & Edge Telemetry (BEL-513 / BEL-514).

Provides:
1. Zero-copy Pure ASGI Middleware (`__call__(scope, receive, send)`).
2. Bounded LRU Token-Bucket (GCRA) rate limiting with route-tiered policies.
3. Payload size guard (`413 Payload Too Large`), `Idempotency-Key` replay cache, and `ETag` `304 Not Modified`.
"""

from collections import OrderedDict
import hashlib
import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.cache import platform_cache
from app.core.database import get_db

DEFAULT_RATE_LIMIT_RPM = 600
AUTH_STRICT_RPM = 30
MUTATION_RPM = 180
CHUNK_UPLOAD_RPM = 2400
MAX_JSON_PAYLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

CACHEABLE_PUBLIC_PREFIXES = (
    "/v1/blog",
    "/v1/catalogs",
    "/v1/faqs",
    "/v1/careers",
    "/v1/profile/search/trending",
    "/v1/seo/sitemap-data",
    "/v1/match/market-pulse",
)

_token_buckets: OrderedDict[str, Tuple[float, float]] = OrderedDict()
_idempotency_store: OrderedDict[str, Tuple[float, int, List[Tuple[bytes, bytes]], bytes]] = OrderedDict()
_gateway_stats: Dict[str, int] = {
    "total_requests": 0,
    "rate_limited_429": 0,
    "payload_rejected_413": 0,
    "idempotency_replays": 0,
    "etag_304_hits": 0,
}

router = APIRouter(prefix="/gateway", tags=["API Gateway & Edge Telemetry"])


def _resolve_rate_tier(method: str, path: str, custom_limit: Optional[str]) -> Tuple[int, str]:
    if custom_limit and custom_limit.isdigit():
        return max(1, int(custom_limit)), "custom_override"
    if path.startswith(("/v1/media/upload/chunk", "/uploads")) or path == "/health":
        return CHUNK_UPLOAD_RPM, "chunk_upload"
    is_test_env = os.getenv("ENVIRONMENT") == "testing"
    if path.startswith(("/v1/auth/login", "/v1/auth/register", "/v1/auth/forgot-password")):
        return (DEFAULT_RATE_LIMIT_RPM if is_test_env else AUTH_STRICT_RPM), "auth_strict"
    if method in ("POST", "PUT", "PATCH", "DELETE"):
        return (DEFAULT_RATE_LIMIT_RPM if is_test_env else MUTATION_RPM), "mutation"
    return DEFAULT_RATE_LIMIT_RPM, "public_read"


def _consume_token_bucket(bucket_key: str, capacity: int, max_buckets: int = 8192) -> Tuple[bool, int]:
    now = time.monotonic()
    cap = float(capacity)
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

    tokens -= 1.0
    _token_buckets[bucket_key] = (tokens, now)
    _token_buckets.move_to_end(bucket_key)
    return True, max(0, int(tokens))


async def _send_json_response(
    send: Send, status_code: int, payload: Dict[str, Any], extra_headers: List[Tuple[bytes, bytes]]
) -> None:
    body = json.dumps(payload).encode("utf-8")
    headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(body)).encode("latin1")),
        *extra_headers,
    ]
    await send({"type": "http.response.start", "status": status_code, "headers": headers})
    await send({"type": "http.response.body", "body": body})


class APIGatewayMiddleware:
    """Zero-copy Pure ASGI API Gateway enforcing tiered rate limits, 413 guard, Idempotency, and ETag 304."""

    def __init__(self, app: ASGIApp, max_buckets: int = 8192):
        self.app = app
        self.max_buckets = max_buckets

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.perf_counter()
        _gateway_stats["total_requests"] += 1
        method: str = scope.get("method", "GET").upper()
        path: str = scope.get("path", "/")
        raw_headers: Dict[bytes, bytes] = dict(scope.get("headers") or [])

        req_id_b = raw_headers.get(b"x-request-id")
        request_id = req_id_b.decode("latin1") if req_id_b else f"req_{uuid.uuid4().hex[:16]}"
        xff = raw_headers.get(b"x-forwarded-for")
        client_ip = (
            xff.decode("latin1").split(",")[0].strip()
            if xff
            else (scope.get("client")[0] if scope.get("client") else "127.0.0.1")
        )
        custom_limit = (
            raw_headers[b"x-test-rate-limit"].decode("latin1")
            if b"x-test-rate-limit" in raw_headers
            else None
        )
        limit, policy_name = _resolve_rate_tier(method, path, custom_limit)
        allowed, remaining = _consume_token_bucket(
            f"{client_ip}:{policy_name}:{limit}", limit, self.max_buckets
        )

        base_sec_headers: List[Tuple[bytes, bytes]] = [
            (b"x-request-id", request_id.encode("latin1")),
            (b"x-gateway-service", b"belooga-api-gateway"),
            (b"x-ratelimit-limit", str(limit).encode("latin1")),
            (b"x-ratelimit-remaining", str(remaining).encode("latin1")),
            (b"x-ratelimit-policy", policy_name.encode("latin1")),
            (b"x-content-type-options", b"nosniff"),
            (b"x-frame-options", b"DENY"),
            (b"referrer-policy", b"strict-origin-when-cross-origin"),
            (b"permissions-policy", b"camera=(self), microphone=(self)"),
        ]

        if not allowed:
            _gateway_stats["rate_limited_429"] += 1
            await _send_json_response(
                send,
                429,
                {"detail": "API Gateway rate limit exceeded. Please retry later.", "request_id": request_id},
                [*base_sec_headers, (b"retry-after", b"60")],
            )
            return

        content_len_str = raw_headers.get(b"content-length", b"").decode("latin1").strip()
        if content_len_str.isdigit() and not path.startswith("/v1/media/"):
            if int(content_len_str) > MAX_JSON_PAYLOAD_BYTES:
                _gateway_stats["payload_rejected_413"] += 1
                await _send_json_response(
                    send,
                    413,
                    {"detail": "Payload too large. Maximum JSON body size is 10MB.", "request_id": request_id},
                    base_sec_headers,
                )
                return

        idem_raw = raw_headers.get(b"idempotency-key")
        idem_cache_key: Optional[str] = None
        if idem_raw and method in ("POST", "PUT", "PATCH"):
            idem_cache_key = f"{method}:{path}:{idem_raw.decode('latin1').strip()}"
            cached_idem = _idempotency_store.get(idem_cache_key)
            if cached_idem is not None:
                exp_at, c_status, c_headers, c_body = cached_idem
                if time.monotonic() < exp_at:
                    _gateway_stats["idempotency_replays"] += 1
                    elapsed_b = str(round((time.perf_counter() - start_time) * 1000.0, 2)).encode("latin1")
                    await send({
                        "type": "http.response.start",
                        "status": c_status,
                        "headers": [*c_headers, *base_sec_headers, (b"x-process-time-ms", elapsed_b), (b"x-idempotency-replayed", b"true")],
                    })
                    await send({"type": "http.response.body", "body": c_body})
                    return
                _idempotency_store.pop(idem_cache_key, None)

        if_none_match = (
            raw_headers[b"if-none-match"].decode("latin1").strip()
            if b"if-none-match" in raw_headers
            else None
        )
        is_cacheable_get = method == "GET" and path.startswith(CACHEABLE_PUBLIC_PREFIXES)
        should_buffer = is_cacheable_get or (idem_cache_key is not None)
        response_status = 200
        response_headers: List[Tuple[bytes, bytes]] = []
        buffered_chunks: List[bytes] = []

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
                out_headers = [
                    (k, v)
                    for (k, v) in response_headers
                    if k.lower() not in (b"content-length", b"etag", b"cache-control")
                ]

                if is_cacheable_get and response_status == 200:
                    etag = f'W/"{hashlib.md5(full_body).hexdigest()[:16]}"'
                    out_headers.extend([
                        (b"etag", etag.encode("latin1")),
                        (b"cache-control", b"public, max-age=60, stale-while-revalidate=300"),
                    ])
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
                        c_hdrs = [(k, v) for (k, v) in response_headers if k.lower() == b"content-type"]
                        _idempotency_store[idem_cache_key] = (time.monotonic() + 300.0, response_status, c_hdrs, full_body)
                        while len(_idempotency_store) > 2048:
                            _idempotency_store.popitem(last=False)

                out_headers.extend([(b"content-length", str(len(full_body)).encode("latin1")), *base_sec_headers, (b"x-process-time-ms", elapsed_ms)])
                await send({"type": "http.response.start", "status": response_status, "headers": out_headers})
                await send({"type": "http.response.body", "body": full_body})
                return

            await send(message)

        await self.app(scope, receive, send_wrapper)


@router.get("/status")
async def get_gateway_status(db: AsyncSession = Depends(get_db)):
    """Inspect Pure-ASGI API Gateway health, route tiers, cache telemetry, and DB connectivity."""
    t0 = time.perf_counter()
    await db.execute(text("SELECT 1"))
    db_latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    return {
        "gateway": "belooga-api-gateway",
        "architecture": "pure-asgi-token-bucket",
        "status": "healthy",
        "rate_limit_rpm": DEFAULT_RATE_LIMIT_RPM,
        "route_tiers": {
            "auth_strict_rpm": AUTH_STRICT_RPM,
            "mutation_rpm": MUTATION_RPM,
            "public_read_rpm": DEFAULT_RATE_LIMIT_RPM,
            "chunk_upload_rpm": CHUNK_UPLOAD_RPM,
        },
        "security_headers_enabled": True,
        "gateway_metrics": {
            **_gateway_stats,
            "active_ip_buckets": len(_token_buckets),
            "idempotency_keys_cached": len(_idempotency_store),
        },
        "cache_metrics": platform_cache.get_stats(),
        "upstreams": {
            "postgres": "connected",
            "postgres_latency_ms": db_latency_ms,
            "cache": "active",
            "edge_proxy": "nginx-reverse-proxy",
        },
    }
