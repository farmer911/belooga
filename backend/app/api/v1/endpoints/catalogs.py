"""Taxonomy catalogs and dictionary autocompletion endpoints (Thin Controller)."""

from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.security import AuthenticatedUser, get_current_user, require_role
from app.modules.catalogs import CatalogsService, CompaniesService
from app.schemas.catalogs import (
    CareerRoiResponse,
    CatalogItemResponse,
    CompanyInterviewQuestionCreateRequest,
    CompanyInterviewQuestionItemDTO,
    CompanyProfileCreateRequest,
    CompanyProfileItemDTO,
    CompanyProfileUpdateRequest,
    CompanyReviewCreateRequest,
    SalaryBenchmarkResponse,
    SalaryCrawlRequest,
    SkillCreateRequest,
)

router = APIRouter()


@router.get("/profile/skills/", response_model=List[str], tags=["Domain 7: Master Catalogs"])
async def list_skills(db: AsyncSession = Depends(get_read_db)):
    return await CatalogsService(db).list_skills()


@router.get("/catalogs/skills", response_model=List[CatalogItemResponse], tags=["Domain 7: Master Catalogs"])
async def list_catalog_skills(
    q: Optional[str] = Query("", description="Filter skills by keyword"),
    db: AsyncSession = Depends(get_read_db),
):
    return await CatalogsService(db).list_skill_catalog(q=q or "")


@router.get("/catalogs/skills/", response_model=List[CatalogItemResponse], tags=["Domain 7: Master Catalogs"])
async def list_catalog_skills_slash(
    q: Optional[str] = Query("", description="Filter skills by keyword"),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).list_skill_catalog(q=q or "")


@router.post("/catalogs/skills", response_model=CatalogItemResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 7: Master Catalogs"])
async def create_catalog_skill(
    payload: SkillCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).create_skill_catalog(name=payload.name, category=payload.category or "Engineering")


@router.post("/catalogs/skills/", response_model=CatalogItemResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 7: Master Catalogs"])
async def create_catalog_skill_slash(
    payload: SkillCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).create_skill_catalog(name=payload.name, category=payload.category or "Engineering")


@router.get("/catalogs/locations/", response_model=List[Dict[str, str]], tags=["Domain 7: Master Catalogs"])
async def list_catalog_locations(
    name: str = Query("", description="Location prefix"),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).suggest_locations(name)


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
    year: str = Query("all", description="Historical filter year: 2024 | 2025 | 2026 | all"),
    db: AsyncSession = Depends(get_db),
):
    """Programmatic SEO & Market Radar Engine delegating to CatalogsService."""
    return await CatalogsService(db).get_salary_benchmark(role, tech_stack, level, location, year=year)


@router.post("/catalogs/salary-benchmark/crawl", response_model=SalaryBenchmarkResponse, tags=["Domain 7: Master Catalogs"])
async def trigger_salary_crawler(
    payload: Optional[SalaryCrawlRequest] = None,
    current_user: AuthenticatedUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Trigger automated IT salary crawler across live JDs and public sources."""
    req = payload or SalaryCrawlRequest()
    return await CatalogsService(db).crawl_salary_benchmark(
        role=req.role or "backend",
        tech_stack=req.tech_stack or "Golang",
        level=req.level or "Senior",
        location=req.location or req.city or "Ho Chi Minh",
        triggered_by=current_user.id,
    )


@router.get("/catalogs/career-roi", response_model=CareerRoiResponse, tags=["Domain 7: Master Catalogs"])
async def get_career_upskill_roi(
    tech_stack: str = Query("Golang", description="Primary tech stack"),
    level: str = Query("Senior", description="Experience level"),
    location: str = Query("Ho Chi Minh", description="Work location"),
    db: AsyncSession = Depends(get_db),
):
    """Calculate Career Upskill ROI & Salary Negotiation Leverage Script."""
    return await CatalogsService(db).get_career_roi(tech_stack, level, location)


@router.get("/companies/", response_model=List[CompanyProfileItemDTO], tags=["Domain 7: Master Catalogs"])
async def list_companies_directory(
    q: Optional[str] = Query(None),
    tech_stack: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    company_size: Optional[str] = Query(None),
    min_rating: float = Query(0.0),
    hiring_only: bool = Query(False),
    sort_by: str = Query("rating"),
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).search_companies(
        q=q, tech_stack=tech_stack, industry=industry, location=location,
        company_size=company_size, min_rating=min_rating, hiring_only=hiring_only, sort_by=sort_by,
    )


@router.get("/companies/search", response_model=List[CompanyProfileItemDTO], tags=["Domain 7: Master Catalogs"])
async def search_companies_directory(
    q: Optional[str] = Query(None),
    tech_stack: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    company_size: Optional[str] = Query(None),
    min_rating: float = Query(0.0),
    hiring_only: bool = Query(False),
    sort_by: str = Query("rating"),
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).search_companies(
        q=q, tech_stack=tech_stack, industry=industry, location=location,
        company_size=company_size, min_rating=min_rating, hiring_only=hiring_only, sort_by=sort_by,
    )


@router.post("/companies/", response_model=CompanyProfileItemDTO, status_code=status.HTTP_201_CREATED, tags=["Domain 7: Master Catalogs"])
async def create_company_profile(
    payload: CompanyProfileCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).create_company(payload, current_user)


@router.get("/companies/{slug}", response_model=CompanyProfileItemDTO, tags=["Domain 7: Master Catalogs"])
async def get_company_profile(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).get_company(slug)


@router.patch("/companies/{slug}", response_model=CompanyProfileItemDTO, tags=["Domain 7: Master Catalogs"])
async def update_company_profile(
    slug: str,
    payload: CompanyProfileUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).update_company(slug, payload, current_user)


@router.post("/companies/{slug}/reviews", response_model=CompanyProfileItemDTO, status_code=status.HTTP_201_CREATED, tags=["Domain 7: Master Catalogs"])
async def add_company_review(
    slug: str,
    payload: CompanyReviewCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).add_review(slug, payload, current_user)


@router.get("/companies/{slug}/interview-questions", response_model=List[CompanyInterviewQuestionItemDTO], tags=["Domain 7: Master Catalogs"])
async def list_company_interview_questions(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).list_interview_questions(slug)


@router.post("/companies/{slug}/interview-questions", response_model=CompanyInterviewQuestionItemDTO, status_code=status.HTTP_201_CREATED, tags=["Domain 7: Master Catalogs"])
async def add_company_interview_question(
    slug: str,
    payload: CompanyInterviewQuestionCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CompaniesService(db).add_interview_question(slug, payload, current_user)




