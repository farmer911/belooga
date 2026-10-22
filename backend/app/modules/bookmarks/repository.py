"""Candidate Shortlist Bookmarks repository (Vertical Module: bookmarks).

Single-roundtrip PostgreSQL data access layer for `candidate_bookmarks`.
"""

from typing import Any, Optional
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class BookmarkRepository:
    """Repository executing single-roundtrip SQL for recruiter candidate bookmarks."""

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
