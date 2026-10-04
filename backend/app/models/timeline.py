import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class JobExperience(Base, TimestampMixin):
    """Candidate work history and career experience."""

    __tablename__ = "job_experiences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    from_date_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    from_date_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currently_work_here: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("FALSE"), nullable=False
    )
    to_date_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    to_date_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text("0"), nullable=False
    )

    __table_args__ = (
        Index("idx_job_exp_order", "profile_id", "display_order"),
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="job_experiences"
    )


class EducationExperience(Base, TimestampMixin):
    """Candidate degrees, universities, and academic credentials."""

    __tablename__ = "education_experiences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    school_name: Mapped[str] = mapped_column(String(255), nullable=False)
    school_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    degree_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gpa: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    from_date_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    from_date_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currently_work_here: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("FALSE"), nullable=False
    )
    to_date_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    to_date_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text("0"), nullable=False
    )

    __table_args__ = (
        Index("idx_edu_exp_order", "profile_id", "display_order"),
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="education_experiences"
    )


class AwardCertification(Base, TimestampMixin):
    """Candidate awards, honors, and professional certifications."""

    __tablename__ = "award_certifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    location_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    from_date_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    from_date_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currently_work_here: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("FALSE"), nullable=False
    )
    to_date_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    to_date_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text("0"), nullable=False
    )

    __table_args__ = (
        Index("idx_award_cert_order", "profile_id", "display_order"),
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="award_certifications"
    )
