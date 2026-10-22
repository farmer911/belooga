"""Candidate Shortlist Bookmarks & B2B Recruiter Pipeline repository (Vertical Module: bookmarks).

Single-roundtrip PostgreSQL data access layer for `candidate_bookmarks` and recruiter pipeline items.
"""

import json
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

    async def list_pipeline_rows(self, recruiter_key: str) -> list[dict[str, Any]]:
        stmt = text(
            """
            SELECT id, message FROM contact_inquiries
            WHERE name LIKE :prefix
            ORDER BY created_at DESC
            """
        )
        rows = (await self.db.execute(stmt, {"prefix": f"RECRUITER_PIPE:{recruiter_key}:%"})).fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            try:
                data = json.loads(r.message)
                data["id"] = str(r.id)
                out.append(data)
            except Exception:
                continue
        return out

    async def upsert_pipeline_row(self, recruiter_key: str, item: dict[str, Any]) -> dict[str, Any]:
        key_name = f"RECRUITER_PIPE:{recruiter_key}:{item['username'].lower()}"
        existing = (
            await self.db.execute(text("SELECT id, message FROM contact_inquiries WHERE name = :n LIMIT 1"), {"n": key_name})
        ).fetchone()
        if existing:
            item["id"] = str(existing.id)
            await self.db.execute(
                text("UPDATE contact_inquiries SET message = :m WHERE id = :id"),
                {"m": json.dumps(item, ensure_ascii=False), "id": existing.id},
            )
        else:
            new_id = uuid.uuid4()
            item["id"] = str(new_id)
            await self.db.execute(
                text("INSERT INTO contact_inquiries (id, name, email, message) VALUES (:id, :n, 'recruiter@belooga.com', :m)"),
                {"id": new_id, "n": key_name, "m": json.dumps(item, ensure_ascii=False)},
            )
        await self.db.commit()
        return item

    async def update_pipeline_by_id(self, item_id: str, updates: dict[str, Any]) -> Optional[dict[str, Any]]:
        row = (
            await self.db.execute(text("SELECT id, message FROM contact_inquiries WHERE CAST(id AS TEXT) = :id LIMIT 1"), {"id": item_id})
        ).fetchone()
        if not row:
            return None
        data = json.loads(row.message)
        for k, v in updates.items():
            if v is not None:
                data[k] = v
        data["id"] = str(row.id)
        await self.db.execute(
            text("UPDATE contact_inquiries SET message = :m WHERE id = :id"),
            {"m": json.dumps(data, ensure_ascii=False), "id": row.id},
        )
        await self.db.commit()
        return data

