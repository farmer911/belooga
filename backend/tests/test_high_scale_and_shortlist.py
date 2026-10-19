"""TDD Integration & Concurrency Suite for High-Scale Modular Monolith & Recruiter Talent Shortlist."""

import asyncio
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_async_cache_singleflight_stampede_protection():
    """Verify 200 concurrent cache-miss requests coalesce into a single DB loader execution."""
    from app.core.cache import AsyncTieredCache

    cache = AsyncTieredCache(namespace="test_sf", l1_max_size=128)
    await cache.invalidate_prefix("")
    loader_calls = 0

    async def expensive_db_loader():
        nonlocal loader_calls
        loader_calls += 1
        await asyncio.sleep(0.015)
        return {"total_users": 500000, "status": "coalesced"}

    results = await asyncio.gather(
        *[cache.get_or_set("hot_dashboard_key", ttl_seconds=30, loader=expensive_db_loader) for _ in range(200)]
    )
    assert loader_calls == 1
    assert len(results) == 200
    assert all(r["total_users"] == 500000 for r in results)


@pytest.mark.asyncio
async def test_search_keyset_cursor_pagination_and_consistency(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify GET /v1/profile/search/ supports O(1) keyset cursor pagination without duplicate rows."""
    res_p1 = await client.get("/v1/profile/search/?limit=3&page=1")
    assert res_p1.status_code == 200
    data_p1 = res_p1.json()
    assert "results" in data_p1
    assert "next_cursor" in data_p1

    if data_p1["next_cursor"] and len(data_p1["results"]) == 3:
        res_p2 = await client.get(
            f"/v1/profile/search/?limit=3&cursor={data_p1['next_cursor']}"
        )
        assert res_p2.status_code == 200
        data_p2 = res_p2.json()
        ids_p1 = {r["id"] for r in data_p1["results"]}
        ids_p2 = {r["id"] for r in data_p2["results"]}
        assert ids_p1.isdisjoint(ids_p2)


@pytest.mark.asyncio
async def test_recruiter_talent_shortlist_ranking_and_video_boost(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify POST /v1/match/talent-shortlist ranks candidates by skill coverage + video pitch readiness."""
    suffix = uuid.uuid4().hex[:6]
    uid_top = uuid.uuid4()
    pid_top = uuid.uuid4()
    u_top = f"go_star_{suffix}"

    uid_mid = uuid.uuid4()
    pid_mid = uuid.uuid4()
    u_mid = f"go_mid_{suffix}"

    await db_session.execute(
        text(
            "INSERT INTO identities (id, email, password_hash, role, status) "
            "VALUES (:u1, :e1, 'h', 'candidate', 'active'), (:u2, :e2, 'h', 'candidate', 'active')"
        ),
        {"u1": uid_top, "e1": f"{u_top}@test.com", "u2": uid_mid, "e2": f"{u_mid}@test.com"},
    )
    await db_session.execute(
        text(
            "INSERT INTO candidate_profiles "
            "(id, identity_id, username, first_name, last_name, headline, bio, location, seeking_status, video_pitch_url, is_hidden) "
            "VALUES "
            "(:p1, :u1, :un1, 'Minh', 'Architect', 'Principal Golang Kubernetes Architect', "
            "'Designed high-scale Golang, Kubernetes, PostgreSQL, Redis, Kafka systems handling 50000 rps.', "
            "'Ho Chi Minh City', 'Actively Looking', '/uploads/videos/pitch.mp4', FALSE), "
            "(:p2, :u2, :un2, 'Nam', 'Developer', 'Backend Golang Developer', "
            "'Working with Golang and PostgreSQL.', 'Hanoi', 'Open to Offers', NULL, FALSE)"
        ),
        {"p1": pid_top, "u1": uid_top, "un1": u_top, "p2": pid_mid, "u2": uid_mid, "un2": u_mid},
    )
    await db_session.commit()

    payload = {
        "job_title": "Principal Golang Distributed Systems Engineer",
        "company_name": "Belooga Enterprise",
        "jd_text": (
            "We need a Principal Golang Engineer with deep expertise in Golang, Kubernetes, "
            "PostgreSQL, Redis, and Kafka to scale our modular monolith to 500k users."
        ),
        "limit": 10,
        "require_video_pitch": False,
    }
    res = await client.post("/v1/match/talent-shortlist", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["job_title"] == "Principal Golang Distributed Systems Engineer"
    assert "Golang" in body["extracted_jd_skills"]
    assert "Kubernetes" in body["extracted_jd_skills"]
    assert body["pool_telemetry"]["total_matching_candidates"] >= 2
    assert body["pool_telemetry"]["estimated_salary_p50_vnd"] > 0
    assert len(body["candidates"]) >= 2

    usernames = [c["username"] for c in body["candidates"]]
    assert u_top in usernames
    top_cand = next(c for c in body["candidates"] if c["username"] == u_top)
    assert top_cand["has_video_pitch"] is True
    assert top_cand["match_score"] >= 80
    assert "Golang" in top_cand["matched_skills"]


@pytest.mark.asyncio
async def test_recruiter_talent_shortlist_payload_guard(client: AsyncClient):
    """Verify POST /v1/match/talent-shortlist rejects oversized JD text (>50,000 chars) with 413."""
    res = await client.post(
        "/v1/match/talent-shortlist",
        json={
            "job_title": "Backend Engineer",
            "jd_text": "Golang " * 10000,
            "limit": 5,
        },
    )
    assert res.status_code == 413


@pytest.mark.asyncio
async def test_talent_market_pulse_telemetry(client: AsyncClient):
    """Verify GET /v1/match/market-pulse returns real-time talent pool scarcity & video pitch telemetry."""
    res = await client.get("/v1/match/market-pulse")
    assert res.status_code == 200
    data = res.json()
    assert data["total_visible_candidates"] >= 1
    assert 0.0 <= data["video_pitch_adoption_pct"] <= 100.0
    assert len(data["skill_scarcity_index"]) >= 3
    assert "skill" in data["skill_scarcity_index"][0]
    assert "demand_To_supply_ratio" in data["skill_scarcity_index"][0] or "scarcity_score" in data["skill_scarcity_index"][0]


@pytest.mark.asyncio
async def test_candidate_profile_trust_score_and_privacy(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify GET /v1/profile/{username}/trust-score computes 4-pillar trust score and enforces is_hidden 404."""
    suffix = uuid.uuid4().hex[:6]
    uid_pub = uuid.uuid4()
    pid_pub = uuid.uuid4()
    u_pub = f"trust_pub_{suffix}"

    uid_hid = uuid.uuid4()
    pid_hid = uuid.uuid4()
    u_hid = f"trust_hid_{suffix}"

    await db_session.execute(
        text(
            "INSERT INTO identities (id, email, password_hash, role, status) "
            "VALUES (:u1, :e1, 'h', 'candidate', 'active'), (:u2, :e2, 'h', 'candidate', 'active')"
        ),
        {"u1": uid_pub, "e1": f"{u_pub}@test.com", "u2": uid_hid, "e2": f"{u_hid}@test.com"},
    )
    await db_session.execute(
        text(
            "INSERT INTO candidate_profiles "
            "(id, identity_id, username, first_name, last_name, headline, bio, location, seeking_status, video_pitch_url, is_hidden) "
            "VALUES "
            "(:p1, :u1, :un1, 'Linh', 'Principal', 'Principal Staff Engineer', "
            "'Built distributed PostgreSQL and Golang microservices at scale with 99.99% SLA.', "
            "'Ho Chi Minh City', 'Actively Looking', '/uploads/videos/pitch.mp4', FALSE), "
            "(:p2, :u2, :un2, 'Hidden', 'User', 'Engineer', 'Bio', 'Hanoi', 'Open', NULL, TRUE)"
        ),
        {"p1": pid_pub, "u1": uid_pub, "un1": u_pub, "p2": pid_hid, "u2": uid_hid, "un2": u_hid},
    )
    await db_session.commit()

    res_pub = await client.get(f"/v1/profile/{u_pub}/trust-score")
    assert res_pub.status_code == 200
    body = res_pub.json()
    assert body["username"] == u_pub
    assert 0 <= body["trust_score"] <= 100
    assert body["readiness_tier"] in ("Platinum Verified", "Gold Verified", "Silver Rising", "Starter Profile")
    assert len(body["pillars"]) == 4
    assert body["recruiter_conversion_multiplier"] >= 1.0
    assert len(body["next_boost_action"]) > 5

    res_hid = await client.get(f"/v1/profile/{u_hid}/trust-score")
    assert res_hid.status_code == 404


@pytest.mark.asyncio
async def test_interview_kit_and_video_pitch_script_generator(client: AsyncClient):
    """Verify POST /v1/match/interview-kit generates a 60s Video Pitch Teleprompter script & STAR interview questions."""
    payload = {
        "job_title": "Principal Golang Engineer",
        "company_name": "Belooga Cloud",
        "jd_text": "Looking for Principal Golang Engineer with Kubernetes, PostgreSQL, Redis, and Kafka expertise.",
        "cv_text": "Built Golang and PostgreSQL services handling 25,000 rps.",
    }
    res = await client.post("/v1/match/interview-kit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["job_title"] == "Principal Golang Engineer"
    assert "[00-15s" in data["video_pitch_script_60s"]
    assert len(data["star_interview_questions"]) >= 3
    assert "question" in data["star_interview_questions"][0]
    assert "star_coaching_tip" in data["star_interview_questions"][0]
    assert len(data["closing_questions_for_hiring_manager"]) >= 2


@pytest.mark.asyncio
async def test_career_upskill_roi_and_negotiation_simulator(client: AsyncClient):
    """Verify GET /v1/catalogs/career-roi computes upskill compensation delta and negotiation leverage script."""
    res = await client.get("/v1/catalogs/career-roi?tech_stack=Golang&level=Senior&location=Ho%20Chi%20Minh")
    assert res.status_code == 200
    data = res.json()
    assert data["tech_stack"] == "Golang"
    assert data["projected_upskill_vnd"] > data["current_median_vnd"]
    assert data["annual_comp_gain_vnd"] >= 12 * (data["projected_upskill_vnd"] - data["current_median_vnd"])
    assert len(data["upskill_recommendations"]) >= 3
    assert "monthly_delta_vnd" in data["upskill_recommendations"][0]
    assert len(data["negotiation_leverage_script"]) > 20



