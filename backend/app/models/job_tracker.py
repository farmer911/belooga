"""SQLAlchemy 2.0 Async ORM Models for Domain 11: Candidate Job Applications Tracker (Kanban)."""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class CandidateJobApplicationTracker(Base, TimestampMixin):
    __tablename__ = "candidate_job_applications_tracker"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_identity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete="CASCADE"), nullable=True
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    position_title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="TARGETING", nullable=False)
    expected_salary: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    match_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    interview_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
