from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter()

@router.get("/profile/skills/", tags=["Domain 7: Master Catalogs"])
async def list_skills(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT id, name FROM skills ORDER BY name ASC LIMIT 100"))
    skills = [r[1] for r in res.fetchall()]
    if not skills:
        skills = [
            "React", "TypeScript", "Python", "FastAPI", "PostgreSQL",
            "Next.js", "Docker", "Figma", "Product Design", "Tailwind CSS",
            "Node.js", "GraphQL", "Kubernetes", "AWS", "Product Management"
        ]
    return skills

@router.get("/profile/company/", tags=["Domain 7: Master Catalogs"])
async def suggest_companies(
    name: str = Query("", description="Company prefix"),
    db: AsyncSession = Depends(get_db)
):
    companies = [
        {"name": "Stripe Inc.", "logo_url": "/images/logo.svg"},
        {"name": "Airbnb", "logo_url": "/images/logo.svg"},
        {"name": "Google", "logo_url": "/images/logo.svg"},
        {"name": "Meta", "logo_url": "/images/logo.svg"},
        {"name": "Apple", "logo_url": "/images/logo.svg"},
        {"name": "Belooga", "logo_url": "/images/logo-big.png"},
    ]
    if name:
        return [c for c in companies if name.lower() in c["name"].lower()]
    return companies

@router.get("/profile/school/", tags=["Domain 7: Master Catalogs"])
async def suggest_schools(
    name: str = Query("", description="School prefix"),
    db: AsyncSession = Depends(get_db)
):
    schools = [
        {"name": "Stanford University"},
        {"name": "MIT"},
        {"name": "UC Berkeley"},
        {"name": "Harvard University"},
        {"name": "Carnegie Mellon University"},
    ]
    if name:
        return [s for s in schools if name.lower() in s["name"].lower()]
    return schools

@router.get("/profile/location/", tags=["Domain 7: Master Catalogs"])
async def suggest_locations(
    name: str = Query("", description="Location prefix"),
    db: AsyncSession = Depends(get_db)
):
    locations = [
        {"name": "San Francisco, CA, USA"},
        {"name": "New York, NY, USA"},
        {"name": "Austin, TX, USA"},
        {"name": "Seattle, WA, USA"},
        {"name": "Remote (Worldwide)"},
    ]
    if name:
        return [l for l in locations if name.lower() in l["name"].lower()]
    return locations
