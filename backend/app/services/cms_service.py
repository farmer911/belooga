"""Public CMS and trust service.

Business domain service handling contact inquiries, FAQ knowledge retrieval,
career listings, and trust & safety candidate profile moderation reports.
"""

from typing import Any, Dict, List
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.cms_repo import CmsRepository
from app.schemas.cms import ContactInquiryRequest, ReportProfileRequest

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

    def __init__(self, db: AsyncSession):
        self.db = db
        self.cms_repo = CmsRepository(db)

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
        jobs = await self.cms_repo.list_active_career_jobs()
        return jobs if jobs else DEFAULT_CAREER_JOBS

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
