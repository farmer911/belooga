"""Catalogs repository (Vertical Module: catalogs).

Data access layer for standardized taxonomies and autocomplete catalogs.
"""

from typing import Dict, List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


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
            SELECT name
            FROM catalog_schools
            WHERE name ILIKE :pattern
            ORDER BY name ASC
            LIMIT :limit
        """)
        res = await self.db.execute(query, {"pattern": pattern, "limit": limit})
        return [{"name": r.name} for r in res.fetchall()]

    async def suggest_locations(self, name: str = "", limit: int = 20) -> List[Dict[str, str]]:
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
