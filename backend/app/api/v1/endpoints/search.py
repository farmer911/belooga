"""Candidate talent discovery and autocomplete search endpoints (Thin Controller)."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.catalogs_service import CatalogsService

router = APIRouter()


@router.get("/profile/search/", response_model=Dict[str, Any], tags=["Domain 6: Talent Discovery & Search"])
async def search_candidates(
    key: Optional[str] = Query("", description="Keyword to search"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    cursor: Optional[str] = Query(None, description="Opaque keyset cursor for O(1) deep pagination"),
    db: AsyncSession = Depends(get_db),
):
    """Search candidates using PostgreSQL plainto_tsquery full-text search against GIN search_vector (ADR-005)."""
    return await CatalogsService(db).search_candidates(key=key, page=page, limit=limit, cursor=cursor)


@router.get("/profile/search/suggest/", response_model=List[Dict[str, str]], tags=["Domain 6: Talent Discovery & Search"])
async def search_suggestions(
    key: str = Query(..., min_length=1, description="Prefix or keyword"),
    db: AsyncSession = Depends(get_db),
):
    return await CatalogsService(db).search_suggestions(key=key)
