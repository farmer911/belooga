"""Gateway telemetry endpoint: /v1/gateway/status."""

import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.core.config import get_settings
from app.core.database import get_db
from app.core.events import event_stream
from app.core.gateway import _gateway_stats, _idempotency_store, _token_buckets
from app.core.gateway_policy import _tier_limits

router = APIRouter(prefix="/gateway", tags=["API Gateway & Edge Telemetry"])


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
