from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactInquiryRequest(BaseModel):
    """Payload for submitting a public contact inquiry."""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    message: str = Field(..., min_length=1)


class ContactInquiryResponse(BaseModel):
    """Response returned after submitting contact inquiry."""

    message: str
    id: Union[UUID, str]


class ReportProfileRequest(BaseModel):
    """Payload for reporting a candidate profile for moderation review."""

    reason: str = Field(..., min_length=1)


class ReportProfileResponse(BaseModel):
    """Response returned after reporting a candidate profile."""

    message: str
    id: Union[UUID, str]


class CareerPostingResponse(BaseModel):
    """Open job posting details."""

    model_config = ConfigDict(from_attributes=True)

    id: Union[UUID, str]
    title: str
    department: str
    location: str
    description: str
    is_active: bool = True


class JobApplicantRequest(BaseModel):
    """Job application payload."""

    applicant_name: str = Field(..., min_length=1, max_length=255)
    applicant_email: EmailStr
    resume_url: str = Field(..., min_length=1)


class BlogCommentItemDTO(BaseModel):
    id: str
    author_name: str
    author_username: str
    content: str
    created_at: str


class BlogPostCreateRequest(BaseModel):
    title: Optional[str] = ""
    excerpt: Optional[str] = ""
    content: List[str] = Field(default_factory=list)
    post_type: str = "USER_STATUS"
    tags: List[str] = Field(default_factory=list)
    ats_score_badge: Optional[int] = None
    category: str = "Community Feed"


class BlogCommentCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class BlogPostResponse(BaseModel):
    """CMS editorial blog article and community social feed post response."""

    id: Optional[str] = None
    slug: str
    title: str
    excerpt: str
    date: str
    image: str = "/images/blog/blog-1.jpg"
    author: str
    author_username: str = "belooga_editorial"
    author_headline: str = "Verified Member @ Belooga Talent Network"
    author_avatar: str = "/images/avatar.jpg"
    post_type: str = "EDITORIAL"
    category: str = "Career Insights"
    tags: List[str] = Field(default_factory=list)
    ats_score_badge: Optional[int] = None
    read_time_minutes: int = 4
    likes_count: int = 12
    comments_count: int = 0
    is_liked_by_me: bool = False
    comments: List[BlogCommentItemDTO] = Field(default_factory=list)
    content: List[str] = Field(default_factory=list)
    key_takeaways: List[str] = Field(default_factory=list)
