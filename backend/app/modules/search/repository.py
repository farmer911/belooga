"""Talent discovery and full-text search repository (Vertical Module: search).

Data access layer for PostgreSQL GIN TSVECTOR full-text search, O(1) keyset cursor pagination,
and trigram candidate autocomplete suggestions.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class SearchRepository:
    """Repository handling search vectors, keyset cursor pagination, and candidate suggestions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_candidates_fulltext(
        self,
        clean_key: str,
        limit: int,
        offset: int,
        cursor_created_at: Optional[datetime] = None,
        cursor_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        has_cursor = cursor_created_at is not None and cursor_id is not None
        if clean_key:
            if has_cursor:
                query = text("""
                    WITH matched_pool AS MATERIALIZED (
                        SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                               p.seeking_status, p.employment_status, p.avatar_url, p.video_pitch_url,
                               p.created_at, p.search_vector
                        FROM candidate_profiles p
                        WHERE p.is_hidden = FALSE
                          AND p.search_vector @@ plainto_tsquery('english', :q)
                          AND (p.created_at, p.id) < (:cursor_ts, CAST(:cursor_id AS uuid))
                        LIMIT 500
                    )
                    SELECT id, username, first_name, last_name, headline, location,
                           seeking_status, employment_status, avatar_url, video_pitch_url,
                           created_at,
                           ts_rank_cd(search_vector, plainto_tsquery('english', :q)) AS rank
                    FROM matched_pool
                    ORDER BY rank DESC, created_at DESC, id DESC
                    LIMIT :limit
                """)
                params = {
                    "q": clean_key,
                    "cursor_ts": cursor_created_at,
                    "cursor_id": cursor_id,
                    "limit": limit,
                }
            else:
                query = text("""
                    WITH matched_pool AS MATERIALIZED (
                        SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                               p.seeking_status, p.employment_status, p.avatar_url, p.video_pitch_url,
                               p.created_at, p.search_vector
                        FROM candidate_profiles p
                        WHERE p.is_hidden = FALSE
                          AND p.search_vector @@ plainto_tsquery('english', :q)
                        LIMIT 500
                    )
                    SELECT id, username, first_name, last_name, headline, location,
                           seeking_status, employment_status, avatar_url, video_pitch_url,
                           created_at,
                           ts_rank_cd(search_vector, plainto_tsquery('english', :q)) AS rank
                    FROM matched_pool
                    ORDER BY rank DESC, created_at DESC, id DESC
                    LIMIT :limit OFFSET :offset
                """)
                params = {"q": clean_key, "limit": limit, "offset": offset}
        else:
            if has_cursor:
                query = text("""
                    SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                           p.seeking_status, p.employment_status, p.avatar_url, p.video_pitch_url,
                           p.created_at, 1.0 AS rank
                    FROM candidate_profiles p
                    WHERE p.is_hidden = FALSE
                      AND (p.created_at, p.id) < (:cursor_ts, CAST(:cursor_id AS uuid))
                    ORDER BY p.created_at DESC, p.id DESC
                    LIMIT :limit
                """)
                params = {
                    "cursor_ts": cursor_created_at,
                    "cursor_id": cursor_id,
                    "limit": limit,
                }
            else:
                query = text("""
                    SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                           p.seeking_status, p.employment_status, p.avatar_url, p.video_pitch_url,
                           p.created_at, 1.0 AS rank
                    FROM candidate_profiles p
                    WHERE p.is_hidden = FALSE
                    ORDER BY p.created_at DESC, p.id DESC
                    LIMIT :limit OFFSET :offset
                """)
                params = {"limit": limit, "offset": offset}

        res = await self.db.execute(query, params)
        return [dict(r._mapping) for r in res.fetchall()]

    async def count_candidates_fulltext(self, clean_key: str) -> int:
        if clean_key:
            count_query = text("""
                SELECT COUNT(*) FROM (
                    SELECT 1 FROM candidate_profiles p
                    WHERE p.is_hidden = FALSE
                      AND p.search_vector @@ plainto_tsquery('english', :q)
                    LIMIT 1000
                ) bounded_matches
            """)
            count_params = {"q": clean_key}
        else:
            count_query = text("""
                SELECT CASE
                    WHEN (SELECT reltuples::bigint FROM pg_class WHERE oid = 'candidate_profiles'::regclass) > 10000
                    THEN (SELECT reltuples::bigint FROM pg_class WHERE oid = 'candidate_profiles'::regclass)
                    ELSE (SELECT COUNT(*) FROM candidate_profiles WHERE is_hidden = FALSE)
                END
            """)
            count_params = {}

        res = await self.db.execute(count_query, count_params)
        return int(res.scalar() or 0)

    async def suggest_candidates(self, clean_key: str, limit: int = 5) -> List[Dict[str, Any]]:
        query = text("""
            SELECT p.username, p.first_name, p.last_name, p.headline
            FROM candidate_profiles p
            WHERE p.is_hidden = FALSE
              AND (
                coalesce(p.first_name, '') || ' ' ||
                coalesce(p.last_name, '') || ' ' ||
                coalesce(p.username, '') || ' ' ||
                coalesce(p.headline, '')
              ) ILIKE :q
            LIMIT :limit
        """)
        res = await self.db.execute(query, {"q": f"%{clean_key}%", "limit": limit})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_talent_pool_stats(self) -> tuple[int, float]:
        query = text("""
            SELECT
                COUNT(*) FILTER (WHERE is_hidden = FALSE) AS total_visible,
                COUNT(*) FILTER (
                    WHERE is_hidden = FALSE
                      AND video_pitch_url IS NOT NULL
                      AND video_pitch_url <> ''
                ) AS video_verified
            FROM candidate_profiles
        """)
        row = (await self.db.execute(query)).fetchone()
        total = int(row.total_visible or 0) if row else 0
        verified = int(row.video_verified or 0) if row else 0
        pct = round((verified * 100.0) / total, 1) if total > 0 else 0.0
        return total, pct

    async def get_top_trending_skills(self, limit: int = 5) -> List[Dict[str, Any]]:
        query = text("""
            SELECT s.name AS keyword, COUNT(ps.profile_id) AS profile_count
            FROM skills s
            JOIN profile_skills ps ON ps.skill_id = s.id
            JOIN candidate_profiles p ON p.id = ps.profile_id AND p.is_hidden = FALSE
            GROUP BY s.id, s.name
            ORDER BY profile_count DESC, s.name ASC
            LIMIT :limit
        """)
        res = await self.db.execute(query, {"limit": limit})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_skills_for_profiles(self, profile_ids: List[str]) -> Dict[str, List[str]]:
        if not profile_ids:
            return {}
        res = await self.db.execute(
            text("""
                SELECT CAST(ps.profile_id AS text) AS pid, s.name AS skill_name
                FROM profile_skills ps
                JOIN skills s ON s.id = ps.skill_id
                ORDER BY s.name ASC
            """)
        )
        wanted = set(profile_ids)
        out: Dict[str, List[str]] = {}
        for row in res.fetchall():
            if row.pid in wanted:
                out.setdefault(row.pid, []).append(row.skill_name)
        return out
