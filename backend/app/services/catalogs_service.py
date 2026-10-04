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

    async def suggest_companies(self, name: str) -> List[Dict[str, str]]:
        if name:
            clean = name.lower()
            return [c for c in COMPANIES_CATALOG if clean in c["name"].lower()]
        return COMPANIES_CATALOG

    async def suggest_schools(self, name: str) -> List[Dict[str, str]]:
        if name:
            clean = name.lower()
            return [s for s in SCHOOLS_CATALOG if clean in s["name"].lower()]
        return SCHOOLS_CATALOG

    async def suggest_locations(self, name: str) -> List[Dict[str, str]]:
        if name:
            clean = name.lower()
            return [l for l in LOCATIONS_CATALOG if clean in l["name"].lower()]
        return LOCATIONS_CATALOG

    async def search_candidates(
        self, key: Optional[str] = "", page: int = 1, limit: int = 12
    ) -> Dict[str, Any]:
        offset = (page - 1) * limit
        clean_key = key.strip() if key else ""

        rows = await self.catalogs_repo.search_candidates_fulltext(clean_key, limit, offset)
        total_count = await self.catalogs_repo.count_candidates_fulltext(clean_key)

        results = []
        for r in rows:
            results.append({
                "id": str(r["id"]),
                "username": r["username"],
                "full_name": f"{r['first_name']} {r['last_name']}",
                "headline": r["headline"] or "Candidate at Belooga",
                "location": r["location"] or "San Francisco, CA",
                "seeking_status": r["seeking_status"] or "Actively Looking",
                "avatar_url": "/images/avatar.jpg",
                "video_pitch_poster": "/images/home/matt-poster.png",
                "video_pitch_url": "/images/home/Ava_s_Video.mp4",
                "duration": "0:30",
            })

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
