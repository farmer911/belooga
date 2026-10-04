"""Public CMS and moderation repository.

Data access layer for contact inquiries, moderation reports, and career listings.
"""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cms import CareerPosting, ContactInquiry, ProfileReport
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
            "SELECT id, title, department, location, description FROM career_postings WHERE is_active = TRUE"
        )
        res = await self.db.execute(query)
        return [dict(r._mapping) for r in res.fetchall()]

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
