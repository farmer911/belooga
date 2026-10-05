"""SQLAlchemy 2.0 Async ORM Models for Domain 9: Expert CV Review & Monetization."""

import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Text, Integer, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ExpertProfile(Base, TimestampMixin):
    __tablename__ = "expert_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    identity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete="SET NULL"), nullable=True
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    role_category: Mapped[str] = mapped_column(String(100), nullable=False)
    years_of_experience: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), default=5.0, nullable=False)
    total_reviews_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    turn_around_days: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    orders: Mapped[List["CVReviewOrder"]] = relationship("CVReviewOrder", back_populates="expert")
    feedbacks: Mapped[List["CVReviewFeedback"]] = relationship("CVReviewFeedback", back_populates="expert")


class CVReviewPackage(Base, TimestampMixin):
    __tablename__ = "cv_review_packages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    features: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    turn_around_hours: Mapped[int] = mapped_column(Integer, default=48, nullable=False)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    orders: Mapped[List["CVReviewOrder"]] = relationship("CVReviewOrder", back_populates="package")


class CVReviewOrder(Base, TimestampMixin):
    __tablename__ = "cv_review_orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_identity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete="CASCADE"), nullable=False
    )
    expert_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expert_profiles.id", ondelete="SET NULL"), nullable=True
    )
    package_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cv_review_packages.id", ondelete="RESTRICT"), nullable=False
    )
    resume_url: Mapped[str] = mapped_column(String(512), nullable=False)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    target_companies: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    candidate_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_status: Mapped[str] = mapped_column(String(50), default="pending_payment", nullable=False)
    amount_paid_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    payment_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    expert: Mapped[Optional["ExpertProfile"]] = relationship("ExpertProfile", back_populates="orders")
    package: Mapped["CVReviewPackage"] = relationship("CVReviewPackage", back_populates="orders")
    feedback: Mapped[Optional["CVReviewFeedback"]] = relationship(
        "CVReviewFeedback", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )


class CVReviewFeedback(Base, TimestampMixin):
    __tablename__ = "cv_review_feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cv_review_orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    expert_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expert_profiles.id", ondelete="CASCADE"), nullable=False
    )
    score_overall: Mapped[int] = mapped_column(Integer, nullable=False)
    score_ats_compatibility: Mapped[int] = mapped_column(Integer, nullable=False)
    score_impact_action_verbs: Mapped[int] = mapped_column(Integer, nullable=False)
    score_structure_formatting: Mapped[int] = mapped_column(Integer, nullable=False)
    summary_verdict: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    improvements: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    annotated_cv_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    video_feedback_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)

    # Relationships
    order: Mapped["CVReviewOrder"] = relationship("CVReviewOrder", back_populates="feedback")
    expert: Mapped["ExpertProfile"] = relationship("ExpertProfile", back_populates="feedbacks")
