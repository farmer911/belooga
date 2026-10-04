from typing import Any, Dict, List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileUpdate(BaseModel):
    """Payload for updating candidate biographical profile attributes."""

    headline: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    seeking_status: Optional[str] = Field(None, max_length=64)
    employment_status: Optional[str] = Field(None, max_length=64)


class SkillAdd(BaseModel):
    """Payload for associating a skill with a candidate profile."""

    name: str = Field(..., min_length=1, max_length=100)


class SkillResponse(BaseModel):
    """Response returned upon modifying profile skills."""

    message: str
    id: Optional[UUID] = None
    name: Optional[str] = None


class ProfileLanguageItem(BaseModel):
    """Candidate spoken language item."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    proficiency: Optional[str] = "Fluent"


class ProfileResponse(BaseModel):
    """Full candidate profile representation."""

    model_config = ConfigDict(from_attributes=True)

    id: Union[UUID, str]
    username: str
    first_name: str
    last_name: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = "/images/avatar.jpg"
    video_pitch_url: Optional[str] = None
    video_pitch_poster: Optional[str] = None
    resume_url: Optional[str] = None
    seeking_status: Optional[str] = None
    employment_status: Optional[str] = None
    job_experiences: List[Dict[str, Any]] = Field(default_factory=list)
    education_experiences: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    languages: List[Dict[str, Any]] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
