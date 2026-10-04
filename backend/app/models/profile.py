import uuid
from typing import Any, List, Optional

from sqlalchemy import Boolean, Computed, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class CandidateProfile(Base, TimestampMixin):
    """Core candidate profile record including search tsvector and showcase attributes."""

    __tablename__ = "candidate_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    identity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("identities.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    headline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    employment_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    seeking_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_pitch_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resume_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_hidden: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("FALSE"), nullable=False
    )
    is_fresh: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("TRUE"), nullable=False
    )
    submitted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("FALSE"), nullable=False
    )
    search_vector: Mapped[Optional[Any]] = mapped_column(
        TSVECTOR,
        Computed(
            "setweight(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') || "
            "setweight(to_tsvector('english', coalesce(headline, '')), 'B') || "
            "setweight(to_tsvector('english', coalesce(bio, '')), 'C') || "
            "setweight(to_tsvector('english', coalesce(location, '')), 'D')",
            persisted=True,
        ),
        nullable=True,
    )

    __table_args__ = (
        Index("idx_candidate_profiles_username", "username"),
        Index("idx_candidate_profiles_search_vector", "search_vector", postgresql_using="gin"),
    )

    # Relationships
    identity: Mapped["Identity"] = relationship("Identity", back_populates="profile")
    media: Mapped[List["ProfileMedia"]] = relationship(
        "ProfileMedia", back_populates="profile", cascade="all, delete-orphan"
    )
    job_experiences: Mapped[List["JobExperience"]] = relationship(
        "JobExperience",
        back_populates="profile",
        cascade="all, delete-orphan",
        order_by="JobExperience.display_order",
    )
    education_experiences: Mapped[List["EducationExperience"]] = relationship(
        "EducationExperience",
        back_populates="profile",
        cascade="all, delete-orphan",
        order_by="EducationExperience.display_order",
    )
    award_certifications: Mapped[List["AwardCertification"]] = relationship(
        "AwardCertification",
        back_populates="profile",
        cascade="all, delete-orphan",
        order_by="AwardCertification.display_order",
    )
    profile_skills: Mapped[List["ProfileSkill"]] = relationship(
        "ProfileSkill", back_populates="profile", cascade="all, delete-orphan"
    )
    skills: Mapped[List["Skill"]] = relationship(
        "Skill", secondary="profile_skills", back_populates="profiles", viewonly=True
    )
    profile_languages: Mapped[List["ProfileLanguage"]] = relationship(
        "ProfileLanguage", back_populates="profile", cascade="all, delete-orphan"
    )
    profile_interests: Mapped[List["ProfileInterest"]] = relationship(
        "ProfileInterest", back_populates="profile", cascade="all, delete-orphan"
    )
    video_archives: Mapped[List["VideoArchive"]] = relationship(
        "VideoArchive", back_populates="profile", cascade="all, delete-orphan"
    )
    profile_reports: Mapped[List["ProfileReport"]] = relationship(
        "ProfileReport", back_populates="profile", cascade="all, delete-orphan"
    )


class ProfileSkill(Base):
    """Many-to-many junction between CandidateProfile and Skill."""

    __tablename__ = "profile_skills"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="profile_skills"
    )
    skill: Mapped["Skill"] = relationship("Skill", back_populates="profile_skills")


class ProfileLanguage(Base):
    """Many-to-many junction between CandidateProfile and Language."""

    __tablename__ = "profile_languages"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    language_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("languages.id", ondelete="CASCADE"),
        primary_key=True,
    )
    proficiency: Mapped[Optional[str]] = mapped_column(
        String(50), default="Fluent", server_default=text("'Fluent'"), nullable=True
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="profile_languages"
    )
    language: Mapped["Language"] = relationship("Language", back_populates="profile_languages")


class ProfileInterest(Base):
    """Many-to-many junction between CandidateProfile and Interest."""

    __tablename__ = "profile_interests"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    interest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interests.id", ondelete="CASCADE"),
        primary_key=True,
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="profile_interests"
    )
    interest: Mapped["Interest"] = relationship("Interest", back_populates="profile_interests")
