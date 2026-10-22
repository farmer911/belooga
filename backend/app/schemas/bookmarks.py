"""Pydantic v2 DTO schemas for Candidate Shortlist Bookmarks (BEL-145)."""

from typing import Optional
from pydantic import BaseModel, Field


class BookmarkCreateRequest(BaseModel):
    """Optional note payload when bookmarking a candidate profile."""

    note: Optional[str] = Field(default=None, max_length=1000)


class CandidateBookmarkItemDTO(BaseModel):
    """Enriched candidate bookmark metadata matching Design Spec #64."""

    id: str
    recruiter_identity_id: str
    candidate_profile_id: str
    username: str
    full_name: str
    headline: str = ""
    location: str = ""
    seeking_status: str = "Open to Offers"
    avatar_url: Optional[str] = None
    note: Optional[str] = None
    created_at: str
