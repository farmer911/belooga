"""Catalogs and talent search repository.

Data access layer for standardized taxonomies, autocomplete catalogs, and PostgreSQL GIN search.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class CatalogsRepository:
    """Repository handling search vectors and master taxonomy lookups."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_skills(self, limit: int = 100) -> List[str]:
        query = text("SELECT id, name FROM skills ORDER BY name ASC LIMIT :limit")
        res = await self.db.execute(query, {"limit": limit})
        return [r[1] for r in res.fetchall()]

    async def search_candidates_fulltext(
        self, clean_key: str, limit: int, offset: int
    ) -> List[Dict[str, Any]]:
        if clean_key:
            query = text("""
                SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                       p.seeking_status, p.employment_status,
                       ts_rank(p.search_vector, plainto_tsquery('english', :q)) AS rank
                FROM candidate_profiles p
                WHERE p.is_hidden = FALSE
                  AND p.search_vector @@ plainto_tsquery('english', :q)
                ORDER BY rank DESC, p.created_at DESC
                LIMIT :limit OFFSET :offset
            """)
            params = {"q": clean_key, "limit": limit, "offset": offset}
        else:
            query = text("""
                SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                       p.seeking_status, p.employment_status, 1.0 AS rank
                FROM candidate_profiles p
                WHERE p.is_hidden = FALSE
                ORDER BY p.created_at DESC
                LIMIT :limit OFFSET :offset
            """)
            params = {"limit": limit, "offset": offset}

        res = await self.db.execute(query, params)
        return [dict(r._mapping) for r in res.fetchall()]

    async def count_candidates_fulltext(self, clean_key: str) -> int:
        if clean_key:
            count_query = text("""
                SELECT COUNT(*) FROM candidate_profiles p
                WHERE p.is_hidden = FALSE
                  AND p.search_vector @@ plainto_tsquery('english', :q)
            """)
            count_params = {"q": clean_key}
        else:
            count_query = text("SELECT COUNT(*) FROM candidate_profiles WHERE is_hidden = FALSE")
            count_params = {}

        res = await self.db.execute(count_query, count_params)
        return res.scalar() or 0

    async def suggest_candidates(self, clean_key: str, limit: int = 5) -> List[Dict[str, Any]]:
        query = text("""
            SELECT p.username, p.first_name, p.last_name, p.headline
            FROM candidate_profiles p
            WHERE p.is_hidden = FALSE
              AND (
                p.first_name ILIKE :q
                OR p.last_name ILIKE :q
                OR p.headline ILIKE :q
                OR p.username ILIKE :q
              )
            LIMIT :limit
        """)
        res = await self.db.execute(query, {"q": f"%{clean_key}%", "limit": limit})
        return [dict(r._mapping) for r in res.fetchall()]
