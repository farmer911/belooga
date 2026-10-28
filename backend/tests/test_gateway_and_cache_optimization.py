"""TDD Test Suite for BEL-514: Pure ASGI Gateway, ETag 304, Idempotency-Key, and SWR Cache."""

import asyncio
import pytest
from httpx import ASGITransport, AsyncClient
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.cache import AsyncTieredCache, invalidate_candidate_cache, platform_cache
from app.core.gateway import APIGatewayMiddleware
from app.main import app
from app.modules.profile.service import profile_cache


@pytest.mark.asyncio
async def test_gateway_is_pure_asgi_and_enforces_bounded_lru_and_route_tiers(monkeypatch):
    """Verify APIGatewayMiddleware is Pure ASGI (not BaseHTTPMiddleware) and caps IP buckets."""
    assert not issubclass(APIGatewayMiddleware, BaseHTTPMiddleware)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Inspect gateway status for route tiers and cache telemetry
        status_res = await client.get("/v1/gateway/status")
        assert status_res.status_code == 200
        body = status_res.json()
        assert body["architecture"] == "pure-asgi-token-bucket"
        assert "route_tiers" in body
        assert body["route_tiers"]["auth_strict_rpm"] == 30
        assert body["route_tiers"]["chunk_upload_rpm"] >= 2400
        assert "cache_metrics" in body
        assert "hit_ratio_pct" in body["cache_metrics"]

        # 2. Enforce a settings-configured public read limit (client override header was removed)
        import uuid
        from app.core.config import get_settings
        monkeypatch.setattr(get_settings(), "RATE_LIMIT_PUBLIC_RPM", 2)
        monkeypatch.setattr(get_settings(), "TRUSTED_PROXY_IPS", "127.0.0.1")
        headers = {"X-Forwarded-For": f"203.0.113.{uuid.uuid4().int % 250 + 1}"}
        r1 = await client.get("/v1/faqs", headers=headers)
        r2 = await client.get("/v1/faqs", headers=headers)
        r3 = await client.get("/v1/faqs", headers=headers)
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r3.status_code == 429
        assert r3.headers.get("X-RateLimit-Remaining") == "0"
        assert "X-RateLimit-Policy" in r1.headers


@pytest.mark.asyncio
async def test_gateway_payload_size_guard_413_and_idempotency_replay():
    """Verify 413 Payload Too Large guard and Idempotency-Key replay protection."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. 413 Payload Too Large when Content-Length > 10MB on JSON endpoint
        oversized_res = await client.post(
            "/v1/contact/",
            content=b"{}",
            headers={"Content-Type": "application/json", "Content-Length": str(15 * 1024 * 1024)},
        )
        assert oversized_res.status_code == 413
        assert "Payload too large" in oversized_res.json()["detail"]

        # 2. Idempotency-Key replay on POST /v1/contact/
        idem_key = "idem_bel514_contact_001"
        payload = {
            "name": "Gateway Tester",
            "email": "gateway@belooga.com",
            "message": "Testing idempotency key replay at the API gateway layer.",
        }
        first = await client.post(
            "/v1/contact/",
            json=payload,
            headers={"Idempotency-Key": idem_key},
        )
        assert first.status_code in (200, 201)
        assert first.headers.get("X-Idempotency-Replayed") == "false"

        second = await client.post(
            "/v1/contact/",
            json=payload,
            headers={"Idempotency-Key": idem_key},
        )
        assert second.status_code == first.status_code
        assert second.headers.get("X-Idempotency-Replayed") == "true"
        assert second.json() == first.json()


@pytest.mark.asyncio
async def test_gateway_etag_and_conditional_304_not_modified():
    """Verify public read endpoints emit ETag & Cache-Control and short-circuit with 304."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res1 = await client.get("/v1/blog/posts/")
        assert res1.status_code == 200
        etag = res1.headers.get("ETag")
        assert etag is not None and etag.startswith('W/"')
        assert "public" in (res1.headers.get("Cache-Control") or "")

        # Conditional request with matching If-None-Match returns 304 with 0-byte body
        res2 = await client.get("/v1/blog/posts/", headers={"If-None-Match": etag})
        assert res2.status_code == 304
        assert res2.content == b""
        assert res2.headers.get("ETag") == etag
        assert res2.headers.get("X-Cache") == "HIT-304"


@pytest.mark.asyncio
async def test_tiered_cache_singleflight_swr_and_unified_invalidation():
    """Verify Singleflight coalescing, Stale-While-Revalidate (SWR), and unified profile invalidation."""
    cache = AsyncTieredCache(namespace="test_bel514", l1_max_size=128)
    load_count = 0

    async def slow_loader():
        nonlocal load_count
        load_count += 1
        await asyncio.sleep(0.02)
        return {"seq": load_count}

    # 1. Singleflight: 80 concurrent requests trigger slow_loader() exactly ONCE
    results = await asyncio.gather(
        *(cache.get_or_set("hot_key", ttl_seconds=1, stale_ttl_seconds=5, loader=slow_loader, force_cache=True) for _ in range(80))
    )
    assert load_count == 1
    assert all(r["seq"] == 1 for r in results)
    stats = cache.get_stats()
    assert stats["coalesced_requests"] >= 79

    # 2. Stale-While-Revalidate (SWR): expire soft TTL manually while keeping stale_until valid
    full_key = cache._full_key("hot_key")
    fresh_until, stale_until, val = cache._l1[full_key]
    cache._l1[full_key] = (fresh_until - 10.0, stale_until + 10.0, val)

    stale_res = await cache.get_or_set("hot_key", ttl_seconds=5, stale_ttl_seconds=10, loader=slow_loader, force_cache=True)
    # Immediately returns stale seq=1 while triggering background refresh to seq=2
    assert stale_res["seq"] == 1
    await asyncio.sleep(0.04)
    refreshed_res = await cache.get_or_set("hot_key", ttl_seconds=5, stale_ttl_seconds=10, loader=slow_loader, force_cache=True)
    assert refreshed_res["seq"] == 2
    assert cache.get_stats()["stale_swr_hits"] >= 1

    # 3. Verify profile_cache and platform_cache are unified (no split-brain invalidation bug)
    assert profile_cache is platform_cache
    await platform_cache.get_or_set("pub_profile:alexnguyen", 60, lambda: asyncio.sleep(0, result={"u": "alex"}), force_cache=True)
    await platform_cache.get_or_set("trust:alexnguyen", 60, lambda: asyncio.sleep(0, result={"t": 90}), force_cache=True)
    await platform_cache.get_or_set("trajectory:alexnguyen", 60, lambda: asyncio.sleep(0, result={"lvl": "Senior"}), force_cache=True)

    await invalidate_candidate_cache("alexnguyen")
    assert platform_cache._l1_get(platform_cache._full_key("pub_profile:alexnguyen"))[0] is False
    assert platform_cache._l1_get(platform_cache._full_key("trust:alexnguyen"))[0] is False
    assert platform_cache._l1_get(platform_cache._full_key("trajectory:alexnguyen"))[0] is False


@pytest.mark.asyncio
async def test_distributed_redis_gateway_rate_limit_idempotency_and_k8s_ingress(monkeypatch):
    """BEL-137: Verify Redis-backed distributed rate-limiting & idempotency across stateless worker restarts."""
    from pathlib import Path
    import uuid
    from app.core import gateway as gw_mod

    assert hasattr(gw_mod, "clear_gateway_l1_state"), "Missing clear_gateway_l1_state helper for multi-pod test"
    from app.core.config import get_settings
    monkeypatch.setattr(get_settings(), "GATEWAY_REDIS_ENABLED", True)
    monkeypatch.setattr(get_settings(), "RATE_LIMIT_PUBLIC_RPM", 2)
    monkeypatch.setattr(get_settings(), "TRUSTED_PROXY_IPS", "127.0.0.1")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Cross-worker Distributed Idempotency-Key Replay via Redis (L1 wiped between calls)
        idem_key = f"idem_bel137_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": "Distributed Gateway Tester",
            "email": "dist-gateway@belooga.com",
            "message": "Verifying Redis-backed cross-replica idempotency replay.",
        }
        first = await client.post("/v1/contact/", json=payload, headers={"Idempotency-Key": idem_key})
        assert first.status_code in (200, 201)
        assert first.headers.get("X-Idempotency-Replayed") == "false"

        # Simulate landing on a second K8s replica with empty L1 memory
        gw_mod.clear_gateway_l1_state()
        second = await client.post("/v1/contact/", json=payload, headers={"Idempotency-Key": idem_key})
        assert second.status_code == first.status_code
        assert second.headers.get("X-Idempotency-Replayed") == "true"
        assert second.headers.get("X-Idempotency-Backend") == "redis"
        assert second.json() == first.json()

        # 2. Cross-worker Distributed Rate-Limiting via Redis (L1 wiped before each call)
        test_ip = f"198.51.100.{uuid.uuid4().int % 200 + 10}"
        rl_headers = {"X-Forwarded-For": test_ip}

        gw_mod.clear_gateway_l1_state()
        r1 = await client.get("/v1/faqs", headers=rl_headers)
        assert r1.status_code == 200

        gw_mod.clear_gateway_l1_state()
        r2 = await client.get("/v1/faqs", headers=rl_headers)
        assert r2.status_code == 200

        gw_mod.clear_gateway_l1_state()
        r3 = await client.get("/v1/faqs", headers=rl_headers)
        assert r3.status_code == 429

        # 3. Verify /v1/gateway/status reports distributed Redis state & K8s Ingress / client gateway wiring
        status_res = await client.get("/v1/gateway/status")
        assert status_res.status_code == 200
        status_body = status_res.json()
        assert status_body.get("state_backend") == "redis-distributed-l1-fallback"
        assert status_body["upstreams"].get("redis") == "connected"
        assert status_body["gateway_metrics"].get("redis_distributed_ops", 0) >= 3

        root = Path(__file__).resolve().parents[2]
        k8s_txt = (root / "k8s/deployment-and-hpa.yaml").read_text()
        assert "kind: Ingress" in k8s_txt
        assert "belooga-edge-ingress" in k8s_txt
        fe_api_txt = (root / "frontend/src/services/api-client.ts").read_text()
        mob_api_txt = (root / "mobile/src/services/api-client.ts").read_text()
        assert "http://localhost:8080" in fe_api_txt
        assert "http://localhost:8080" in mob_api_txt

        # 4. BEL-138: Verify services, E2E specs, and README route through Edge Gateway (:8080)
        bi_res = await client.get("/v1/analytics/bi-export?limit=10")
        assert bi_res.status_code == 200
        bi_body = bi_res.json()
        assert "http://localhost:8080/v1/analytics/bi-export" in bi_body["power_bi_m_query_snippet"]
        assert "http://localhost:8080/v1/analytics/bi-export" in bi_body["duckdb_sql_snippet"]

        for rel_file in [
            "backend/app/modules/profile/service.py",
            "backend/app/core/config.py",
            "frontend/src/hooks/use-analytics-dashboard.ts",
            "qc/tests/e2e/workspace.spec.ts",
            "qc/tests/e2e/expert-review.spec.ts",
        ]:
            content = (root / rel_file).read_text()
            assert "http://localhost:8000" not in content, f"{rel_file} still hardcodes :8000 instead of Gateway :8080"
            assert "http://localhost:8080" in content

        readme_txt = (root / "README.md").read_text()
        assert "http://localhost:8080" in readme_txt
        assert "belooga-gateway" in readme_txt

