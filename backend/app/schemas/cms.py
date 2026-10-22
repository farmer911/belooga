from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactInquiryRequest(BaseModel):
    """Payload for submitting a public contact inquiry."""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    message: str = Field(..., min_length=1)


class ContactInquiryResponse(BaseModel):
    """Response returned after submitting contact inquiry or career application."""

    message: str
    id: Union[UUID, str]
    tracker_synced: bool = False
    tracker_item_id: Optional[str] = None


class ReportProfileRequest(BaseModel):
    """Payload for reporting a candidate profile for moderation review."""

    reason: str = Field(..., min_length=1)


class ReportProfileResponse(BaseModel):
    """Response returned after reporting a candidate profile."""

    message: str
    id: Union[UUID, str]


class CareerPostingCreateRequest(BaseModel):
    """Payload for creating a multi-company career posting."""

    company_name: str = Field(default="Belooga", min_length=1, max_length=255)
    company_logo_url: Optional[str] = None
    company_website: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    department: str = Field(default="Engineering", max_length=100)
    location: str = Field(default="Remote", max_length=100)
    salary_range: Optional[str] = "Negotiable"
    skills: List[str] = Field(default_factory=list)
    skills_required: List[str] = Field(default_factory=list)
    description: Optional[str] = ""
    job_description: Optional[str] = ""
    is_partner: bool = True
    is_system_role: bool = False


class CareerPostingResponse(BaseModel):
    """Open multi-company job posting details."""

    model_config = ConfigDict(from_attributes=True)

    id: Union[UUID, str]
    title: str
    company_name: str = "Belooga"
    company_logo_url: Optional[str] = None
    company_website: Optional[str] = None
    department: str
    location: str
    salary_range: Optional[str] = "Negotiable"
    skills: List[str] = Field(default_factory=list)
    skills_required: List[str] = Field(default_factory=list)
    is_partner: bool = False
    is_system_role: bool = True
    posted_by_identity_id: Optional[str] = None
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
    author_username: str = "alexnguyen"
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


class UserPostCommentDTO(BaseModel):
    """Comment item on a user profile post (BEL-187)."""

    id: str
    author_name: str
    content: str
    created_at: str


class UserPostCreateRequest(BaseModel):
    """Payload to create a user post or technical article on profile/feed (BEL-187)."""

    title: str = Field(default="Chia sẻ chuyên môn từ Belooga Workspace", max_length=300)
    category: str = Field(default="Chia sẻ kiến thức", max_length=120)
    body: str = Field(default="", max_length=10000)
    tags: List[str] = Field(default_factory=list)
    attachment_link: Optional[str] = None


class UserPostUpdateRequest(BaseModel):
    """Payload to update a user post (BEL-187)."""

    title: Optional[str] = Field(default=None, max_length=300)
    category: Optional[str] = Field(default=None, max_length=120)
    body: Optional[str] = Field(default=None, max_length=10000)
    tags: Optional[List[str]] = None
    attachment_link: Optional[str] = None


class UserPostItemDTO(BaseModel):
    """User post item returned by /v1/posts/* (BEL-187)."""

    id: str
    username: str
    author_name: str
    title: str
    category: str = "Chia sẻ kiến thức"
    body: str
    tags: List[str] = Field(default_factory=list)
    attachment_link: Optional[str] = None
    likes_count: int = 1
    comments: List[UserPostCommentDTO] = Field(default_factory=list)
    created_at: str = "Vừa xong"

