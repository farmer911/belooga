from typing import Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ChunkUploadRequest(BaseModel):
    """Parameters for chunked upload verification."""

    upload_id: str = Field(..., pattern=r"^upload_\d+_[a-zA-Z0-9]+$")
    chunk_index: int = Field(..., ge=0)
    total_chunks: int = Field(..., ge=1)
    username: str = Field(..., min_length=1)


class ChunkUploadResponse(BaseModel):
    """Acknowledgement of an individual uploaded chunk."""

    upload_id: str
    chunk_index: int
    total_chunks: int
    status: str = "chunk_received"
    message: str


class CompleteUploadRequest(BaseModel):
    """Request to assemble chunks into final video or asset."""

    upload_id: str
    total_chunks: int = Field(..., ge=1)
    username: str = Field(..., min_length=1)
    filename: Optional[str] = "pitch.webm"


class MediaResponse(BaseModel):
    """Metadata of an uploaded or processed media file."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[Union[UUID, str]] = None
    category: Optional[str] = None
    file_url: Optional[str] = None
    url: Optional[str] = None
    avatar_url: Optional[str] = None
    resume_url: Optional[str] = None
    video_url: Optional[str] = None
    poster_url: Optional[str] = None
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    message: Optional[str] = None


class CVStudioExperienceItem(BaseModel):
    company: str
    role: str
    period: str
    bullets: list[str] = Field(default_factory=list)


class CVStudioEducationItem(BaseModel):
    institution: str
    degree: str = ""
    field_of_study: str = ""
    period: str = ""


class CVStudioDraftPayload(BaseModel):
    full_name: str
    email: str = ""
    phone: str = ""
    headline: str
    summary: str = ""
    skills: str = ""
    font_size: float = 10.0
    line_height: float = 1.3
    margin_size: float = 0.6
    snap_one_page: bool = True
    experience: list[CVStudioExperienceItem] = Field(default_factory=list)
    education: list[CVStudioEducationItem] = Field(default_factory=list)
    cv_text: str = ""


