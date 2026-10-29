"""Reverse bids and CV roasts (growth features) for BookmarkRepository."""

from typing import Any, Optional
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class GrowthRowsMixin:
    db: AsyncSession

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
