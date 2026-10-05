"""Pydantic v2 DTO Schemas for Domain 11: Candidate Job Applications Tracker (Kanban)."""

import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TrackedJobCreateRequest(BaseModel):
    company_name: str = Field(..., max_length=255)
    position_title: str = Field(..., max_length=255)
    status: str = Field("TARGETING", description="TARGETING | TAILORED | APPLIED | INTERVIEW | OFFER")
    expected_salary: Optional[str] = Field(None, max_length=100)
    match_score: int = Field(0, ge=0, le=100)
    interview_date: Optional[datetime] = None
    notes: Optional[str] = None


class TrackedJobStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="TARGETING | TAILORED | APPLIED | INTERVIEW | OFFER")


class TrackedJobResponse(BaseModel):
    id: uuid.UUID
    candidate_identity_id: Optional[uuid.UUID] = None
    company_name: str
    position_title: str
    status: str
    expected_salary: Optional[str] = None
    match_score: int
    interview_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
