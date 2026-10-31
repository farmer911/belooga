"""Public CMS, community social feed, FAQs, and moderation reporting endpoints (Thin Controller)."""

from typing import Any, Dict, List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.security import AuthenticatedUser, get_current_user, get_current_user_optional
from app.modules.cms import CmsService, UserPostsService
from app.schemas.cms import (
    BlogCommentCreateRequest,
    BlogPostCreateRequest,
    BlogPostResponse,
    CareerPostingCreateRequest,
    CareerPostingResponse,
    ContactInquiryRequest,
    ContactInquiryResponse,
    JobApplicantRequest,
    ReportProfileRequest,
    ReportProfileResponse,
    UserPostCreateRequest,
    UserPostItemDTO,
    UserPostUpdateRequest,
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
async def list_blog_posts(
    type: Optional[str] = Query(None, description="Filter by post type: all | user | editorial"),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_read_db),
):
    viewer = current_user.id if current_user else None
    return await CmsService(db).list_blog_posts(post_type=type, viewer_id=viewer)


@router.post("/blog/posts/", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def create_blog_post(
    payload: BlogPostCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).create_blog_post(payload=payload, current_user=current_user)


@router.get("/blog/posts/{slug}/", response_model=BlogPostResponse, tags=["Domain 8: Public CMS & Moderation"])
async def get_blog_post_detail(
    slug: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_read_db),
):
    viewer = current_user.id if current_user else None
    return await CmsService(db).get_blog_post_by_slug(slug, viewer_id=viewer)


@router.post("/blog/posts/{post_id}/like", response_model=BlogPostResponse, tags=["Domain 8: Public CMS & Moderation"])
async def toggle_like_blog_post(
    post_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).toggle_like_blog_post(post_id=post_id, current_user=current_user)


@router.post("/blog/posts/{post_id}/comments", response_model=BlogPostResponse, tags=["Domain 8: Public CMS & Moderation"])
async def add_comment_blog_post(
    post_id: str,
    payload: BlogCommentCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).add_comment_blog_post(post_id=post_id, payload=payload, current_user=current_user)


@router.get("/seo/sitemap-data", response_model=Dict[str, Any], tags=["Domain 8: Public CMS & Moderation"])
async def get_seo_sitemap_data(db: AsyncSession = Depends(get_read_db)):
    return await CmsService(db).get_seo_sitemap_data()


@router.get("/careers/", response_model=List[CareerPostingResponse], tags=["Domain 8: Public CMS & Moderation"])
async def list_careers(
    company: Optional[str] = Query(None, description="Filter by company name"),
    department: Optional[str] = Query(None, description="Filter by department"),
    location: Optional[str] = Query(None, description="Filter by location"),
    q: Optional[str] = Query(None, description="Search keyword across title, company, skills"),
    db: AsyncSession = Depends(get_read_db),
):
    return await CmsService(db).list_career_jobs(company=company, department=department, location=location, q=q)


@router.post("/careers/", response_model=CareerPostingResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def create_career_posting(
    payload: CareerPostingCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).create_career_job(payload=payload, current_user=current_user)


@router.post("/careers/{career_id}/apply", response_model=ContactInquiryResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def apply_career_posting(
    career_id: str,
    payload: JobApplicantRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).apply_career_job(career_id, payload, current_user=current_user)


@router.get("/career/jobs/", response_model=List[CareerPostingResponse], tags=["Domain 8: Public CMS & Moderation"])
async def list_career_jobs(
    company: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_read_db),
):
    return await CmsService(db).list_career_jobs(company=company, department=department, location=location, q=q)


@router.post("/career/jobs/", response_model=CareerPostingResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def create_career_job_alias(
    payload: CareerPostingCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).create_career_job(payload=payload, current_user=current_user)


@router.post("/career/jobs/{job_id}/apply/", response_model=ContactInquiryResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def apply_career_job(
    job_id: str,
    payload: JobApplicantRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).apply_career_job(job_id, payload, current_user=current_user)


@router.post("/profile/{user_id}/report/", response_model=ReportProfileResponse, tags=["Domain 8: Public CMS & Moderation"])
async def report_candidate_profile(
    user_id: uuid.UUID,
    payload: ReportProfileRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CmsService(db).report_candidate_profile(user_id, payload, reporter_identity_id=current_user.id)


@router.get("/posts/", response_model=List[UserPostItemDTO], tags=["Domain 8: Public CMS & Moderation"])
async def list_user_posts(
    username: Optional[str] = Query(None, description="Filter by author username"),
    db: AsyncSession = Depends(get_read_db),
):
    return await UserPostsService(db).list_posts(username=username)


@router.get("/posts/user/{username}", response_model=List[UserPostItemDTO], tags=["Domain 8: Public CMS & Moderation"])
async def list_user_posts_by_username(
    username: str,
    db: AsyncSession = Depends(get_read_db),
):
    return await UserPostsService(db).list_posts(username=username)


@router.post("/posts/", response_model=UserPostItemDTO, status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def create_user_post(
    payload: UserPostCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserPostsService(db).create_post(payload=payload, current_user=current_user)


@router.patch("/posts/{post_id}", response_model=UserPostItemDTO, tags=["Domain 8: Public CMS & Moderation"])
async def update_user_post(
    post_id: str,
    payload: UserPostUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserPostsService(db).update_post(post_id=post_id, payload=payload, current_user=current_user)


@router.delete("/posts/{post_id}", response_model=Dict[str, str], tags=["Domain 8: Public CMS & Moderation"])
async def delete_user_post(
    post_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserPostsService(db).delete_post(post_id=post_id, current_user=current_user)


@router.post("/posts/{post_id}/like", response_model=UserPostItemDTO, tags=["Domain 8: Public CMS & Moderation"])
async def like_user_post(
    post_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserPostsService(db).like_post(post_id=post_id, current_user=current_user)


@router.post("/posts/{post_id}/comments", response_model=UserPostItemDTO, tags=["Domain 8: Public CMS & Moderation"])
async def comment_user_post(
    post_id: str,
    payload: BlogCommentCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserPostsService(db).comment_post(post_id=post_id, payload=payload, current_user=current_user)

