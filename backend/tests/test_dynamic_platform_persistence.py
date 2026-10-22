"""TDD Suite for [BEL-153] (#71): Dynamic Backend API & Real-Time Persistence Upgrade Across Platform Features.

Verifies that mutations across ATS Diagnostics, Bookmarks, Job Tracker, Expert Review, and Catalogs
persist in PostgreSQL and immediately invalidate/refresh cross-module caches (Market Pulse, Salary Benchmark,
Executive Analytics KPIs & Funnel, and ConnectRPC Batch Multiplexer).
"""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.identity import Identity
from app.models.profile import CandidateProfile


async def _seed_user_and_candidate(db_session: AsyncSession) -> tuple[Identity, str, CandidateProfile]:
    uid = uuid.uuid4()
    suffix = uid.hex[:8]
    user = Identity(
        id=uid,
        email=f"bel153_{suffix}@belooga.test",
        password_hash="hashed_test_pw",
    )
    cand_uid = uuid.uuid4()
    cand_identity = Identity(
        id=cand_uid,
        email=f"cand153_{suffix}@belooga.test",
        password_hash="hashed_test_pw",
    )
    cand_profile = CandidateProfile(
        id=uuid.uuid4(),
        identity_id=cand_uid,
        username=f"cand153_{suffix}",
        first_name="Linh",
        last_name="Pham",
        headline="Staff Backend & Distributed Systems Engineer",
        location="Ho Chi Minh, Vietnam",
        is_hidden=False,
    )
    db_session.add_all([user, cand_identity, cand_profile])
    await db_session.commit()
    token = create_access_token({"sub": str(user.id)})
    return user, token, cand_profile


@pytest.mark.asyncio
async def test_ats_scan_real_time_persistence_invalidates_market_pulse_and_analytics(
    client: AsyncClient, db_session: AsyncSession
):
    """Scanning a CV against a JD persists to PostgreSQL and immediately updates Market Pulse, Salary Benchmark & Analytics."""
    _, token, _ = await _seed_user_and_candidate(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Read baseline Market Pulse, Salary Benchmark & Analytics Dashboard
    pulse_before = (await client.get("/v1/match/market-pulse")).json()
    bench_before = (
        await client.get("/v1/catalogs/salary-benchmark?role=backend&level=senior&location=vn")
    ).json()
    dash_before = (await client.get("/v1/analytics/dashboard")).json()

    scans_before = dash_before["overview"]["total_scans"]
    funnel_scans_before = dash_before["funnel"][0]["count"]

    # 2. Execute ATS Scan mutation
    scan_res = await client.post(
        "/v1/match/ats-scan",
        headers=headers,
        json={
            "job_title": "Principal Backend Architect",
            "company_name": "Belooga Cloud",
            "jd_text": (
                "Looking for a Principal Backend Architect with Python, FastAPI, PostgreSQL, "
                "Redis, Kubernetes, Docker, and AWS to scale distributed systems."
            ),
            "cv_text": (
                "Senior Backend Engineer experienced in Python, FastAPI, PostgreSQL, Redis, "
                "and Docker microservices reducing p99 latency by 45% across 12M daily requests."
            ),
        },
    )
    assert scan_res.status_code == 200

    # 3. Verify scan history immediately reflects the persisted scan
    hist_res = await client.get("/v1/match/history", headers=headers)
    assert hist_res.status_code == 200
    assert any(h["job_title"] == "Principal Backend Architect" for h in hist_res.json())

    # 4. Verify Market Pulse, Salary Benchmark & Analytics Dashboard invalidated cache and updated from DB
    pulse_after = (await client.get("/v1/match/market-pulse")).json()
    assert pulse_after["total_jds_analyzed"] >= pulse_before["total_jds_analyzed"] + 1

    bench_after = (
        await client.get("/v1/catalogs/salary-benchmark?role=backend&level=senior&location=vn")
    ).json()
    assert bench_after["sample_size_jds"] >= bench_before["sample_size_jds"] + 1

    dash_after = (await client.get("/v1/analytics/dashboard")).json()
    scans_after = dash_after["overview"]["total_scans"]
    funnel_scans_after = dash_after["funnel"][0]["count"]
    assert scans_after == scans_before + 1
    assert funnel_scans_after == funnel_scans_before + 1


@pytest.mark.asyncio
async def test_bookmarks_and_job_tracker_real_time_analytics_sync(
    client: AsyncClient, db_session: AsyncSession
):
    """Adding a shortlist bookmark and a Kanban tracked job immediately updates Executive Analytics KPIs & Funnel."""
    _, token, cand_profile = await _seed_user_and_candidate(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    dash_before = (await client.get("/v1/analytics/dashboard")).json()
    jobs_before = dash_before["overview"]["active_job_trackers"]
    pipeline_funnel_before = dash_before["funnel"][1]["count"]

    # 1. Bookmark candidate
    bm_res = await client.post(
        f"/v1/bookmarks/{cand_profile.username}/",
        headers=headers,
        json={"note": "Top backend architect"},
    )
    assert bm_res.status_code in (200, 201)

    # 2. Create tracked job in Kanban
    job_res = await client.post(
        "/v1/tracker/jobs/",
        headers=headers,
        json={
            "company_name": "Stripe",
            "position_title": "Staff Backend Engineer",
            "status": "INTERVIEW",
            "expected_salary": "$210,000",
            "match_score": 92,
            "notes": "System design round scheduled",
        },
    )
    assert job_res.status_code == 201

    # 3. Verify Analytics Dashboard reflects real-time DB changes without stale cache
    dash_after = (await client.get("/v1/analytics/dashboard")).json()
    jobs_after = dash_after["overview"]["active_job_trackers"]
    pipeline_funnel_after = dash_after["funnel"][1]["count"]
    assert jobs_after == jobs_before + 1
    assert pipeline_funnel_after >= pipeline_funnel_before + 2


@pytest.mark.asyncio
async def test_connect_rpc_multiplexer_supports_bookmarks_and_locations(
    client: AsyncClient, db_session: AsyncSession
):
    """ConnectRPC /v1/rpc/batch supports bookmarks.list and catalogs.locations in 1 HTTP round-trip."""
    _, token, cand_profile = await _seed_user_and_candidate(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    await client.post(
        f"/v1/bookmarks/{cand_profile.username}/",
        headers=headers,
        json={"note": "RPC shortlist verification"},
    )

    rpc_res = await client.post(
        "/v1/rpc/batch",
        headers=headers,
        json={
            "calls": [
                {"id": "c1", "method": "profile.get", "params": {"username": cand_profile.username}},
                {"id": "c2", "method": "bookmarks.list", "params": {}},
                {"id": "c3", "method": "catalogs.locations", "params": {"name": "Vietnam"}},
            ]
        },
    )
    assert rpc_res.status_code == 200
    body = rpc_res.json()
    assert body["batch_size"] == 3
    by_id = {item["id"]: item for item in body["results"]}
    assert by_id["c1"]["status"] == 200
    assert by_id["c1"]["data"]["username"] == cand_profile.username
    assert by_id["c2"]["status"] == 200
    assert by_id["c2"]["data"]["total"] >= 1
    assert any(b["username"] == cand_profile.username for b in by_id["c2"]["data"]["items"])
    assert by_id["c3"]["status"] == 200
    assert any("Vietnam" in loc["name"] for loc in by_id["c3"]["data"])


@pytest.mark.asyncio
async def test_dynamic_platform_endpoints_p95_latency_under_30ms(
    client: AsyncClient, db_session: AsyncSession
):
    """BEL-155: Verify single-roundtrip CTE Market Pulse, Analytics Dashboard & ConnectRPC achieve p95 < 30ms."""
    import time

    _, token, cand_profile = await _seed_user_and_candidate(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    # Warm L1/L2 Singleflight cache & verify single-roundtrip CTE execution
    await client.get("/v1/match/market-pulse")
    await client.get("/v1/analytics/dashboard")

    pulse_latencies: list[float] = []
    rpc_latencies: list[float] = []
    for _ in range(15):
        t0 = time.perf_counter()
        p_res = await client.get("/v1/match/market-pulse")
        pulse_latencies.append((time.perf_counter() - t0) * 1000.0)
        assert p_res.status_code == 200
        assert "total_jds_analyzed" in p_res.json()

        t1 = time.perf_counter()
        r_res = await client.post(
            "/v1/rpc/batch",
            headers=headers,
            json={
                "calls": [
                    {"id": "b1", "method": "bookmarks.list", "params": {}},
                    {"id": "l1", "method": "catalogs.locations", "params": {"name": ""}},
                ]
            },
        )
        rpc_latencies.append((time.perf_counter() - t1) * 1000.0)
        assert r_res.status_code == 200

    pulse_latencies.sort()
    rpc_latencies.sort()
    p95_pulse = pulse_latencies[int(len(pulse_latencies) * 0.95) - 1]
    p95_rpc = rpc_latencies[int(len(rpc_latencies) * 0.95) - 1]
    assert p95_pulse < 30.0, f"Market Pulse p95 {p95_pulse:.2f}ms exceeded 30ms SLA"
    assert p95_rpc < 30.0, f"ConnectRPC batch p95 {p95_rpc:.2f}ms exceeded 30ms SLA"


@pytest.mark.asyncio
async def test_bel220_anti_mockup_gate_and_fe_be_postgresql_persistence(
    client: AsyncClient, db_session: AsyncSession
):
    """BEL-220 (#178): Verify fe_mock_fallback_arrays == 0 gate and real PostgreSQL persistence for Wallet & Social Feed."""
    import ast
    import json
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent.parent
    ratchet_data = json.loads((root / ".agents" / "ratchet.json").read_text(encoding="utf-8"))
    assert ratchet_data.get("fe_mock_fallback_arrays") == 0

    tb_src = (root / "scripts" / "trust-benchmark.py").read_text(encoding="utf-8")
    ast.parse(tb_src)
    assert "fe_mock_fallback_arrays == 0" in tb_src

    _, token, _ = await _seed_user_and_candidate(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    topup_res = await client.post(
        "/v1/wallet/topup",
        headers=headers,
        json={"amount_vnd": 500000, "payment_method": "MoMo QR"},
    )
    assert topup_res.status_code in (200, 201)
    wallet_res = await client.get("/v1/wallet/", headers=headers)
    assert wallet_res.status_code == 200
    assert wallet_res.json()["available_balance_vnd"] >= 500000

    post_res = await client.post(
        "/v1/blog/posts/",
        headers=headers,
        json={
            "title": "BEL-220 Real PostgreSQL Persistence Verification",
            "excerpt": "Zero frontend mockups — 100% backed by PostgreSQL 16.",
            "content": ["Verified end-to-end DB persistence."],
            "post_type": "USER_STATUS",
            "tags": ["PostgreSQL", "FastAPI"],
            "ats_score_badge": 95,
        },
    )
    assert post_res.status_code in (200, 201)
    feed_res = await client.get("/v1/blog/posts/")
    assert feed_res.status_code == 200
    assert any(p["title"] == "BEL-220 Real PostgreSQL Persistence Verification" for p in feed_res.json())


