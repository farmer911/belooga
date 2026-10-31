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

    async def set_profile_stealth_mode(self, identity_id: uuid.UUID, stealth_enabled: bool) -> Optional[str]:
        res = await self.db.execute(
            text("""
                UPDATE candidate_profiles
                SET is_hidden = :hid, updated_at = NOW()
                WHERE identity_id = :iid
                RETURNING username
            """),
            {"iid": identity_id, "hid": stealth_enabled},
        )
        return res.scalar_one_or_none()

    async def sync_candidate_headline_and_skills(
        self, identity_id: uuid.UUID, headline: Optional[str], skills: list[str]
    ) -> Optional[str]:
        prof = (
            await self.db.execute(
                text("""
                    UPDATE candidate_profiles
                    SET headline = COALESCE(:hl, headline), updated_at = NOW()
                    WHERE identity_id = :iid
                    RETURNING id, username
                """),
                {"iid": identity_id, "hl": (headline or "")[:255] or None},
            )
        ).mappings().first()
        if not prof:
            return None
        for sk in skills[:12]:
            clean = sk.strip()
            if not clean:
                continue
            sid = (
                await self.db.execute(
                    text("""
                        INSERT INTO skills (id, name)
                        VALUES (:sid, :name)
                        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                        RETURNING id
                    """),
                    {"sid": uuid.uuid4(), "name": clean},
                )
            ).scalar_one()
            await self.db.execute(
                text("""
                    INSERT INTO profile_skills (profile_id, skill_id)
                    VALUES (:pid, :sid)
                    ON CONFLICT DO NOTHING
                """),
                {"pid": prof["id"], "sid": sid},
            )
        return str(prof["username"])

    async def get_growth_hub_snapshot(self) -> dict[str, Any]:
        row = (
            await self.db.execute(
                text("""
                    SELECT
                        COALESCE((SELECT username FROM candidate_profiles WHERE is_hidden = FALSE ORDER BY created_at ASC LIMIT 1), 'candidate') AS top_username,
                        COALESCE((SELECT name FROM company_profiles ORDER BY avg_rating DESC LIMIT 1), 'Enterprise Cloud') AS top_company,
                        (SELECT COUNT(*)::int FROM career_postings WHERE is_active = TRUE) AS open_roles
                """)
            )
        ).mappings().first()
        return dict(row) if row else {"top_username": "candidate", "top_company": "Enterprise Cloud", "open_roles": 3}

    async def list_company_referral_slots(self, limit: int = 4) -> list[dict[str, Any]]:
        rows = (
            await self.db.execute(
                text("SELECT slug, name, alumni, open_jobs FROM company_profiles ORDER BY avg_rating DESC LIMIT :lim"),
                {"lim": limit},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
