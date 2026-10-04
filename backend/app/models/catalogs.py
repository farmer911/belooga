import uuid
from typing import List, Optional

from sqlalchemy import Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Skill(Base):
    """Standardized skills taxonomy."""

    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    __table_args__ = (
        Index(
            "idx_skills_name_trgm",
            "name",
            postgresql_using="gin",
            postgresql_ops={"name": "gin_trgm_ops"},
        ),
    )

    profile_skills: Mapped[List["ProfileSkill"]] = relationship(
        "ProfileSkill", back_populates="skill", cascade="all, delete-orphan"
    )
    profiles: Mapped[List["CandidateProfile"]] = relationship(
        "CandidateProfile", secondary="profile_skills", back_populates="skills", viewonly=True
    )


class CatalogCompany(Base):
    """Verified companies dictionary with logos."""

    __tablename__ = "catalog_companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index(
            "idx_companies_trgm",
            "name",
            postgresql_using="gin",
            postgresql_ops={"name": "gin_trgm_ops"},
        ),
    )


class CatalogSchool(Base):
    """Verified schools and universities directory."""

    __tablename__ = "catalog_schools"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index(
            "idx_schools_trgm",
            "name",
            postgresql_using="gin",
            postgresql_ops={"name": "gin_trgm_ops"},
        ),
    )


class CatalogLocation(Base):
    """Pre-populated geographic cities and regions."""

    __tablename__ = "catalog_locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False)


class Language(Base):
    """Standardized spoken and written languages."""

    __tablename__ = "languages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    profile_languages: Mapped[List["ProfileLanguage"]] = relationship(
        "ProfileLanguage", back_populates="language", cascade="all, delete-orphan"
    )


class Interest(Base):
    """Personal hobbies and professional interests."""

    __tablename__ = "interests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    profile_interests: Mapped[List["ProfileInterest"]] = relationship(
        "ProfileInterest", back_populates="interest", cascade="all, delete-orphan"
    )
