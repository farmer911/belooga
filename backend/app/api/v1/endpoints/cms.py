"""Public CMS, FAQs, and moderation reporting endpoints (Thin Controller)."""

from typing import Any, Dict, List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.cms import CmsService
from app.schemas.cms import (
    BlogPostResponse,
    ContactInquiryRequest,
    ContactInquiryResponse,
    JobApplicantRequest,
    ReportProfileRequest,
    ReportProfileResponse,
)

router = APIRouter()


@router.post("/contact/", response_model=ContactInquiryResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).submit_contact_inquiry(payload)


@router.get("/faqs", response_model=List[Dict[str, Any]], tags=["Domain 8: Public CMS & Moderation"])
async def get_faqs():
    return await CmsService().get_faqs()


@router.get("/blog/posts/", response_model=List[BlogPostResponse], tags=["Domain 8: Public CMS & Moderation"])
async def list_blog_posts(db: AsyncSession = Depends(get_db)):
    return await CmsService(db).list_blog_posts()


@router.get("/blog/posts/{slug}/", response_model=BlogPostResponse, tags=["Domain 8: Public CMS & Moderation"])
async def get_blog_post_detail(slug: str, db: AsyncSession = Depends(get_db)):
    return await CmsService(db).get_blog_post_by_slug(slug)


@router.get("/seo/sitemap-data", response_model=Dict[str, Any], tags=["Domain 8: Public CMS & Moderation"])
async def get_seo_sitemap_data(db: AsyncSession = Depends(get_db)):
    return await CmsService(db).get_seo_sitemap_data()


@router.get("/career/jobs/", response_model=List[Dict[str, Any]], tags=["Domain 8: Public CMS & Moderation"])
async def list_career_jobs(db: AsyncSession = Depends(get_db)):
    return await CmsService(db).list_career_jobs()


@router.post("/career/jobs/{job_id}/apply/", response_model=ContactInquiryResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def apply_career_job(
    job_id: str,
    payload: JobApplicantRequest,
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).apply_career_job(job_id, payload)



@router.post("/profile/{user_id}/report/", response_model=ReportProfileResponse, tags=["Domain 8: Public CMS & Moderation"])
async def report_candidate_profile(
    user_id: uuid.UUID,
    payload: ReportProfileRequest,
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).report_candidate_profile(user_id, payload)
