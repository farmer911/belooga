"""Taxonomy catalogs and dictionary autocompletion endpoints (Thin Controller)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.catalogs_service import CatalogsService

router = APIRouter()


@router.get("/profile/skills/", tags=["Domain 7: Master Catalogs"])
async def list_skills(db: AsyncSession = Depends(get_db)):
    service = CatalogsService(db)
    return await service.list_skills()


@router.get("/profile/company/", tags=["Domain 7: Master Catalogs"])
async def suggest_companies(
    name: str = Query("", description="Company prefix"),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogsService(db)
    return await service.suggest_companies(name)


@router.get("/profile/school/", tags=["Domain 7: Master Catalogs"])
async def suggest_schools(
    name: str = Query("", description="School prefix"),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogsService(db)
    return await service.suggest_schools(name)


@router.get("/profile/location/", tags=["Domain 7: Master Catalogs"])
async def suggest_locations(
    name: str = Query("", description="Location prefix"),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogsService(db)
    return await service.suggest_locations(name)
