from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class JobExperienceCreate(BaseModel):
    """Payload for creating a new work history entry."""

    title: str = Field(..., min_length=1, max_length=255)
    company_name: str = Field(..., min_length=1, max_length=255)
    company_id: Optional[UUID] = None
    from_date_month: Optional[int] = Field(1, ge=1, le=12)
    from_date_year: Optional[int] = Field(2022, ge=1900, le=2100)
    currently_work_here: bool = False
    to_date_month: Optional[int] = Field(None, ge=1, le=12)
    to_date_year: Optional[int] = Field(None, ge=1900, le=2100)
    description: Optional[str] = ""
    logo_url: Optional[str] = "/images/logo.svg"


class JobExperienceUpdate(BaseModel):
    """Payload for updating an existing work history entry."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    company_id: Optional[UUID] = None
    from_date_month: Optional[int] = Field(None, ge=1, le=12)
    from_date_year: Optional[int] = Field(None, ge=1900, le=2100)
    currently_work_here: Optional[bool] = None
    to_date_month: Optional[int] = Field(None, ge=1, le=12)
    to_date_year: Optional[int] = Field(None, ge=1900, le=2100)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    display_order: Optional[int] = None


class JobExperienceResponse(BaseModel):
    """Serialized work experience model."""

    model_config = ConfigDict(from_attributes=True)

    id: Union[UUID, str]
    title: str
    company_name: str
    company_id: Optional[UUID] = None
    from_date_month: Optional[int] = None
    from_date_year: Optional[int] = None
    currently_work_here: bool = False
    to_date_month: Optional[int] = None
    to_date_year: Optional[int] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    display_order: int = 0


class EducationCreate(BaseModel):
    """Payload for creating an academic credential entry."""

    school_name: str = Field(..., min_length=1, max_length=255)
    degree_name: str = Field(..., min_length=1, max_length=255)
    school_id: Optional[UUID] = None
    gpa: Optional[str] = "3.8"
    from_date_month: Optional[int] = Field(9, ge=1, le=12)
    from_date_year: Optional[int] = Field(2018, ge=1900, le=2100)
    currently_work_here: bool = False
    to_date_month: Optional[int] = Field(6, ge=1, le=12)
    to_date_year: Optional[int] = Field(2022, ge=1900, le=2100)
    description: Optional[str] = ""
    logo_url: Optional[str] = None


class EducationUpdate(BaseModel):
    """Payload for updating an existing academic credential entry."""

    school_name: Optional[str] = Field(None, min_length=1, max_length=255)
    degree_name: Optional[str] = Field(None, min_length=1, max_length=255)
    gpa: Optional[str] = None
    from_date_month: Optional[int] = Field(None, ge=1, le=12)
    from_date_year: Optional[int] = Field(None, ge=1900, le=2100)
    currently_work_here: Optional[bool] = None
    to_date_month: Optional[int] = Field(None, ge=1, le=12)
    to_date_year: Optional[int] = Field(None, ge=1900, le=2100)
    description: Optional[str] = None


# Backward-compatible alias
EducationExperienceCreate = EducationCreate


class EducationResponse(BaseModel):
    """Serialized education experience model."""

    model_config = ConfigDict(from_attributes=True)

    id: Union[UUID, str]
    school_name: str
    degree_name: Optional[str] = None
    school_id: Optional[UUID] = None
    gpa: Optional[str] = None
    from_date_month: Optional[int] = None
    from_date_year: Optional[int] = None
    currently_work_here: bool = False
    to_date_month: Optional[int] = None
    to_date_year: Optional[int] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    display_order: int = 0


class AwardCertificationCreate(BaseModel):
    """Payload for creating an award or certificate."""

    title: str = Field(..., min_length=1, max_length=255)
    location_name: Optional[str] = "Global"
    issuer: Optional[str] = None
    from_date_month: Optional[int] = Field(1, ge=1, le=12)
    from_date_year: Optional[int] = Field(2023, ge=1900, le=2100)
    issued_year: Optional[int] = Field(None, ge=1900, le=2100)
    currently_work_here: bool = False
    to_date_month: Optional[int] = None
    to_date_year: Optional[int] = None
    description: Optional[str] = ""
    logo_url: Optional[str] = None


class AwardUpdate(BaseModel):
    """Payload for updating an existing award or certificate."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    location_name: Optional[str] = Field(None, max_length=255)
    issuer: Optional[str] = Field(None, max_length=255)
    from_date_month: Optional[int] = Field(None, ge=1, le=12)
    from_date_year: Optional[int] = Field(None, ge=1900, le=2100)
    issued_year: Optional[int] = Field(None, ge=1900, le=2100)
    currently_work_here: Optional[bool] = None
    to_date_month: Optional[int] = Field(None, ge=1, le=12)
    to_date_year: Optional[int] = Field(None, ge=1900, le=2100)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    display_order: Optional[int] = None


class AwardCertificationResponse(BaseModel):
    """Serialized award certification model."""

    model_config = ConfigDict(from_attributes=True)

    id: Union[UUID, str]
    title: str = ""
    location_name: Optional[str] = None
    from_date_month: Optional[int] = None
    from_date_year: Optional[int] = None
    currently_work_here: bool = False
    to_date_month: Optional[int] = None
    to_date_year: Optional[int] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    display_order: int = 0
    message: Optional[str] = None


AwardResponse = AwardCertificationResponse


class MessageResponse(BaseModel):
    """Standard timeline mutation confirmation response."""

    id: Optional[Union[UUID, str]] = None
    message: str


class ReorderItem(BaseModel):
    """Individual item for timeline reordering."""

    id: Union[UUID, str]
    order: Optional[int] = None
    display_order: Optional[int] = None

    @property
    def resolved_order(self) -> int:
        if self.order is not None:
            return self.order
        return self.display_order if self.display_order is not None else 0


class ReorderPayload(BaseModel):
    """Batch reordering payload with sequence of items."""

    orders: List[Union[ReorderItem, UUID, str]] = Field(default_factory=list)
    items: Optional[List[Union[ReorderItem, UUID, str]]] = None
    award_ids: Optional[List[Union[UUID, str]]] = None


# Backward-compatible aliases
ReorderRequest = ReorderPayload
AwardOrderList = ReorderPayload


class CareerTrajectoryResponse(BaseModel):
    username: str
    current_inferred_level: str
    next_target_level: str
    promotion_readiness_pct: int
    total_experience_entries: int
    estimated_tenure_years: float
    trajectory_velocity: str
    key_promotion_gaps: List[str]
