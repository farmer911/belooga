"""Public CMS and trust service (Vertical Module: cms).

Business domain service handling contact inquiries, FAQ knowledge retrieval,
career listings, job applications, and trust & safety candidate profile moderation reports.
"""

from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.cms.repository import CmsRepository
from app.schemas.cms import ContactInquiryRequest, JobApplicantRequest, ReportProfileRequest

STATIC_FAQS = [
    {
        "id": 1,
        "category": "Candidate Experience",
        "question": "What is the 30-second elevator pitch video?",
        "answer": "It is an authentic short video where you introduce yourself, highlight your primary superpowers, and articulate what kind of team you want to join.",
    },
    {
        "id": 2,
        "category": "Candidate Experience",
        "question": "Can I re-record my video elevator pitch?",
        "answer": "Yes! You can record or upload as many takes as you want inside your candidate workspace until you are 100% satisfied.",
    },
    {
        "id": 3,
        "category": "Privacy & Security",
        "question": "Who can view my candidate profile?",
        "answer": "You have full control. You can set your profile to Public for recruiters, or keep it Hidden while continuing to refine your credentials.",
    },
    {
        "id": 4,
        "category": "Recruiters",
        "question": "How do recruiters contact candidates?",
        "answer": "Recruiters can review video pitches, verify timelines, and contact candidates directly via their verified email or phone.",
    },
]

DEFAULT_CAREER_JOBS = [
    {
        "id": "c1",
        "title": "Staff Full-Stack Engineer",
        "department": "Engineering",
        "location": "Remote / San Francisco",
        "description": "Build high-throughput async services and sleek Next.js interfaces.",
    },
    {
        "id": "c2",
        "title": "Lead Product Designer",
        "department": "Design",
        "location": "San Francisco, CA",
        "description": "Craft intuitive candidate workspaces and seamless WebRTC video studios.",
    },
    {
        "id": "c3",
        "title": "Head of Talent Partnerships",
        "department": "Operations",
        "location": "New York, NY",
        "description": "Expand employer networks across top high-growth tech companies.",
    },
]


class CmsService:
    """Service layer managing public content and moderation reporting."""

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.cms_repo = CmsRepository(db) if db else None

    async def submit_contact_inquiry(self, payload: ContactInquiryRequest) -> Dict[str, str]:
        inquiry_id = await self.cms_repo.create_contact_inquiry(
            name=payload.name,
            email=payload.email,
            message=payload.message,
        )
        await self.db.commit()
        return {
            "message": "Thank you! Your inquiry has been received.",
            "id": str(inquiry_id),
        }

    async def get_faqs(self) -> List[Dict[str, Any]]:
        return STATIC_FAQS

    async def list_career_jobs(self) -> List[Dict[str, Any]]:
        async def _compute() -> List[Dict[str, Any]]:
            if not self.cms_repo:
                return DEFAULT_CAREER_JOBS
            jobs = await self.cms_repo.list_active_career_jobs()
            if not jobs:
                await self.cms_repo.seed_default_career_postings(DEFAULT_CAREER_JOBS)
                await self.db.commit()
                jobs = await self.cms_repo.list_active_career_jobs()
            return jobs if jobs else DEFAULT_CAREER_JOBS

        return await platform_cache.get_or_set("cms:career_jobs", 60, _compute)

    async def apply_career_job(self, job_id: str, payload: JobApplicantRequest) -> Dict[str, str]:
        jobs = await self.list_career_jobs()
        target_uuid: Optional[uuid.UUID] = None
        try:
            parsed_uuid = uuid.UUID(job_id)
            posting = await self.cms_repo.get_career_posting_by_id(parsed_uuid)
            if posting:
                target_uuid = posting.id
        except ValueError:
            if jobs:
                target_uuid = uuid.UUID(str(jobs[0]["id"]))

        if not target_uuid:
            raise HTTPException(status_code=404, detail="Career job posting not found")

        app_id = await self.cms_repo.create_career_application(
            job_id=target_uuid,
            applicant_name=payload.applicant_name.strip(),
            applicant_email=payload.applicant_email.lower().strip(),
            resume_url=payload.resume_url.strip(),
        )
        await self.db.commit()
        return {
            "message": "Application submitted successfully.",
            "id": str(app_id),
        }

    async def report_candidate_profile(
        self, user_id: uuid.UUID, payload: ReportProfileRequest
    ) -> Dict[str, str]:
        reason = payload.reason.strip()
        if not reason:
            raise HTTPException(status_code=400, detail="Report reason cannot be empty")

        exists = await self.cms_repo.check_candidate_exists(user_id)
        if not exists:
            raise HTTPException(status_code=404, detail="Candidate profile not found")

        report_id = await self.cms_repo.create_profile_report(
            reported_profile_id=user_id,
            reason=reason,
        )
        await self.db.commit()
        return {
            "message": "Candidate profile reported. Our trust and safety team will investigate.",
            "id": str(report_id),
        }
