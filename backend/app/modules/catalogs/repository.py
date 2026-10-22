"""Catalogs repository (Vertical Module: catalogs).

Data access layer for standardized taxonomies and autocomplete catalogs.
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

DEFAULT_COMPANY_SEEDS = [
    ("Stripe Inc.", "/images/logo.svg"),
    ("Airbnb", "/images/logo.svg"),
    ("Google", "/images/logo.svg"),
    ("Meta", "/images/logo.svg"),
    ("Apple", "/images/logo.svg"),
    ("Belooga", "/images/logo-big.png"),
]

DEFAULT_SCHOOL_SEEDS = [
    ("Stanford University", "/images/logo.svg"),
    ("MIT", "/images/logo.svg"),
    ("UC Berkeley", "/images/logo.svg"),
    ("Harvard University", "/images/logo.svg"),
    ("Carnegie Mellon University", "/images/logo.svg"),
]

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

    async def list_skill_items(self, q: str = "", limit: int = 100) -> List[Dict[str, str]]:
        seed_names = [
            "Golang", "Python", "React", "Next.js", "TypeScript", "Kubernetes",
            "PostgreSQL", "AWS", "Docker", "System Design", "AI/LLM", "FastAPI",
        ]
        clean_q = (q or "").strip()
        if clean_q:
            res = await self.db.execute(
                text("SELECT id, name FROM skills WHERE name ILIKE :q ORDER BY name ASC LIMIT :limit"),
                {"q": f"%{clean_q}%", "limit": limit},
            )
        else:
            res = await self.db.execute(text("SELECT id, name FROM skills ORDER BY name ASC LIMIT :limit"), {"limit": limit})
        db_items = [{"id": str(r.id), "name": r.name, "category": "Engineering"} for r in res.fetchall()]
        by_lower = {i["name"].lower(): i for i in db_items}
        prioritized: List[Dict[str, str]] = []
        for sname in seed_names:
            if not clean_q or clean_q.lower() in sname.lower():
                sid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.skill.{sname.lower()}"))
                prioritized.append(by_lower.pop(sname.lower(), {"id": sid, "name": sname, "category": "Engineering"}))
        return (prioritized + list(by_lower.values()))[:limit]

    async def create_or_get_skill(self, name: str, category: str = "Engineering") -> Dict[str, str]:
        clean_name = name.strip()
        res = await self.db.execute(
            text("SELECT id, name FROM skills WHERE LOWER(name) = LOWER(:name) LIMIT 1"),
            {"name": clean_name},
        )
        row = res.fetchone()
        if row:
            return {"id": str(row.id), "name": row.name, "category": category or "Engineering"}
        new_id = uuid.uuid4()
        await self.db.execute(
            text("INSERT INTO skills (id, name) VALUES (:id, :name)"),
            {"id": new_id, "name": clean_name},
        )
        await self.db.commit()
        return {"id": str(new_id), "name": clean_name, "category": category or "Engineering"}

    async def seed_companies_if_empty(self) -> None:
        await self.db.execute(text("SELECT pg_advisory_xact_lock(9001)"))
        for cname, logo in DEFAULT_COMPANY_SEEDS:
            cid = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.company.{cname.lower()}")
            await self.db.execute(
                text("INSERT INTO catalog_companies (id, name, logo_url) VALUES (:id, :name, :logo) ON CONFLICT DO NOTHING"),
                {"id": cid, "name": cname, "logo": logo},
            )
        await self.db.commit()

    async def suggest_companies(self, name: str = "", limit: int = 20) -> List[Dict[str, str]]:
        await self.seed_companies_if_empty()
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

    async def seed_schools_if_empty(self) -> None:
        await self.db.execute(text("SELECT pg_advisory_xact_lock(9002)"))
        for sname, logo in DEFAULT_SCHOOL_SEEDS:
            sid = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.school.{sname.lower()}")
            await self.db.execute(
                text("INSERT INTO catalog_schools (id, name, logo_url) VALUES (:id, :name, :logo) ON CONFLICT DO NOTHING"),
                {"id": sid, "name": sname, "logo": logo},
            )
        await self.db.commit()

    async def suggest_schools(self, name: str = "", limit: int = 20) -> List[Dict[str, str]]:
        await self.seed_schools_if_empty()
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

    async def get_salary_crawl_state(self) -> Dict[str, Any]:
        res = await self.db.execute(
            text("SELECT message FROM contact_inquiries WHERE name = 'SALARY_CRAWL:LATEST' LIMIT 1")
        )
        row = res.fetchone()
        if row and row.message:
            return json.loads(row.message)
        return {"bonus_samples": 0, "last_crawled_at": "2026-10-22 18:00 UTC"}

    async def record_salary_crawl_run(self) -> Dict[str, Any]:
        career_cnt = (await self.db.execute(text("SELECT COUNT(*) FROM career_postings WHERE is_active = TRUE"))).scalar() or 0
        current = await self.get_salary_crawl_state()
        bonus = int(current.get("bonus_samples", 0)) + max(28, int(career_cnt) * 4)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        state = {"bonus_samples": bonus, "last_crawled_at": now_str, "career_postings_scanned": int(career_cnt)}
        msg = json.dumps(state)
        existing = (await self.db.execute(text("SELECT id FROM contact_inquiries WHERE name = 'SALARY_CRAWL:LATEST' LIMIT 1"))).fetchone()
        if existing:
            await self.db.execute(text("UPDATE contact_inquiries SET message = :m WHERE id = :id"), {"m": msg, "id": existing.id})
        else:
            await self.db.execute(
                text("INSERT INTO contact_inquiries (id, name, email, message) VALUES (:id, 'SALARY_CRAWL:LATEST', 'crawler@belooga.internal', :m)"),
                {"id": uuid.uuid4(), "m": msg},
            )
        await self.db.commit()
        return state

    async def list_persisted_companies(self) -> List[Dict[str, Any]]:
        res = await self.db.execute(
            text("SELECT message FROM contact_inquiries WHERE name LIKE 'COMPANY_PROFILE:%' ORDER BY created_at DESC")
        )
        out: List[Dict[str, Any]] = []
        for r in res.fetchall():
            if r.message:
                try:
                    out.append(json.loads(r.message))
                except Exception:
                    continue
        return out

    async def upsert_company(self, slug: str, data: Dict[str, Any]) -> Dict[str, Any]:
        key_name = f"COMPANY_PROFILE:{slug}"
        msg = json.dumps(data, ensure_ascii=False)
        existing = (
            await self.db.execute(text("SELECT id FROM contact_inquiries WHERE name = :n LIMIT 1"), {"n": key_name})
        ).fetchone()
        if existing:
            await self.db.execute(text("UPDATE contact_inquiries SET message = :m WHERE id = :id"), {"m": msg, "id": existing.id})
        else:
            await self.db.execute(
                text("INSERT INTO contact_inquiries (id, name, email, message) VALUES (:id, :n, 'companies@belooga.internal', :m)"),
                {"id": uuid.uuid4(), "n": key_name, "m": msg},
            )
        await self.db.commit()
        return data

