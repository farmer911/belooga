"""Taxonomy catalogs and dictionary autocompletion endpoints (Thin Controller)."""

from typing import Dict, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.catalogs import CatalogsService
from app.schemas.catalogs import CareerRoiResponse, SalaryBenchmarkResponse

router = APIRouter()


@router.get("/profile/skills/", response_model=List[str], tags=["Domain 7: Master Catalogs"])
async def list_skills(db: AsyncSession = Depends(get_db)):
    return await CatalogsService(db).list_skills()


@router.get("/profile/company/", response_model=List[Dict[str, str]], tags=["Domain 7: Master Catalogs"])
async def suggest_companies(
    name: str = Query("", description="Company prefix"),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).suggest_companies(name)


@router.get("/profile/school/", response_model=List[Dict[str, str]], tags=["Domain 7: Master Catalogs"])
async def suggest_schools(
    name: str = Query("", description="School prefix"),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).suggest_schools(name)


@router.get("/profile/location/", response_model=List[Dict[str, str]], tags=["Domain 7: Master Catalogs"])
async def suggest_locations(
    name: str = Query("", description="Location prefix"),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).suggest_locations(name)


@router.get("/catalogs/salary-benchmark", response_model=SalaryBenchmarkResponse, tags=["Domain 7: Master Catalogs"])
async def get_salary_benchmark(
    role: str = Query("backend", description="Domain / Role: backend, frontend, fullstack, devops, ai"),
    tech_stack: str = Query("Golang", description="Primary tech stack"),
    level: str = Query("Senior", description="Experience level: Junior, Mid, Senior, Lead"),
    location: str = Query("Ho Chi Minh", description="Work location"),
    db: AsyncSession = Depends(get_db),
):
    """Programmatic SEO & Market Radar Engine delegating to CatalogsService."""
    return await CatalogsService(db).get_salary_benchmark(role, tech_stack, level, location)


@router.get("/catalogs/career-roi", response_model=CareerRoiResponse, tags=["Domain 7: Master Catalogs"])
async def get_career_upskill_roi(
    tech_stack: str = Query("Golang", description="Primary tech stack"),
    level: str = Query("Senior", description="Experience level"),
    location: str = Query("Ho Chi Minh", description="Work location"),
    db: AsyncSession = Depends(get_db),
):
    """Calculate Career Upskill ROI & Salary Negotiation Leverage Script."""
    return await CatalogsService(db).get_career_roi(tech_stack, level, location)


