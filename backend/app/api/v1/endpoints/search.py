from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter()

@router.get("/profile/search/", tags=["Domain 6: Talent Discovery & Search"])
async def search_candidates(
    key: Optional[str] = Query("", description="Keyword to search"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * limit
    clean_key = key.strip() if key else ""

    if clean_key:
        # Full-Text Search using generated search_vector and ts_rank
        query = text("""
            SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                   p.seeking_status, p.employment_status,
                   ts_rank(p.search_vector, plainto_tsquery('english', :q)) AS rank
            FROM candidate_profiles p
            WHERE p.is_hidden = FALSE
              AND (
                p.search_vector @@ plainto_tsquery('english', :q)
                OR p.first_name ILIKE :wildcard
                OR p.last_name ILIKE :wildcard
                OR p.headline ILIKE :wildcard
              )
            ORDER BY rank DESC, p.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        count_query = text("""
            SELECT COUNT(*) FROM candidate_profiles p
            WHERE p.is_hidden = FALSE
              AND (
                p.search_vector @@ plainto_tsquery('english', :q)
                OR p.first_name ILIKE :wildcard
                OR p.last_name ILIKE :wildcard
                OR p.headline ILIKE :wildcard
              )
        """)
        params = {"q": clean_key, "wildcard": f"%{clean_key}%", "limit": limit, "offset": offset}
        count_params = {"q": clean_key, "wildcard": f"%{clean_key}%"}
    else:
        query = text("""
            SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
                   p.seeking_status, p.employment_status, 1.0 AS rank
            FROM candidate_profiles p
            WHERE p.is_hidden = FALSE
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        count_query = text("SELECT COUNT(*) FROM candidate_profiles WHERE is_hidden = FALSE")
        params = {"limit": limit, "offset": offset}
        count_params = {}

    rows_res = await db.execute(query, params)
    total_res = await db.execute(count_query, count_params)
    total_count = total_res.scalar() or 0

    results = []
    for r in rows_res.fetchall():
        results.append({
            "id": str(r.id),
            "username": r.username,
            "full_name": f"{r.first_name} {r.last_name}",
            "headline": r.headline or "Candidate at Belooga",
            "location": r.location or "San Francisco, CA",
            "seeking_status": r.seeking_status or "Actively Looking",
            "avatar_url": "/images/avatar.jpg",
            "video_pitch_poster": "/images/home/matt-poster.png",
            "video_pitch_url": "/images/home/Ava_s_Video.mp4",
            "duration": "0:30"
        })

    return {
        "results": results,
        "page": page,
        "limit": limit,
        "total": total_count,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1
    }

@router.get("/profile/search/suggest/", tags=["Domain 6: Talent Discovery & Search"])
async def search_suggestions(
    key: str = Query(..., min_length=1, description="Prefix or keyword"),
    db: AsyncSession = Depends(get_db)
):
    clean_key = key.strip()
    query = text("""
        SELECT p.username, p.first_name, p.last_name, p.headline
        FROM candidate_profiles p
        WHERE p.first_name ILIKE :q
           OR p.last_name ILIKE :q
           OR p.headline ILIKE :q
           OR p.username ILIKE :q
        LIMIT 5
    """)
    res = await db.execute(query, {"q": f"%{clean_key}%"})
    suggestions = []
    for r in res.fetchall():
        suggestions.append({
            "username": r.username,
            "full_name": f"{r.first_name} {r.last_name}",
            "headline": r.headline or "Candidate"
        })
    return suggestions
