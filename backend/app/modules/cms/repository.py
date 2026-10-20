"""Public CMS and moderation repository (Vertical Module: cms).

Data access layer for contact inquiries, moderation reports, career listings, and job applications.
"""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cms import CareerApplication, CareerPosting, ContactInquiry, ProfileReport
from app.models.profile import CandidateProfile


class CmsRepository:
    """Repository handling database operations for public CMS content and trust reports."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_contact_inquiry(self, name: str, email: str, message: str) -> uuid.UUID:
        inquiry_id = uuid.uuid4()
        inquiry = ContactInquiry(
            id=inquiry_id,
            name=name,
            email=email,
            message=message,
        )
        self.db.add(inquiry)
        await self.db.flush()
        return inquiry_id

    async def list_active_career_jobs(self) -> List[Dict[str, Any]]:
        query = text(
            "SELECT id, title, department, location, description FROM career_postings WHERE is_active = TRUE ORDER BY created_at ASC"
        )
        res = await self.db.execute(query)
        return [
            {
                "id": str(r.id),
                "title": r.title,
                "department": r.department,
                "location": r.location,
                "description": r.description,
            }
            for r in res.fetchall()
        ]

    async def seed_default_career_postings(self, defaults: List[Dict[str, Any]]) -> None:
        for item in defaults:
            posting = CareerPosting(
                id=uuid.uuid4(),
                title=item["title"],
                department=item["department"],
                location=item["location"],
                description=item["description"],
                is_active=True,
            )
            self.db.add(posting)
        await self.db.flush()

    async def get_career_posting_by_id(self, job_id: uuid.UUID) -> Optional[CareerPosting]:
        stmt = select(CareerPosting).where(CareerPosting.id == job_id, CareerPosting.is_active.is_(True))
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_career_application(
        self, job_id: uuid.UUID, applicant_name: str, applicant_email: str, resume_url: str
    ) -> uuid.UUID:
        app_id = uuid.uuid4()
        app_row = CareerApplication(
            id=app_id,
            job_id=job_id,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
            resume_url=resume_url,
        )
        self.db.add(app_row)
        await self.db.flush()
        return app_id

    async def check_candidate_exists(self, profile_id: uuid.UUID) -> bool:
        stmt = select(CandidateProfile.id).where(CandidateProfile.id == profile_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none() is not None

    async def create_profile_report(
        self,
        reported_profile_id: uuid.UUID,
        reason: str,
        reporter_identity_id: Optional[uuid.UUID] = None,
    ) -> uuid.UUID:
        report_id = uuid.uuid4()
        report = ProfileReport(
            id=report_id,
            reported_profile_id=reported_profile_id,
            reporter_identity_id=reporter_identity_id,
            reason=reason,
        )
        self.db.add(report)
        await self.db.flush()
        return report_id

    async def list_public_usernames_for_seo(self, limit: int = 100) -> List[str]:
        stmt = (
            select(CandidateProfile.username)
            .where(CandidateProfile.is_hidden.is_(False))
            .order_by(CandidateProfile.created_at.desc())
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return [r[0] for r in res.fetchall() if r[0]]

