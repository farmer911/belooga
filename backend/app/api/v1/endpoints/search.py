"""Candidate talent discovery and autocomplete search endpoints (Thin Controller)."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.catalogs_service import CatalogsService

router = APIRouter()


@router.get("/profile/search/", tags=["Domain 6: Talent Discovery & Search"])
async def search_candidates(
    key: Optional[str] = Query("", description="Keyword to search"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Search candidates using PostgreSQL plainto_tsquery full-text search against GIN search_vector (ADR-005)."""
    service = CatalogsService(db)
    return await service.search_candidates(key=key, page=page, limit=limit)


@router.get("/profile/search/suggest/", tags=["Domain 6: Talent Discovery & Search"])
async def search_suggestions(
    key: str = Query(..., min_length=1, description="Prefix or keyword"),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogsService(db)
    return await service.search_suggestions(key=key)
