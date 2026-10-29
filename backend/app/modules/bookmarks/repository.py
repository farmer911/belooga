"""Candidate Shortlist Bookmarks & B2B Recruiter Pipeline repository (Vertical Module: bookmarks).

Single-roundtrip PostgreSQL data access layer for `candidate_bookmarks` and recruiter pipeline items.
"""

from typing import Any, Optional
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class BookmarkRepository:
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

    _PIPE_COLS = """
        id::text AS id, candidate_username AS username, full_name, headline, target_role, stage, ats_score,
        years_experience, expected_salary, video_pitch_url, matched_skills, missing_skills, recruiter_rating,
        evaluation_notes, contact_unlocked, interview_datetime
    """

    async def list_pipeline_rows(self, recruiter_identity_id: uuid.UUID) -> list[dict[str, Any]]:
        res = await self.db.execute(
            text(f"SELECT {self._PIPE_COLS} FROM recruiter_pipeline_items WHERE recruiter_identity_id = :rid ORDER BY created_at DESC"),
            {"rid": recruiter_identity_id},
        )
        return [dict(r) for r in res.mappings().all()]

    async def upsert_pipeline_row(self, recruiter_identity_id: uuid.UUID, item: dict[str, Any]) -> dict[str, Any]:
        """Insert or refresh the recruiter's card for this candidate (unique per recruiter + username). No commit."""
        res = await self.db.execute(
            text(f"""
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
                RETURNING {self._PIPE_COLS}
            """),
            {"rid": recruiter_identity_id, **item},
        )
        return dict(res.mappings().one())

    async def update_pipeline_row(
        self, recruiter_identity_id: uuid.UUID, item_id: uuid.UUID, updates: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        """Owner-scoped partial update; returns None when the row is missing or belongs to another recruiter."""
        allowed = ("stage", "recruiter_rating", "evaluation_notes", "contact_unlocked", "interview_datetime")
        fields = {k: v for k, v in updates.items() if k in allowed and v is not None}
        set_sql = ", ".join(f"{k} = :{k}" for k in fields) or "stage = stage"
        res = await self.db.execute(
            text(f"""
                UPDATE recruiter_pipeline_items SET {set_sql}, updated_at = NOW()
                WHERE id = :id AND recruiter_identity_id = :rid
                RETURNING {self._PIPE_COLS}
            """),
            {"id": item_id, "rid": recruiter_identity_id, **fields},
        )
        row = res.mappings().first()
        return dict(row) if row else None

    # --- Reverse bids & anonymous CV roasts (growth features) ---

    _BID_COLS = "id, candidate_username, role, salary_usd, status"

    async def list_reverse_bids(self, identity_id: uuid.UUID, username: str) -> list[dict[str, Any]]:
        res = await self.db.execute(
            text(f"""
                SELECT {self._BID_COLS} FROM reverse_bids
                WHERE recruiter_identity_id = :iid OR (:uname <> '' AND LOWER(candidate_username) = LOWER(:uname))
                ORDER BY created_at DESC
            """),
            {"iid": identity_id, "uname": username or ""},
        )
        return [dict(r) for r in res.mappings().all()]

    async def create_reverse_bid(self, item: dict[str, Any]) -> dict[str, Any]:
        res = await self.db.execute(
            text(f"""
                INSERT INTO reverse_bids (id, recruiter_identity_id, candidate_username, role, company_name, salary_usd, pitch_note)
                VALUES (:id, :rid, :candidate_username, :role, :company_name, :salary_usd, :pitch_note)
                RETURNING {self._BID_COLS}
            """),
            item,
        )
        return dict(res.mappings().one())

    _ROAST_COLS = "id, alias, target_role, summary, votes, ai_roast"

    async def list_cv_roasts(self, limit: int = 50) -> list[dict[str, Any]]:
        res = await self.db.execute(
            text(f"SELECT {self._ROAST_COLS} FROM cv_roasts ORDER BY created_at DESC LIMIT :lim"), {"lim": limit}
        )
        return [dict(r) for r in res.mappings().all()]

    async def create_cv_roast(self, item: dict[str, Any]) -> dict[str, Any]:
        res = await self.db.execute(
            text(f"""
                INSERT INTO cv_roasts (id, author_identity_id, alias, target_role, summary, ai_roast, votes)
                VALUES (:id, :author_identity_id, :alias, :target_role, :summary, :ai_roast, :votes)
                RETURNING {self._ROAST_COLS}
            """),
            item,
        )
        return dict(res.mappings().one())

    async def vote_cv_roast(self, roast_id: str, identity_id: uuid.UUID) -> Optional[dict[str, Any]]:
        """One vote per identity: the counter only moves when the vote row is new."""
        res = await self.db.execute(
            text(f"""
                WITH target AS (SELECT id FROM cv_roasts WHERE id = :rid),
                new_vote AS (
                    INSERT INTO cv_roast_votes (roast_id, identity_id)
                    SELECT id, :iid FROM target
                    ON CONFLICT DO NOTHING
                    RETURNING roast_id
                ),
                bumped AS (
                    UPDATE cv_roasts SET votes = votes + 1 WHERE id IN (SELECT roast_id FROM new_vote)
                    RETURNING {self._ROAST_COLS}
                )
                SELECT {self._ROAST_COLS} FROM bumped
                UNION ALL
                SELECT {self._ROAST_COLS} FROM cv_roasts WHERE id = :rid AND NOT EXISTS (SELECT 1 FROM bumped)
            """),
            {"rid": roast_id, "iid": identity_id},
        )
        row = res.mappings().first()
        return dict(row) if row else None
