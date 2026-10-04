from typing import Optional, Union
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
