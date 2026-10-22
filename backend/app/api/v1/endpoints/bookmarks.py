"""Candidate Shortlist Bookmarks endpoints (Thin Controller — BEL-145)."""

from typing import List, Optional
from fastapi import APIRouter, Body, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user
from app.modules.bookmarks import BookmarkService
from app.schemas.bookmarks import BookmarkCreateRequest, CandidateBookmarkItemDTO

router = APIRouter(tags=["Domain 6: Talent Discovery & Search"])


@router.get("/bookmarks/", response_model=List[CandidateBookmarkItemDTO])
async def list_candidate_bookmarks(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List bookmarked candidates for the authenticated recruiter."""
    return await BookmarkService(db).list_bookmarks(current_user.id)


@router.post("/bookmarks/{username}/", response_model=CandidateBookmarkItemDTO, status_code=status.HTTP_201_CREATED)
async def add_candidate_bookmark(
    username: str,
    payload: Optional[BookmarkCreateRequest] = Body(default=None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bookmark a visible candidate profile for the authenticated recruiter."""
    note = payload.note if payload else None
    return await BookmarkService(db).add_bookmark(
        recruiter_identity_id=current_user.id,
        username=username,
        note=note,
    )


@router.delete("/bookmarks/{username}/", response_model=dict[str, str])
async def remove_candidate_bookmark(
    username: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a candidate profile from the authenticated recruiter's shortlist."""
    return await BookmarkService(db).remove_bookmark(
        recruiter_identity_id=current_user.id,
        username=username,
    )
