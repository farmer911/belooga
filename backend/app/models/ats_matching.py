"""SQLAlchemy 2.0 Async ORM Models for Domain 10: ATS Diagnostics & JD Matching Engine."""

import uuid
from typing import List, Optional
from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class JobDescription(Base, TimestampMixin):
    __tablename__ = "job_descriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    skills_extracted: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    # Relationships
    matches: Mapped[List["ResumeJDMatch"]] = relationship("ResumeJDMatch", back_populates="job_description")


class ResumeJDMatch(Base, TimestampMixin):
    __tablename__ = "resume_jd_matches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_identity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete="CASCADE"), nullable=True
    )
    job_description_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False
    )
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False)
    matched_skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    missing_skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    star_analysis: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    parse_warnings: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    # Relationships
    job_description: Mapped["JobDescription"] = relationship("JobDescription", back_populates="matches")
