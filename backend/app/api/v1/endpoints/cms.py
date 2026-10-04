"""Public CMS, FAQs, and moderation reporting endpoints (Thin Controller)."""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.cms import ContactInquiryRequest, ReportProfileRequest
from app.services.cms_service import CmsService

router = APIRouter()


@router.post("/contact/", status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    db: AsyncSession = Depends(get_db),
):
    service = CmsService(db)
    return await service.submit_contact_inquiry(payload)


@router.get("/faqs", tags=["Domain 8: Public CMS & Moderation"])
async def get_faqs():
    service = CmsService(None)  # type: ignore[arg-type]
    return await service.get_faqs()


@router.get("/career/jobs/", tags=["Domain 8: Public CMS & Moderation"])
async def list_career_jobs(db: AsyncSession = Depends(get_db)):
    service = CmsService(db)
    return await service.list_career_jobs()


@router.post("/profile/{user_id}/report/", tags=["Domain 8: Public CMS & Moderation"])
async def report_candidate_profile(
    user_id: uuid.UUID,
    payload: ReportProfileRequest,
    db: AsyncSession = Depends(get_db),
):
    service = CmsService(db)
    return await service.report_candidate_profile(user_id, payload)
