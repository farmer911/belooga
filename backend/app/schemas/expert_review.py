"""Pydantic v2 DTO Schemas for Domain 9: Expert CV Review & Monetization."""

import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ExpertProfileResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    headline: str
    bio: str
    avatar_url: Optional[str] = None
    company: str
    role_category: str
    years_of_experience: int
    rating: float
    total_reviews_count: int
    turn_around_days: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CVReviewPackageResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str
    price_cents: int
    features: List[str] = Field(default_factory=list)
    turn_around_hours: int
    is_popular: bool

    model_config = ConfigDict(from_attributes=True)


class CVReviewOrderCreateRequest(BaseModel):
    package_slug: str
    expert_id: Optional[uuid.UUID] = None
    resume_url: str
    target_role: str
    target_companies: Optional[str] = None
    candidate_notes: Optional[str] = None


class OrderCheckoutRequest(BaseModel):
    payment_method: str = "card"
    coupon_code: Optional[str] = None


class CVReviewFeedbackResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    expert_name: Optional[str] = None
    score_overall: int
    score_ats_compatibility: int
    score_impact_action_verbs: int
    score_structure_formatting: int
    summary_verdict: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    annotated_cv_url: Optional[str] = None
    video_feedback_url: Optional[str] = None
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CVReviewOrderResponse(BaseModel):
    id: uuid.UUID
    package_name: str
    package_slug: str
    expert_name: Optional[str] = None
    resume_url: str
    target_role: str
    target_companies: Optional[str] = None
    candidate_notes: Optional[str] = None
    order_status: str
    amount_paid_cents: int
    payment_reference: Optional[str] = None
    created_at: datetime
    feedback: Optional[CVReviewFeedbackResponse] = None

    model_config = ConfigDict(from_attributes=True)
