"""Catalogs repository (Vertical Module: catalogs).

Data access layer for standardized taxonomies and autocomplete catalogs.
"""


from datetime import timezone
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalogs.companies_repository import CompanyDirectoryMixin

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


class CatalogsRepository(CompanyDirectoryMixin):
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

    async def _seed_catalog(self, lock_key: int, insert_sql: str, rows: List[tuple]) -> None:
        """Idempotent catalog seed: one INSERT ... SELECT unnest(...) instead of one roundtrip per row."""
        await self.db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": lock_key})
        await self.db.execute(text(insert_sql), {f"c{i}": list(col) for i, col in enumerate(zip(*rows))})
        await self.db.commit()

    async def seed_companies_if_empty(self) -> None:
        await self._seed_catalog(
            9001,
            "INSERT INTO catalog_companies (id, name, logo_url) SELECT * FROM unnest(CAST(:c0 AS uuid[]), CAST(:c1 AS text[]), CAST(:c2 AS text[])) ON CONFLICT DO NOTHING",
            [(uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.company.{n.lower()}"), n, logo) for n, logo in DEFAULT_COMPANY_SEEDS],
        )

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
        await self._seed_catalog(
            9002,
            "INSERT INTO catalog_schools (id, name, logo_url) SELECT * FROM unnest(CAST(:c0 AS uuid[]), CAST(:c1 AS text[]), CAST(:c2 AS text[])) ON CONFLICT DO NOTHING",
            [(uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.school.{n.lower()}"), n, logo) for n, logo in DEFAULT_SCHOOL_SEEDS],
        )

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
        await self._seed_catalog(
            9003,
            "INSERT INTO catalog_locations (id, name, state, country) SELECT * FROM unnest(CAST(:c0 AS uuid[]), CAST(:c1 AS text[]), CAST(:c2 AS text[]), CAST(:c3 AS text[])) ON CONFLICT DO NOTHING",
            [(uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.location.{c}.{co}"), c, st, co) for c, st, co in DEFAULT_LOCATION_SEEDS],
        )

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

    @staticmethod
    def _crawl_state(row: Any) -> Dict[str, Any]:
        return {
            "bonus_samples": int(row.bonus_samples),
            "last_crawled_at": row.crawled_at.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "career_postings_scanned": int(row.career_postings_scanned),
        }

    async def get_salary_crawl_state(self) -> Dict[str, Any]:
        row = (
            await self.db.execute(
                text("SELECT bonus_samples, career_postings_scanned, crawled_at FROM salary_crawl_runs ORDER BY crawled_at DESC LIMIT 1")
            )
        ).fetchone()
        if not row:
            return {"bonus_samples": 0, "last_crawled_at": None, "career_postings_scanned": 0}
        return self._crawl_state(row)

    async def record_salary_crawl_run(self, triggered_by: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        """Append one crawl run; bonus_samples accumulates from the previous run inside the same INSERT."""
        row = (
            await self.db.execute(
                text("""
                    WITH scanned AS (SELECT COUNT(*)::int AS cnt FROM career_postings WHERE is_active = TRUE),
                    prev AS (SELECT COALESCE((SELECT bonus_samples FROM salary_crawl_runs ORDER BY crawled_at DESC LIMIT 1), 0) AS bonus)
                    INSERT INTO salary_crawl_runs (triggered_by_identity_id, bonus_samples, career_postings_scanned)
                    SELECT :uid, prev.bonus + GREATEST(28, scanned.cnt * 4), scanned.cnt FROM scanned, prev
                    RETURNING bonus_samples, career_postings_scanned, crawled_at
                """),
                {"uid": triggered_by},
            )
        ).fetchone()
        await self.db.commit()
        return self._crawl_state(row)

    # --- Company directory (company_profiles + company_reviews + company_interview_questions) ---

    _COMPANY_SQL = """
        SELECT c.id, c.slug, c.owner_identity_id, c.name, c.industry, c.company_size, c.location, c.website,
               c.avg_rating::float AS avg_rating, c.review_count, c.avg_salary_usd, c.open_jobs_count, c.hiring_now,
               c.description, c.tech_stack, c.benefits, c.open_jobs, c.alumni,
               COALESCE((
                   SELECT json_agg(json_build_object(
                       'id', r.id, 'author_role', r.author_role, 'rating', r.rating, 'title', r.title,
                       'comment', r.comment, 'created_at', to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'))
                       ORDER BY r.created_at DESC)
                   FROM company_reviews r WHERE r.company_id = c.id
               ), '[]'::json) AS reviews
        FROM company_profiles c
    """
