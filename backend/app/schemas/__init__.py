"""Pydantic v2 Schemas for Belooga API DTOs.

Re-exports request and response schemas across all application domains.
"""

from app.schemas.auth import (
    CheckAvailabilityResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileDTO,
)
from app.schemas.catalogs import (
    CatalogItemResponse,
    SuggestionResponse,
)
from app.schemas.cms import (
    CareerPostingResponse,
    ContactInquiryRequest,
    ContactInquiryResponse,
    JobApplicantRequest,
    ReportProfileRequest,
    ReportProfileResponse,
)
from app.schemas.media import (
    ChunkUploadRequest,
    ChunkUploadResponse,
    CompleteUploadRequest,
    MediaResponse,
)
from app.schemas.profile import (
    ProfileLanguageItem,
    ProfileResponse,
    ProfileUpdate,
    SkillAdd,
    SkillResponse,
)
from app.schemas.timeline import (
    AwardCertificationCreate,
    AwardCertificationResponse,
    EducationCreate,
    EducationExperienceCreate,
    EducationResponse,
    JobExperienceCreate,
    JobExperienceResponse,
    JobExperienceUpdate,
    ReorderItem,
    ReorderPayload,
    ReorderRequest,
)

__all__ = [
    "CheckAvailabilityResponse",
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "UserProfileDTO",
    "ProfileUpdate",
    "SkillAdd",
    "SkillResponse",
    "ProfileLanguageItem",
    "ProfileResponse",
    "JobExperienceCreate",
    "JobExperienceUpdate",
    "JobExperienceResponse",
    "EducationCreate",
    "EducationExperienceCreate",
    "EducationResponse",
    "AwardCertificationCreate",
    "AwardCertificationResponse",
    "ReorderItem",
    "ReorderPayload",
    "ReorderRequest",
    "ChunkUploadRequest",
    "ChunkUploadResponse",
    "CompleteUploadRequest",
    "MediaResponse",
    "CatalogItemResponse",
    "SuggestionResponse",
    "ContactInquiryRequest",
    "ContactInquiryResponse",
    "ReportProfileRequest",
    "ReportProfileResponse",
    "CareerPostingResponse",
    "JobApplicantRequest",
]
