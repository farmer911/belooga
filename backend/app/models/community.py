"""SQLAlchemy 2.0 ORM Models for tables split out of contact_inquiries (Alembic 0009).

Recruiter pipeline, reverse bids, CV roasts, salary crawl runs, company directory,
career posting metadata, blog/user posts, expert applications and career goals.
Repositories query these tables with raw SQL; the models keep Base.metadata and
Alembic in sync with backend/initdb.sql.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))


def _identity_fk(ondelete: str, nullable: bool = True, primary_key: bool = False) -> Mapped[Any]:
    return mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete=ondelete), nullable=nullable, primary_key=primary_key
    )


def _created_at() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


def _text_array() -> Mapped[list[str]]:
    return mapped_column(ARRAY(Text), nullable=False, server_default=text("'{}'"))


class RecruiterPipelineItem(Base):
    __tablename__ = "recruiter_pipeline_items"

    id: Mapped[uuid.UUID] = _uuid_pk()
    recruiter_identity_id: Mapped[uuid.UUID] = _identity_fk("CASCADE", nullable=False)
    candidate_username: Mapped[str] = mapped_column(String(100), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    target_role: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    stage: Mapped[str] = mapped_column(String(32), nullable=False, server_default="SHORTLISTED")
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    years_experience: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    expected_salary: Mapped[str] = mapped_column(String(100), nullable=False, server_default="")
    video_pitch_url: Mapped[str] = mapped_column(String(512), nullable=False, server_default="")
    matched_skills: Mapped[list[str]] = _text_array()
    missing_skills: Mapped[list[str]] = _text_array()
    recruiter_rating: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="4")
    evaluation_notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    contact_unlocked: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    interview_datetime: Mapped[Optional[str]] = mapped_column(String(64))
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _created_at()


class ReverseBid(Base):
    __tablename__ = "reverse_bids"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recruiter_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("CASCADE")
    candidate_username: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    salary_usd: Mapped[int] = mapped_column(Integer, nullable=False)
    pitch_note: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="SENT")
    created_at: Mapped[datetime] = _created_at()


class CvRoast(Base):
    __tablename__ = "cv_roasts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    author_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    alias: Mapped[str] = mapped_column(String(120), nullable=False)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    ai_roast: Mapped[str] = mapped_column(Text, nullable=False)
    votes: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = _created_at()


class CvRoastVote(Base):
    __tablename__ = "cv_roast_votes"

    roast_id: Mapped[str] = mapped_column(String(64), ForeignKey("cv_roasts.id", ondelete="CASCADE"), primary_key=True)
    identity_id: Mapped[uuid.UUID] = _identity_fk("CASCADE", nullable=False, primary_key=True)
    created_at: Mapped[datetime] = _created_at()


class SalaryCrawlRun(Base):
    __tablename__ = "salary_crawl_runs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    triggered_by_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    bonus_samples: Mapped[int] = mapped_column(Integer, nullable=False)
    career_postings_scanned: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    crawled_at: Mapped[datetime] = _created_at()


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id: Mapped[uuid.UUID] = _uuid_pk()
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    owner_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str] = mapped_column(String(120), nullable=False, server_default="")
    company_size: Mapped[str] = mapped_column(String(120), nullable=False, server_default="")
    location: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    website: Mapped[str] = mapped_column(String(512), nullable=False, server_default="")
    avg_rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False, server_default="0")
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    avg_salary_usd: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    open_jobs_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    hiring_now: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("TRUE"))
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    tech_stack: Mapped[list[str]] = _text_array()
    benefits: Mapped[list[str]] = _text_array()
    open_jobs: Mapped[Any] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    alumni: Mapped[Any] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _created_at()


class CompanyReview(Base):
    __tablename__ = "company_reviews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=False
    )
    author_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    author_role: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    created_at: Mapped[datetime] = _created_at()


class CompanyInterviewQuestion(Base):
    __tablename__ = "company_interview_questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=False
    )
    author_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    role_title: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False, server_default="Hard")
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    sample_answer_hint: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    created_at: Mapped[datetime] = _created_at()


class CareerPostingMeta(Base):
    __tablename__ = "career_posting_meta"

    career_posting_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("career_postings.id", ondelete="CASCADE"), primary_key=True
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, server_default="Belooga")
    company_logo_url: Mapped[Optional[str]] = mapped_column(Text)
    company_website: Mapped[Optional[str]] = mapped_column(Text)
    salary_range: Mapped[str] = mapped_column(String(100), nullable=False, server_default="Negotiable")
    skills: Mapped[list[str]] = _text_array()
    is_partner: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    is_system_role: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    posted_by_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    author_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    author_username: Mapped[str] = mapped_column(String(100), nullable=False)
    author_headline: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    author_avatar: Mapped[str] = mapped_column(String(512), nullable=False, server_default="/images/avatar.jpg")
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    date_label: Mapped[str] = mapped_column(String(64), nullable=False, server_default="")
    image: Mapped[str] = mapped_column(String(512), nullable=False, server_default="/images/blog/blog-1.jpg")
    post_type: Mapped[str] = mapped_column(String(16), nullable=False, server_default="USER_STATUS")
    category: Mapped[str] = mapped_column(String(120), nullable=False, server_default="Community Feed")
    tags: Mapped[list[str]] = _text_array()
    ats_score_badge: Mapped[Optional[int]] = mapped_column(Integer)
    read_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default="2")
    likes_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    content: Mapped[list[str]] = _text_array()
    key_takeaways: Mapped[list[str]] = _text_array()
    created_at: Mapped[datetime] = _created_at()


class BlogPostLike(Base):
    __tablename__ = "blog_post_likes"

    post_id: Mapped[str] = mapped_column(String(64), ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True)
    identity_id: Mapped[uuid.UUID] = _identity_fk("CASCADE", nullable=False, primary_key=True)
    created_at: Mapped[datetime] = _created_at()


class BlogPostComment(Base):
    __tablename__ = "blog_post_comments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    post_id: Mapped[str] = mapped_column(String(64), ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    author_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    author_username: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = _created_at()


class UserPost(Base):
    __tablename__ = "user_posts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    author_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("CASCADE")
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False, server_default="Chia sẻ kiến thức")
    body: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list[str]] = _text_array()
    attachment_link: Mapped[Optional[str]] = mapped_column(Text)
    likes_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = _created_at()


class UserPostLike(Base):
    __tablename__ = "user_post_likes"

    post_id: Mapped[str] = mapped_column(String(64), ForeignKey("user_posts.id", ondelete="CASCADE"), primary_key=True)
    identity_id: Mapped[uuid.UUID] = _identity_fk("CASCADE", nullable=False, primary_key=True)
    created_at: Mapped[datetime] = _created_at()


class UserPostComment(Base):
    __tablename__ = "user_post_comments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    post_id: Mapped[str] = mapped_column(String(64), ForeignKey("user_posts.id", ondelete="CASCADE"), nullable=False)
    author_identity_id: Mapped[Optional[uuid.UUID]] = _identity_fk("SET NULL")
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = _created_at()


class ExpertApplication(Base):
    __tablename__ = "expert_applications"

    identity_id: Mapped[uuid.UUID] = _identity_fk("CASCADE", nullable=False, primary_key=True)
    expert_profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expert_profiles.id", ondelete="SET NULL")
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    years_experience: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    category: Mapped[str] = mapped_column(String(64), nullable=False, server_default="backend")
    specialties: Mapped[list[str]] = _text_array()
    turnaround_hours: Mapped[int] = mapped_column(Integer, nullable=False, server_default="24")
    hourly_rate_vnd: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    linkedin_url: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    bio: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _created_at()


class CareerGoal(Base):
    __tablename__ = "career_goals"

    identity_id: Mapped[uuid.UUID] = _identity_fk("CASCADE", nullable=False, primary_key=True)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    target_salary: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_skills: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    location: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    updated_at: Mapped[datetime] = _created_at()
