from typing import Any, Dict, List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileUpdate(BaseModel):
    """Payload for updating candidate biographical profile attributes."""

    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    headline: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    seeking_status: Optional[str] = Field(None, max_length=64)
    employment_status: Optional[str] = Field(None, max_length=64)
    is_hidden: Optional[bool] = None


class SkillAdd(BaseModel):
    """Payload for associating a skill with a candidate profile."""

    name: str = Field(..., min_length=1, max_length=100)


class LanguageAdd(BaseModel):
    """Payload for associating a spoken language with a candidate profile."""

    name: str = Field(..., min_length=1, max_length=100)
    proficiency: str = Field("Fluent", min_length=1, max_length=50)


class InterestAdd(BaseModel):
    """Payload for associating an interest with a candidate profile."""

    name: str = Field(..., min_length=1, max_length=100)


class SkillResponse(BaseModel):
    """Response returned upon modifying profile skills, languages, or interests."""

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
    is_hidden: Optional[bool] = False
    job_experiences: List[Dict[str, Any]] = Field(default_factory=list)
    education_experiences: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    languages: List[Dict[str, Any]] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)


class TrustPillarItem(BaseModel):
    """Individual pillar of the Candidate Trust & Recruiter Readiness Score."""

    pillar: str
    score: int
    max_score: int
    status: str
    detail: str


class ProfileTrustScoreResponse(BaseModel):
    """Recruiter Readiness & Verification Trust Scorecard for a candidate profile."""

    username: str
    trust_score: int
    readiness_tier: str
    recruiter_conversion_multiplier: float
    pillars: List[TrustPillarItem] = Field(default_factory=list)
    next_boost_action: str
