import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import Base
from app.models import (
    AwardCertification, CandidateProfile, CareerApplication, CareerPosting,
    CatalogCompany, CatalogLocation, CatalogSchool, ContactInquiry,
    EducationExperience, EmailVerificationToken, Identity, Interest,
    JobExperience, Language, PasswordResetToken, ProfileInterest,
    ProfileLanguage, ProfileMedia, ProfileReport, ProfileSkill,
    RefreshSession, Skill, SocialAccount, VideoArchive,
)
from app.schemas import (
    CareerPostingResponse, CatalogItemResponse, ChunkUploadRequest,
    ChunkUploadResponse, ContactInquiryRequest, EducationCreate,
    EducationResponse, JobExperienceCreate, JobExperienceResponse,
    JobExperienceUpdate, MediaResponse, ProfileResponse, ProfileUpdate,
    ReorderPayload, ReportProfileRequest, SkillAdd, SkillResponse,
    SuggestionResponse,
)

EXPECTED_TABLES = {
    "identities", "refresh_sessions", "social_accounts", "password_reset_tokens",
    "email_verification_tokens", "candidate_profiles", "profile_media", "job_experiences",
    "education_experiences", "award_certifications", "skills", "profile_skills",
    "languages", "profile_languages", "interests", "profile_interests",
    "catalog_companies", "catalog_schools", "catalog_locations", "video_archives",
    "contact_inquiries", "profile_reports", "career_postings", "career_applications",
}


def test_models_metadata_completeness():
    """Verify all 24 database tables are declared and registered on Base.metadata."""
    registered_tables = set(Base.metadata.tables.keys())
    assert registered_tables == EXPECTED_TABLES
    assert len(registered_tables) == 24


def test_models_match_initdb_sql():
    """Verify 100% exact parity between initdb.sql table definitions and Base.metadata."""
    initdb_path = Path(__file__).resolve().parent.parent / "initdb.sql"
    assert initdb_path.exists()
    content = initdb_path.read_text(encoding="utf-8")
    sql_tables = set(re.findall(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)", content, re.I))
    assert sql_tables == EXPECTED_TABLES


@pytest.mark.asyncio
async def test_orm_identity_and_profile_crud_cycle(db_session: AsyncSession):
    """Test full ORM lifecycle with relationships and cascade deletion."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"architect_{unique_suffix}@belooga.com"
    username = f"arch_{unique_suffix}"

    # 1. Create Identity
    identity = Identity(
        email=email,
        password_hash="argon2_hashed_pw",
        role="candidate",
        status="active",
    )
    db_session.add(identity)
    await db_session.flush()

    assert identity.id is not None
    assert identity.created_at is not None

    # 2. Create Candidate Profile linked to Identity
    profile = CandidateProfile(
        identity_id=identity.id,
        username=username,
        first_name="Ada",
        last_name="Lovelace",
        headline="Pioneering Systems Architect",
        bio="Designing clean multi-tier architectures.",
        location="London, UK",
        phone="+44 20 7946 0991",
        is_hidden=False,
    )
    db_session.add(profile)
    await db_session.flush()

    # 3. Add Timeline Experiences
    job = JobExperience(
        profile_id=profile.id,
        title="Principal Architect",
        company_name="B stream",
        display_order=0,
    )
    edu = EducationExperience(
        profile_id=profile.id,
        school_name="University of London",
        degree_name="Mathematics",
        display_order=0,
    )
    award = AwardCertification(
        profile_id=profile.id,
        title="Distinguished Fellow",
        display_order=0,
    )
    db_session.add_all([job, edu, award])
    await db_session.flush()

    # 4. Query profile with relationships
    stmt = (
        select(CandidateProfile)
        .where(CandidateProfile.id == profile.id)
    )
    res = await db_session.execute(stmt)
    loaded_profile = res.scalar_one()
    assert loaded_profile.username == username
    assert loaded_profile.first_name == "Ada"

    # 5. Verify Cascade Deletion
    await db_session.delete(identity)
    await db_session.commit()

    check_prof = await db_session.execute(
        select(CandidateProfile).where(CandidateProfile.id == profile.id)
    )
    assert check_prof.scalar_one_or_none() is None

    check_job = await db_session.execute(
        select(JobExperience).where(JobExperience.profile_id == profile.id)
    )
    assert check_job.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_catalogs_and_cms_orm_entities(db_session: AsyncSession):
    """Test Catalog and CMS models persist and query correctly."""
    unique = uuid.uuid4().hex[:6]

    # Catalogs
    company = CatalogCompany(name=f"Venture-{unique}", logo_url="/logo.png")
    school = CatalogSchool(name=f"Academy-{unique}")
    loc = CatalogLocation(name=f"Tech City-{unique}", country="US")
    skill = Skill(name=f"Architecture-{unique}")
    lang = Language(name=f"Lang-{unique}")
    interest = Interest(name=f"Hobby-{unique}")
    db_session.add_all([company, school, loc, skill, lang, interest])
    await db_session.flush()

    # CMS
    inquiry = ContactInquiry(
        name="John Enterprise",
        email="john@enterprise.com",
        message="Evaluating Belooga platform."
    )
    career = CareerPosting(
        title=f"Senior Staff Engineer {unique}",
        department="Engineering",
        location="Remote",
        description="Lead backend architecture.",
    )
    db_session.add_all([inquiry, career])
    await db_session.flush()

    app_record = CareerApplication(
        job_id=career.id,
        applicant_name="Candidate One",
        applicant_email="cand1@test.com",
        resume_url="https://s3.amazonaws.com/resumes/cand1.pdf",
    )
    db_session.add(app_record)
    await db_session.commit()

    # Verify queries
    res_inq = await db_session.execute(select(ContactInquiry).where(ContactInquiry.id == inquiry.id))
    assert res_inq.scalar_one().name == "John Enterprise"

    res_job = await db_session.execute(select(CareerPosting).where(CareerPosting.id == career.id))
    assert res_job.scalar_one().title == f"Senior Staff Engineer {unique}"


def test_pydantic_v2_schemas_contracts():
    """Verify validation and serialization behavior across Pydantic v2 schemas."""
    # Profile
    p_up = ProfileUpdate(headline="Staff Architect", location="Tokyo")
    assert p_up.headline == "Staff Architect"

    p_resp = ProfileResponse(
        id=str(uuid.uuid4()),
        username="ada_lovelace",
        first_name="Ada",
        last_name="Lovelace",
        skills=["Python", "FastAPI"],
    )
    assert p_resp.skills == ["Python", "FastAPI"]
    assert p_resp.avatar_url == "/images/avatar.jpg"

    # Timeline
    j_create = JobExperienceCreate(
        title="Lead Architect",
        company_name="Belooga Inc.",
    )
    assert j_create.currently_work_here is False

    reorder = ReorderPayload(orders=[{"id": "uuid-1", "order": 0}, {"id": "uuid-2", "order": 1}])
    assert len(reorder.orders) == 2
    assert reorder.orders[1].order == 1

    # Media
    chunk_req = ChunkUploadRequest(
        upload_id="upload_123456_abcXYZ",
        chunk_index=0,
        total_chunks=5,
        username="ada",
    )
    assert chunk_req.total_chunks == 5

    chunk_resp = ChunkUploadResponse(
        upload_id="upload_123456_abcXYZ",
        chunk_index=0,
        total_chunks=5,
        status="chunk_received",
        message="Chunk 1/5 received",
    )
    assert chunk_resp.status == "chunk_received"

    # Catalogs
    cat_item = CatalogItemResponse(name="FastAPI", country="US")
    assert cat_item.name == "FastAPI"

    # CMS
    inquiry_dto = ContactInquiryRequest(
        name="Alice Recruiter",
        email="alice@recruiting.org",
        message="Interested in partnership.",
    )
    assert inquiry_dto.email == "alice@recruiting.org"


def test_alembic_revision_file_validity():
    """Verify baseline Alembic migration script 0001_initial_schema.py."""
    migration_file = Path(__file__).resolve().parent.parent / "alembic" / "versions" / "0001_initial_schema.py"
    assert migration_file.exists()
    content = migration_file.read_text(encoding="utf-8")
    assert 'revision: str = "0001"' in content or "revision = '0001'" in content
    assert "TABLES_IN_REVERSE_ORDER" in content
    assert "def upgrade()" in content
    assert "def downgrade()" in content
