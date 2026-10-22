"""Candidate talent discovery and autocomplete search endpoints (Thin Controller)."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.search import SearchService
from app.schemas.catalogs import SearchTrendingInsightsResponse, TopCandidateRankItemDTO

router = APIRouter()


@router.get("/profile/search/trending/", response_model=SearchTrendingInsightsResponse, tags=["Domain 6: Talent Discovery & Search"])
async def get_search_trending_insights(db: AsyncSession = Depends(get_db)):
    """Return real-time talent pool pulse and trending search keywords."""
    return await SearchService(db).get_trending_search_insights()


@router.get("/profile/search/", response_model=Dict[str, Any], tags=["Domain 6: Talent Discovery & Search"])
async def search_candidates(
    key: Optional[str] = Query("", description="Keyword to search"),
    skills: Optional[str] = Query(None, description="Comma-separated required skill names"),
    skill_ids: Optional[str] = Query(None, description="Comma-separated required skill IDs or names"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    cursor: Optional[str] = Query(None, description="Opaque keyset cursor for O(1) deep pagination"),
    db: AsyncSession = Depends(get_db),
):
    """Search candidates using PostgreSQL plainto_tsquery full-text search against GIN search_vector (ADR-005)."""
    return await SearchService(db).search_candidates(
        key=key, page=page, limit=limit, cursor=cursor, skills=skills, skill_ids=skill_ids
    )


@router.get("/search/candidates", response_model=Dict[str, Any], tags=["Domain 6: Talent Discovery & Search"])
async def search_candidates_multi_skill(
    key: Optional[str] = Query("", description="Keyword to search"),
    skills: Optional[str] = Query(None, description="Comma-separated required skill names"),
    skill_ids: Optional[str] = Query(None, description="Comma-separated required skill IDs or names"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    cursor: Optional[str] = Query(None, description="Opaque keyset cursor for O(1) deep pagination"),
    db: AsyncSession = Depends(get_db),
):
    """Multi-skill candidate search preserving PostgreSQL GIN search_vector (ADR-005)."""
    return await SearchService(db).search_candidates(
        key=key, page=page, limit=limit, cursor=cursor, skills=skills, skill_ids=skill_ids
    )


@router.get("/profile/search/suggest/", response_model=List[Dict[str, str]], tags=["Domain 6: Talent Discovery & Search"])
async def search_suggestions(
    key: str = Query(..., min_length=1, description="Prefix or keyword"),
    db: AsyncSession = Depends(get_db),
):
    return await SearchService(db).search_suggestions(key=key)


@router.get("/search/top-candidates", response_model=List[TopCandidateRankItemDTO], tags=["Domain 6: Talent Discovery & Search"])
async def get_top_high_potential_candidates(
    category: Optional[str] = Query(None, description="backend | frontend | ai | mobile | devops"),
    skill: Optional[str] = Query(None, description="Skill filter"),
    location: Optional[str] = Query(None, description="Location filter"),
    actively_looking_only: bool = Query(False),
    limit: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """BEL-195: Top High-Potential Candidates Ranking Engine & Leaderboard."""
    return await SearchService(db).get_top_candidates(
        category=category, skill=skill, location=location, actively_looking_only=actively_looking_only, limit=limit
    )

