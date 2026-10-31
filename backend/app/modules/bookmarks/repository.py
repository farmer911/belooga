"""Candidate Shortlist Bookmarks & B2B Recruiter Pipeline repository (Vertical Module: bookmarks).

Single-roundtrip PostgreSQL data access layer for `candidate_bookmarks` and recruiter pipeline items.
"""

from typing import Any, Optional
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.bookmarks.growth_repository import GrowthRowsMixin


class BookmarkRepository(GrowthRowsMixin):
    """Repository executing single-roundtrip SQL for recruiter candidate bookmarks and pipeline."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _serialize_row(row: Any) -> dict[str, Any]:
        first = (row.first_name or "").strip()
        last = (row.last_name or "").strip()
        full_name = f"{first} {last}".strip() or row.username
        created_iso = row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else str(row.created_at)
        return {
            "id": str(row.id),
            "recruiter_identity_id": str(row.recruiter_identity_id),
            "candidate_profile_id": str(row.candidate_profile_id),
            "username": row.username,
            "full_name": full_name,
            "headline": row.headline or "",
            "location": row.location or "",
            "seeking_status": row.seeking_status or "Open to Offers",
            "avatar_url": row.avatar_url,
            "note": row.note,
            "created_at": created_iso,
        }

    async def list_by_recruiter(self, recruiter_identity_id: uuid.UUID) -> list[dict[str, Any]]:
        stmt = text(
            """
            SELECT
                cb.id,
                cb.recruiter_identity_id,
                cb.candidate_profile_id,
                cb.note,
                cb.created_at,
                cp.username,
                cp.first_name,
                cp.last_name,
                cp.headline,
                cp.location,
                cp.seeking_status,
                cp.avatar_url
            FROM candidate_bookmarks cb
            JOIN candidate_profiles cp ON cp.id = cb.candidate_profile_id
            WHERE cb.recruiter_identity_id = :rid
              AND cp.is_hidden = FALSE
            ORDER BY cb.created_at DESC
            """
        )
        res = await self.db.execute(stmt, {"rid": recruiter_identity_id})
        return [self._serialize_row(r) for r in res.fetchall()]

    async def upsert_bookmark(
        self,
        recruiter_identity_id: uuid.UUID,
        username: str,
        note: Optional[str] = None,
    ) -> Optional[dict[str, Any]]:
        stmt = text(
            """
            WITH target_profile AS (
                SELECT
                    id,
                    username,
                    first_name,
                    last_name,
                    headline,
                    location,
                    seeking_status,
                    avatar_url
                FROM candidate_profiles
                WHERE LOWER(username) = LOWER(:username)
                  AND is_hidden = FALSE
                LIMIT 1
            ),
            upserted AS (
                INSERT INTO candidate_bookmarks (recruiter_identity_id, candidate_profile_id, note)
                SELECT :rid, tp.id, :note
                FROM target_profile tp
                ON CONFLICT (recruiter_identity_id, candidate_profile_id)
                DO UPDATE SET note = COALESCE(EXCLUDED.note, candidate_bookmarks.note)
                RETURNING id, recruiter_identity_id, candidate_profile_id, note, created_at
            )
            SELECT
                u.id,
                u.recruiter_identity_id,
                u.candidate_profile_id,
                u.note,
                u.created_at,
                tp.username,
                tp.first_name,
                tp.last_name,
                tp.headline,
                tp.location,
                tp.seeking_status,
                tp.avatar_url
            FROM upserted u
            JOIN target_profile tp ON tp.id = u.candidate_profile_id
            """
        )
        res = await self.db.execute(
            stmt,
            {"rid": recruiter_identity_id, "username": username.strip(), "note": note},
        )
        row = res.fetchone()
        return self._serialize_row(row) if row else None

    async def delete_bookmark(
        self,
        recruiter_identity_id: uuid.UUID,
        username: str,
    ) -> bool:
        stmt = text(
            """
            DELETE FROM candidate_bookmarks cb
            USING candidate_profiles cp
            WHERE cb.candidate_profile_id = cp.id
              AND cb.recruiter_identity_id = :rid
              AND LOWER(cp.username) = LOWER(:username)
            RETURNING cb.id
            """
        )
        res = await self.db.execute(
            stmt,
            {"rid": recruiter_identity_id, "username": username.strip()},
        )
        return res.scalar_one_or_none() is not None

    async def get_visible_candidate(self, username: str) -> Optional[dict[str, Any]]:
        stmt = text(
            """
            SELECT
                cp.id, cp.identity_id, cp.username, cp.first_name, cp.last_name,
                cp.headline, cp.is_hidden,
                COALESCE(ARRAY_AGG(ms.name) FILTER (WHERE ms.name IS NOT NULL), '{}') AS skills
            FROM candidate_profiles cp
            LEFT JOIN profile_skills cs ON cs.profile_id = cp.id
            LEFT JOIN skills ms ON ms.id = cs.skill_id
            WHERE LOWER(cp.username) = LOWER(:uname)
            GROUP BY cp.id
            LIMIT 1
            """
        )
        row = (await self.db.execute(stmt, {"uname": username.strip()})).fetchone()
        if not row:
            return None
        if row.is_hidden:
            return {"is_hidden": True}
        first = (row.first_name or "").strip()
        last = (row.last_name or "").strip()
        return {
            "id": str(row.id),
            "identity_id": row.identity_id,
            "username": row.username,
            "full_name": f"{first} {last}".strip() or row.username,
            "headline": row.headline or "Senior Software Engineer",
            "skills": list(row.skills or []),
            "is_hidden": False,
        }

    async def get_visible_candidates(self, usernames: list[str]) -> dict[str, dict[str, Any]]:
        """Batch variant of get_visible_candidate (one roundtrip); hidden profiles are excluded. Keyed by lower(username)."""
        stmt = text(
            """
            SELECT cp.id, cp.identity_id, cp.username, cp.first_name, cp.last_name, cp.headline,
                   COALESCE(ARRAY_AGG(ms.name) FILTER (WHERE ms.name IS NOT NULL), '{}') AS skills
            FROM candidate_profiles cp
            LEFT JOIN profile_skills cs ON cs.profile_id = cp.id
            LEFT JOIN skills ms ON ms.id = cs.skill_id
            WHERE LOWER(cp.username) = ANY(:unames) AND cp.is_hidden = FALSE
            GROUP BY cp.id
            """
        )
        rows = (await self.db.execute(stmt, {"unames": [u.strip().lower() for u in usernames]})).fetchall()
        return {
            r.username.lower(): {
                "id": str(r.id),
                "identity_id": r.identity_id,
                "username": r.username,
                "full_name": f"{(r.first_name or '').strip()} {(r.last_name or '').strip()}".strip() or r.username,
                "headline": r.headline or "Senior Software Engineer",
                "skills": list(r.skills or []),
            }
            for r in rows
        }

    async def list_pipeline_rows(self, recruiter_identity_id: uuid.UUID) -> list[dict[str, Any]]:
        res = await self.db.execute(
            text("""
                SELECT id::text AS id, candidate_username AS username, full_name, headline, target_role, stage, ats_score,
                       years_experience, expected_salary, video_pitch_url, matched_skills, missing_skills, recruiter_rating,
                       evaluation_notes, contact_unlocked, interview_datetime
                FROM recruiter_pipeline_items WHERE recruiter_identity_id = :rid ORDER BY created_at DESC
            """),
            {"rid": recruiter_identity_id},
        )
        return [dict(r) for r in res.mappings().all()]

    async def upsert_pipeline_row(self, recruiter_identity_id: uuid.UUID, item: dict[str, Any]) -> dict[str, Any]:
        """Insert or refresh the recruiter's card for this candidate (unique per recruiter + username). No commit."""
        res = await self.db.execute(
            text("""
                INSERT INTO recruiter_pipeline_items (
                    recruiter_identity_id, candidate_username, full_name, headline, target_role, stage, ats_score,
                    years_experience, expected_salary, video_pitch_url, matched_skills, missing_skills,
                    recruiter_rating, evaluation_notes, contact_unlocked, interview_datetime
                ) VALUES (
                    :rid, :username, :full_name, :headline, :target_role, :stage, :ats_score,
                    :years_experience, :expected_salary, :video_pitch_url, :matched_skills, :missing_skills,
                    :recruiter_rating, :evaluation_notes, :contact_unlocked, :interview_datetime
                )
                ON CONFLICT (recruiter_identity_id, LOWER(candidate_username)) DO UPDATE SET
                    full_name = EXCLUDED.full_name, headline = EXCLUDED.headline, target_role = EXCLUDED.target_role,
                    stage = EXCLUDED.stage, ats_score = EXCLUDED.ats_score, years_experience = EXCLUDED.years_experience,
                    expected_salary = EXCLUDED.expected_salary, video_pitch_url = EXCLUDED.video_pitch_url,
                    matched_skills = EXCLUDED.matched_skills, missing_skills = EXCLUDED.missing_skills,
                    recruiter_rating = EXCLUDED.recruiter_rating, evaluation_notes = EXCLUDED.evaluation_notes,
                    contact_unlocked = recruiter_pipeline_items.contact_unlocked OR EXCLUDED.contact_unlocked,
                    interview_datetime = COALESCE(EXCLUDED.interview_datetime, recruiter_pipeline_items.interview_datetime),
                    updated_at = NOW()
                RETURNING id::text AS id, candidate_username AS username, full_name, headline, target_role, stage, ats_score,
                    years_experience, expected_salary, video_pitch_url, matched_skills, missing_skills, recruiter_rating,
                    evaluation_notes, contact_unlocked, interview_datetime
            """),
            {"rid": recruiter_identity_id, **item},
        )
        return dict(res.mappings().one())

    async def update_pipeline_row(
        self, recruiter_identity_id: uuid.UUID, item_id: uuid.UUID, updates: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        """Owner-scoped partial update; returns None when the row is missing or belongs to another recruiter."""
        allowed = ("stage", "recruiter_rating", "evaluation_notes", "contact_unlocked", "interview_datetime")
        params = {"id": item_id, "rid": recruiter_identity_id, **{k: updates.get(k) for k in allowed}}
        res = await self.db.execute(
            text("""
                UPDATE recruiter_pipeline_items
                SET stage = COALESCE(CAST(:stage AS VARCHAR), stage),
                    recruiter_rating = COALESCE(CAST(:recruiter_rating AS INTEGER), recruiter_rating),
                    evaluation_notes = COALESCE(CAST(:evaluation_notes AS TEXT), evaluation_notes),
                    contact_unlocked = COALESCE(CAST(:contact_unlocked AS BOOLEAN), contact_unlocked),
                    interview_datetime = COALESCE(CAST(:interview_datetime AS VARCHAR), interview_datetime),
                    updated_at = NOW()
                WHERE id = :id AND recruiter_identity_id = :rid
                RETURNING id::text AS id, candidate_username AS username, full_name, headline, target_role, stage, ats_score,
                    years_experience, expected_salary, video_pitch_url, matched_skills, missing_skills, recruiter_rating,
                    evaluation_notes, contact_unlocked, interview_datetime
            """),
            params,
        )
        row = res.mappings().first()
        return dict(row) if row else None

    # --- Reverse bids & anonymous CV roasts (growth features) ---

    _BID_COLS = "id, candidate_username, role, salary_usd, status"
