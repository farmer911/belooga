#!/usr/bin/env python3
"""Empirical Benchmark: Backend Flow & PostgreSQL 16 Query Consolidation (BEL-518).

Compares:
1. Profile Dossier Hydration: 7 Sequential SQL Queries vs 1 Consolidated json_agg/ARRAY Query.
2. Skill Tagging Upsert: 3 Sequential SQL Queries vs 1 Atomic CTE Upsert.
3. Timeline Drag-and-Drop Reorder (8 items): 8 Loop UPDATEs vs 1 Bulk CASE UPDATE.
4. Executive Analytics Counts: 3 Separate COUNT(*) Queries vs 1 Scalar Subquery Round-Trip.
5. Recruiter Shortlist Search: 2 GIN Index Scans vs 1 Window Function Scan (COUNT(*) OVER()).
6. Composite B-Tree Index Verification on notifications, cv_review_orders, job_tracker, resume_jd_matches.
"""

import asyncio
import os
import statistics
import sys
import time
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://belooga:belooga_secret_password@localhost:5433/belooga_test",
)

from sqlalchemy import select, func, text
from app.core.database import async_session_maker
from app.models import (
    CandidateProfile,
    Skill,
    ProfileSkill,
    JobExperience,
    CVReviewOrder,
    CandidateJobApplicationTracker,
)
from app.modules.profile.repository import ProfileRepository
from app.modules.timeline.repository import TimelineRepository
from app.modules.analytics.repository import AnalyticsRepository
from app.modules.ats_matching.repository import ATSMatchingRepository


def _pct(values: list[float], p: float) -> float:
    s = sorted(values)
    idx = min(int(len(s) * p), len(s) - 1)
    return round(s[idx], 3)


async def run_benchmark() -> None:
    print("=" * 94)
    print("BELOOGA SQL & BACKEND FLOW CONSOLIDATION BENCHMARK (BEL-518 — PostgreSQL 16)")
    print("=" * 94)

    async with async_session_maker() as db:
        row = (
            await db.execute(
                text("SELECT id, username FROM candidate_profiles WHERE is_hidden = FALSE LIMIT 1")
            )
        ).mappings().first()
        if not row:
            raise RuntimeError("No candidate profile found in database. Run seed first.")
        profile_id = row["id"]
        username = row["username"]

        # ----------------------------------------------------------------------
        # 1. Profile Dossier Hydration: 7 Queries vs 1 Consolidated Query
        # ----------------------------------------------------------------------
        repo = ProfileRepository(db)
        legacy_7q_times: list[float] = []
        consolidated_1q_times: list[float] = []

        for _ in range(80):
            t0 = time.perf_counter()
            prof = await repo.get_profile_with_identity(username)
            assert prof is not None
            await repo.get_jobs(profile_id)
            await repo.get_education(profile_id)
            await repo.get_skills(profile_id)
            await repo.get_pitch_poster(profile_id)
            await repo.get_languages(profile_id)
            await repo.get_interests(profile_id)
            legacy_7q_times.append((time.perf_counter() - t0) * 1000.0)

        for _ in range(80):
            t0 = time.perf_counter()
            bundle = await repo.get_full_profile_bundle(username)
            assert bundle is not None
            consolidated_1q_times.append((time.perf_counter() - t0) * 1000.0)

        # ----------------------------------------------------------------------
        # 2. Skill Tagging Upsert: 3 Queries vs 1 Atomic CTE
        # ----------------------------------------------------------------------
        legacy_skill_times: list[float] = []
        cte_skill_times: list[float] = []

        for i in range(40):
            skill_name = f"BenchSkillLegacy_{i}"
            t0 = time.perf_counter()
            s_row = (
                await db.execute(text("SELECT id FROM skills WHERE name = :n LIMIT 1"), {"n": skill_name})
            ).fetchone()
            if not s_row:
                sid = uuid.uuid4()
                await db.execute(
                    text("INSERT INTO skills (id, name) VALUES (:id, :n) ON CONFLICT DO NOTHING"),
                    {"id": sid, "n": skill_name},
                )
            else:
                sid = s_row[0]
            await db.execute(
                text(
                    "INSERT INTO profile_skills (profile_id, skill_id) VALUES (:pid, :sid) ON CONFLICT DO NOTHING"
                ),
                {"pid": profile_id, "sid": sid},
            )
            legacy_skill_times.append((time.perf_counter() - t0) * 1000.0)
        await db.rollback()

        for i in range(40):
            skill_name = f"BenchSkillCTE_{i}"
            t0 = time.perf_counter()
            await repo.add_skill(profile_id, skill_name)
            cte_skill_times.append((time.perf_counter() - t0) * 1000.0)
        await db.rollback()

        # ----------------------------------------------------------------------
        # 3. Timeline Drag-and-Drop Reorder: N Loop UPDATEs vs 1 Bulk CASE UPDATE
        # ----------------------------------------------------------------------
        tl_repo = TimelineRepository(db)
        jobs = await tl_repo.list_jobs_by_username(username)
        if len(jobs) < 6:
            for idx in range(6):
                await tl_repo.create_job(
                    profile_id=profile_id,
                    title=f"Engineer {idx}",
                    company_name=f"Company {idx}",
                    display_order=idx,
                )
            jobs = await tl_repo.list_jobs_by_username(username)

        order_pairs = [(j["id"], idx) for idx, j in enumerate(reversed(jobs))]
        legacy_reorder_times: list[float] = []
        bulk_reorder_times: list[float] = []

        for _ in range(50):
            t0 = time.perf_counter()
            await tl_repo.lock_jobs_for_update(profile_id)
            for item_id, ord_val in order_pairs:
                await tl_repo.update_job_order(profile_id, item_id, ord_val)
            legacy_reorder_times.append((time.perf_counter() - t0) * 1000.0)

        for _ in range(50):
            t0 = time.perf_counter()
            await tl_repo.lock_jobs_for_update(profile_id)
            await tl_repo.bulk_update_job_orders(profile_id, order_pairs)
            bulk_reorder_times.append((time.perf_counter() - t0) * 1000.0)
        await db.rollback()

        # ----------------------------------------------------------------------
        # 4. Executive Analytics Counts: 3 Separate COUNT(*) vs 1 Scalar Subquery
        # ----------------------------------------------------------------------
        analytics_repo = AnalyticsRepository(db)
        legacy_counts_times: list[float] = []
        single_counts_times: list[float] = []

        for _ in range(80):
            t0 = time.perf_counter()
            await db.execute(select(func.count(CandidateProfile.id)).where(CandidateProfile.is_hidden.is_(False)))
            await db.execute(select(func.count(CVReviewOrder.id)))
            await db.execute(select(func.count(CandidateJobApplicationTracker.id)))
            legacy_counts_times.append((time.perf_counter() - t0) * 1000.0)

        for _ in range(80):
            t0 = time.perf_counter()
            await analytics_repo.get_platform_counts()
            single_counts_times.append((time.perf_counter() - t0) * 1000.0)

        # ----------------------------------------------------------------------
        # 5. Shortlist Search: 2 GIN Scans vs 1 Window Function Scan
        # ----------------------------------------------------------------------
        ats_repo = ATSMatchingRepository(db)
        legacy_shortlist_times: list[float] = []
        window_shortlist_times: list[float] = []

        for _ in range(60):
            t0 = time.perf_counter()
            await db.execute(
                text("""
                    WITH matched_pool AS MATERIALIZED (
                        SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.bio,
                               p.location, p.seeking_status, p.avatar_url, p.video_pitch_url,
                               p.created_at, p.search_vector
                        FROM candidate_profiles p
                        WHERE p.is_hidden = FALSE
                          AND p.search_vector @@ to_tsquery('english', 'python | react | engineer')
                        LIMIT 250
                    )
                    SELECT id, username, first_name, last_name, headline, bio,
                           location, seeking_status, avatar_url, video_pitch_url,
                           ts_rank_cd(search_vector, to_tsquery('english', 'python | react | engineer')) AS ts_rank
                    FROM matched_pool
                    ORDER BY
                        (CASE WHEN video_pitch_url IS NOT NULL THEN 0.35 ELSE 0.0 END +
                         CASE WHEN seeking_status = 'Actively Looking' THEN 0.20 ELSE 0.0 END +
                         ts_rank_cd(search_vector, to_tsquery('english', 'python | react | engineer'))) DESC,
                        created_at DESC
                    LIMIT 25
                """)
            )
            await db.execute(
                text("""
                    SELECT COUNT(*) FROM (
                        SELECT 1 FROM candidate_profiles
                        WHERE is_hidden = FALSE AND search_vector @@ to_tsquery('english', 'python | react | engineer')
                        LIMIT 1000
                    ) sub
                """)
            )
            legacy_shortlist_times.append((time.perf_counter() - t0) * 1000.0)

        for _ in range(60):
            t0 = time.perf_counter()
            await ats_repo.find_shortlist_candidates(["python", "react", "engineer"], limit=25)
            window_shortlist_times.append((time.perf_counter() - t0) * 1000.0)

        # ----------------------------------------------------------------------
        # 6. Verify Composite B-Tree Indexes in pg_indexes
        # ----------------------------------------------------------------------
        idx_rows = (
            await db.execute(
                text("""
                    SELECT indexname, tablename
                    FROM pg_indexes
                    WHERE schemaname = 'public'
                      AND indexname IN (
                          'idx_notifications_identity_unread_created',
                          'idx_cv_review_orders_candidate_created',
                          'idx_cv_review_orders_status_created',
                          'idx_job_tracker_candidate_created',
                          'idx_resume_jd_matches_candidate_created'
                      )
                    ORDER BY indexname
                """)
            )
        ).mappings().all()

    def _row(label: str, before: list[float], after: list[float], q_before: int, q_after: int) -> None:
        m_b = round(statistics.median(before), 3)
        m_a = round(statistics.median(after), 3)
        p95_b = _pct(before, 0.95)
        p95_a = _pct(after, 0.95)
        speedup = round(m_b / max(m_a, 0.001), 2)
        print(
            f"| {label:<34} | {q_before:>2} -> {q_after:<2} SQL | "
            f"{m_b:>6.3f} ms -> {m_a:>6.3f} ms | "
            f"P95: {p95_b:>6.3f} -> {p95_a:>6.3f} ms | {speedup:>5.2f}x faster |"
        )

    print("-" * 94)
    _row("1. Profile Dossier Hydration", legacy_7q_times, consolidated_1q_times, 7, 1)
    _row("2. Skill Tagging Upsert (CTE)", legacy_skill_times, cte_skill_times, 3, 1)
    _row("3. Timeline Reorder (Bulk CASE)", legacy_reorder_times, bulk_reorder_times, len(jobs) + 1, 2)
    _row("4. Executive Analytics Counts", legacy_counts_times, single_counts_times, 3, 1)
    _row("5. Shortlist Search (OVER())", legacy_shortlist_times, window_shortlist_times, 2, 1)
    print("-" * 94)
    print(f"Verified Composite B-Tree Indexes in PostgreSQL 16: {len(idx_rows)}/5")
    for r in idx_rows:
        print(f"  - {r['indexname']} ON {r['tablename']}")
    print("=" * 94)


if __name__ == "__main__":
    asyncio.run(run_benchmark())
