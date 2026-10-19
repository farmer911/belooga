"""Catalogs and search service.

Business domain service for skills taxonomy, dictionary autocompletes,
and full-text candidate discovery using PostgreSQL search_vector rankings.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.catalogs_repo import CatalogsRepository

DEFAULT_SKILLS = [
    "React", "TypeScript", "Python", "FastAPI", "PostgreSQL",
    "Next.js", "Docker", "Figma", "Product Design", "Tailwind CSS",
    "Node.js", "GraphQL", "Kubernetes", "AWS", "Product Management",
]

COMPANIES_CATALOG = [
    {"name": "Stripe Inc.", "logo_url": "/images/logo.svg"},
    {"name": "Airbnb", "logo_url": "/images/logo.svg"},
    {"name": "Google", "logo_url": "/images/logo.svg"},
    {"name": "Meta", "logo_url": "/images/logo.svg"},
    {"name": "Apple", "logo_url": "/images/logo.svg"},
    {"name": "Belooga", "logo_url": "/images/logo-big.png"},
]

SCHOOLS_CATALOG = [
    {"name": "Stanford University"},
    {"name": "MIT"},
    {"name": "UC Berkeley"},
    {"name": "Harvard University"},
    {"name": "Carnegie Mellon University"},
]

LOCATIONS_CATALOG = [
    {"name": "San Francisco, CA, USA"},
    {"name": "New York, NY, USA"},
    {"name": "Austin, TX, USA"},
    {"name": "Seattle, WA, USA"},
    {"name": "Remote (Worldwide)"},
]


class CatalogsService:
    """Service layer managing master taxonomies and talent discovery queries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.catalogs_repo = CatalogsRepository(db)

    async def list_skills(self) -> List[str]:
        skills = await self.catalogs_repo.list_skills(limit=100)
        return skills if skills else DEFAULT_SKILLS

    @staticmethod
    def _filter_catalog(catalog: List[Dict[str, str]], name: str) -> List[Dict[str, str]]:
        if not name:
            return catalog
        clean = name.lower()
        return [item for item in catalog if clean in item["name"].lower()]

    async def suggest_companies(self, name: str) -> List[Dict[str, str]]:
        return self._filter_catalog(COMPANIES_CATALOG, name)

    async def suggest_schools(self, name: str) -> List[Dict[str, str]]:
        return self._filter_catalog(SCHOOLS_CATALOG, name)

    async def suggest_locations(self, name: str) -> List[Dict[str, str]]:
        return self._filter_catalog(LOCATIONS_CATALOG, name)

    async def search_candidates(
        self, key: Optional[str] = "", page: int = 1, limit: int = 12
    ) -> Dict[str, Any]:
        offset = (page - 1) * limit
        clean_key = key.strip() if key else ""

        rows = await self.catalogs_repo.search_candidates_fulltext(clean_key, limit, offset)
        total_count = await self.catalogs_repo.count_candidates_fulltext(clean_key)

        results = [
            {
                "id": str(r["id"]),
                "username": r["username"],
                "full_name": f"{r['first_name']} {r['last_name']}",
                "headline": r["headline"] or "Candidate at Belooga",
                "location": r["location"] or "San Francisco, CA",
                "seeking_status": r["seeking_status"] or "Actively Looking",
                "avatar_url": r.get("avatar_url") or "/images/avatar.jpg",
                "video_pitch_poster": "/images/home/matt-poster.png",
                "video_pitch_url": r.get("video_pitch_url") or "/images/home/Ava_s_Video.mp4",
                "duration": "0:30",
            }
            for r in rows
        ]

        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        return {
            "results": results,
            "page": page,
            "limit": limit,
            "total": total_count,
            "total_pages": total_pages,
        }

    async def search_suggestions(self, key: str) -> List[Dict[str, str]]:
        clean_key = key.strip()
        rows = await self.catalogs_repo.suggest_candidates(clean_key, limit=5)
        return [
            {
                "username": r["username"],
                "full_name": f"{r['first_name']} {r['last_name']}",
                "headline": r["headline"] or "Candidate",
            }
            for r in rows
        ]

    def get_salary_benchmark(
        self, role: str, tech_stack: str, level: str, location: str
    ) -> Dict[str, Any]:
        level_lower = level.lower()
        if "lead" in level_lower:
            p25, base_median, p75 = 52_000_000, 65_000_000, 85_000_000
        elif "mid" in level_lower:
            p25, base_median, p75 = 23_000_000, 28_000_000, 35_000_000
        elif "junior" in level_lower or "fresher" in level_lower:
            p25, base_median, p75 = 14_000_000, 18_000_000, 22_000_000
        else:
            p25, base_median, p75 = 36_000_000, 45_000_000, 58_000_000

        stack_lower = tech_stack.lower()
        multiplier = (
            1.20 if any(s in stack_lower for s in ("golang", "rust", "kubernetes", "ai", "machine learning"))
            else 1.10 if any(s in stack_lower for s in ("python", "java", "devops"))
            else 1.0
        )

        if "go" in stack_lower:
            raw_skills = [
                ("Apache Kafka", "+25%", 88), ("Kubernetes & Helm", "+22%", 82),
                ("gRPC / Protocol Buffers", "+18%", 76), ("Redis Cluster", "+15%", 91),
                ("Distributed Tracing", "+14%", 65),
            ]
        elif "react" in stack_lower or "front" in role.lower():
            raw_skills = [
                ("Next.js 15/16 App Router", "+24%", 89), ("TypeScript Strict", "+18%", 94),
                ("WebRTC / Streaming", "+28%", 58), ("Tailwind CSS v4", "+12%", 85),
                ("React Query & State", "+15%", 79),
            ]
        elif "ai" in stack_lower or "python" in stack_lower:
            raw_skills = [
                ("PyTorch / vLLM", "+32%", 84), ("FastAPI Async", "+18%", 90),
                ("LangGraph / Agentic AI", "+35%", 72), ("Postgres Vector / pgvector", "+20%", 68),
                ("Docker & Triton Server", "+22%", 75),
            ]
        else:
            raw_skills = [
                ("Microservices Architecture", "+25%", 85), ("CI/CD Pipeline Automation", "+18%", 82),
                ("SQL Optimization", "+15%", 88), ("Cloud AWS/GCP", "+22%", 78),
                ("System Security", "+20%", 64),
            ]

        return {
            "role": role,
            "tech_stack": tech_stack,
            "level": level,
            "location": location,
            "p25_salary_vnd": int(p25 * multiplier),
            "p50_salary_vnd": int(base_median * multiplier),
            "p75_salary_vnd": int(p75 * multiplier),
            "sample_size_jds": 342,
            "top_paid_skills": [
                {"name": n, "salary_premium": p, "popularity_pct": pct} for n, p, pct in raw_skills
            ],
            "market_demand": "VERY_HIGH" if multiplier > 1.1 else "HIGH",
            "growth_rate_yoy": "+18.5%",
        }
