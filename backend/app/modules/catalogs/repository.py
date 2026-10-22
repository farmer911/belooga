"""Catalogs repository (Vertical Module: catalogs).

Data access layer for standardized taxonomies and autocomplete catalogs.
"""

from typing import Dict, List
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

DEFAULT_LOCATION_SEEDS = [
    ("San Francisco", "CA", "USA"),
    ("New York", "NY", "USA"),
    ("Austin", "TX", "USA"),
    ("Seattle", "WA", "USA"),
    ("Ho Chi Minh", None, "Vietnam"),
    ("Ha Noi", None, "Vietnam"),
    ("Remote", None, "Worldwide"),
]


class CatalogsRepository:
    """Repository handling master taxonomy lookups across PostgreSQL catalog tables."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_skills(self, limit: int = 100) -> List[str]:
        query = text("SELECT id, name FROM skills ORDER BY name ASC LIMIT :limit")
        res = await self.db.execute(query, {"limit": limit})
        return [r[1] for r in res.fetchall()]

    async def suggest_companies(self, name: str = "", limit: int = 20) -> List[Dict[str, str]]:
        pattern = f"%{name.strip()}%"
        query = text("""
            SELECT name, COALESCE(logo_url, '/images/logo.svg') AS logo_url
            FROM catalog_companies
            WHERE name ILIKE :pattern
            ORDER BY name ASC
            LIMIT :limit
        """)
        res = await self.db.execute(query, {"pattern": pattern, "limit": limit})
        return [{"name": r.name, "logo_url": r.logo_url} for r in res.fetchall()]

    async def suggest_schools(self, name: str = "", limit: int = 20) -> List[Dict[str, str]]:
        pattern = f"%{name.strip()}%"
        query = text("""
            SELECT name, COALESCE(logo_url, '/images/logo.svg') AS logo_url
            FROM catalog_schools
            WHERE name ILIKE :pattern
            ORDER BY name ASC
            LIMIT :limit
        """)
        res = await self.db.execute(query, {"pattern": pattern, "limit": limit})
        return [{"name": r.name, "logo_url": r.logo_url} for r in res.fetchall()]

    async def seed_locations_if_empty(self) -> None:
        await self.db.execute(text("SELECT pg_advisory_xact_lock(9003)"))
        cnt = (await self.db.execute(text("SELECT COUNT(*) FROM catalog_locations"))).scalar() or 0
        if cnt < len(DEFAULT_LOCATION_SEEDS):
            for city, state, country in DEFAULT_LOCATION_SEEDS:
                loc_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.location.{city}.{country}")
                await self.db.execute(
                    text("""
                        INSERT INTO catalog_locations (id, name, state, country)
                        VALUES (:id, :name, :state, :country)
                        ON CONFLICT DO NOTHING
                    """),
                    {"id": loc_id, "name": city, "state": state, "country": country},
                )
            await self.db.commit()

    async def suggest_locations(self, name: str = "", limit: int = 20) -> List[Dict[str, str]]:
        await self.seed_locations_if_empty()
        pattern = f"%{name.strip()}%"
        query = text("""
            SELECT name, state, country
            FROM catalog_locations
            WHERE name ILIKE :pattern OR COALESCE(state, '') ILIKE :pattern OR country ILIKE :pattern
            ORDER BY name ASC
            LIMIT :limit
        """)
        res = await self.db.execute(query, {"pattern": pattern, "limit": limit})
        items: List[Dict[str, str]] = []
        for r in res.fetchall():
            label = f"{r.name}, {r.state}, {r.country}" if r.state else f"{r.name}, {r.country}"
            items.append({"name": label})
        return items

    async def get_market_sample_stats(self) -> Dict[str, int]:
        res = await self.db.execute(
            text("""
                SELECT
                    (SELECT COUNT(*) FROM job_descriptions) AS jd_count,
                    (SELECT COUNT(*) FROM candidate_profiles WHERE is_hidden = FALSE) AS profile_count,
                    (SELECT COUNT(*) FROM skills) AS skill_count
            """)
        )
        row = res.mappings().first()
        if not row:
            return {"jd_count": 0, "profile_count": 0, "skill_count": 0}
        return {
            "jd_count": int(row["jd_count"] or 0),
            "profile_count": int(row["profile_count"] or 0),
            "skill_count": int(row["skill_count"] or 0),
        }
