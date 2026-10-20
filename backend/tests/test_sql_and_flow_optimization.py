"""TDD Verification Suite for BEL-518: Backend Architecture Flow & PostgreSQL 16 SQL Optimization."""

import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.profile.repository import ProfileRepository
from app.modules.timeline.repository import TimelineRepository
from app.modules.analytics.repository import AnalyticsRepository
from app.modules.ats_matching.repository import ATSMatchingRepository
from app.modules.notifications.repository import NotificationRepository


@pytest.mark.asyncio
async def test_composite_btree_indexes_present_in_pg_indexes(db_session: AsyncSession):
    """Verify all 5 composite B-Tree indexes exist in PostgreSQL 16."""
    expected_indexes = {
        "idx_notifications_identity_unread_created",
        "idx_cv_review_orders_candidate_created",
        "idx_cv_review_orders_status_created",
        "idx_job_tracker_candidate_created",
        "idx_resume_jd_matches_candidate_created",
    }
    res = await db_session.execute(
        text(
            "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY(:names)"
        ),
        {"names": list(expected_indexes)},
    )
    found = {r[0] for r in res.fetchall()}
    assert found == expected_indexes


@pytest.mark.asyncio
async def test_profile_single_roundtrip_bundle_and_atomic_cte_skills(db_session: AsyncSession):
    """Verify get_full_profile_bundle (7->1 query) and atomic CTE add_skill/remove_skill (3->1 query)."""
    row = (
        await db_session.execute(
            text("SELECT id, username FROM candidate_profiles WHERE is_hidden = FALSE LIMIT 1")
        )
    ).mappings().first()
    assert row is not None
    profile_id = row["id"]
    username = row["username"]

    repo = ProfileRepository(db_session)
    unique_skill = f"ZeroCopySQL_{uuid.uuid4().hex[:6]}"

    await repo.add_skill(profile_id, unique_skill)
    # Idempotent repeat call must not raise duplicate key error
    await repo.add_skill(profile_id, unique_skill)

    bundle = await repo.get_full_profile_bundle(username)
    assert bundle is not None
    assert bundle["username"] == username
    assert isinstance(bundle["jobs_json"], list)
    assert isinstance(bundle["education_json"], list)
    assert unique_skill in bundle["skills_arr"]

    await repo.remove_skill(profile_id, unique_skill)
    bundle_after = await repo.get_full_profile_bundle(username)
    assert bundle_after is not None
    assert unique_skill not in bundle_after["skills_arr"]
    await db_session.rollback()


@pytest.mark.asyncio
async def test_timeline_bulk_case_update_orders(db_session: AsyncSession):
    """Verify TimelineRepository.bulk_update_job_orders updates all display_order values in 1 CASE query."""
    row = (
        await db_session.execute(
            text("SELECT id, username FROM candidate_profiles WHERE is_hidden = FALSE LIMIT 1")
        )
    ).mappings().first()
    assert row is not None
    profile_id = row["id"]
    username = row["username"]

    tl_repo = TimelineRepository(db_session)
    j1 = await tl_repo.create_job(profile_id=profile_id, title="Role A", company_name="Corp A", display_order=0)
    j2 = await tl_repo.create_job(profile_id=profile_id, title="Role B", company_name="Corp B", display_order=1)

    await tl_repo.bulk_update_job_orders(profile_id, [(j1, 99), (j2, 42)])
    jobs = await tl_repo.list_jobs_by_username(username)
    orders_by_id = {j["id"]: j["display_order"] for j in jobs}
    assert orders_by_id[j1] == 99
    assert orders_by_id[j2] == 42
    await db_session.rollback()


@pytest.mark.asyncio
async def test_analytics_single_roundtrip_counts_and_shortlist_window_count(db_session: AsyncSession):
    """Verify single-roundtrip AnalyticsRepository.get_platform_counts and ATS window count."""
    analytics_repo = AnalyticsRepository(db_session)
    total_candidates, total_orders, total_tracked = await analytics_repo.get_platform_counts()
    assert total_candidates >= 1
    assert total_orders >= 0
    assert total_tracked >= 0

    ats_repo = ATSMatchingRepository(db_session)
    rows, total_matched = await ats_repo.find_shortlist_candidates(["python", "engineer"], limit=10)
    assert isinstance(rows, list)
    assert total_matched >= len(rows)


@pytest.mark.asyncio
async def test_notification_single_query_mark_read_and_gateway_unified_status(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify single-query NotificationRepository.mark_read (UPDATE ... RETURNING) and unified Gateway status."""
    ident_row = (await db_session.execute(text("SELECT id FROM identities LIMIT 1"))).fetchone()
    assert ident_row is not None
    identity_id = ident_row[0]

    notif_repo = NotificationRepository(db_session)
    created = await notif_repo.create_notification(
        identity_id=identity_id,
        event_type="system",
        title="SQL Optimization Test",
        message="Single roundtrip UPDATE RETURNING verification",
        deep_link="/workspace",
        send_email=False,
        email_sent=False,
        email_subject=None,
        email_deeplink_url=None,
    )
    assert created.is_read is False

    updated = await notif_repo.mark_read(created.id, identity_id)
    assert updated is not None
    assert updated.id == created.id
    assert updated.is_read is True
    await db_session.rollback()

    resp = await client.get("/v1/gateway/status")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["status"] == "healthy"
    assert "gateway_metrics" in payload
    assert "cache_metrics" in payload
    assert "event_stream_metrics" in payload
    assert payload["upstreams"]["event_stream"] == "active"
