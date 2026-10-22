"""Public CMS and trust service (Vertical Module: cms).

Business domain service handling contact inquiries, FAQ knowledge retrieval,
career listings, job applications, and trust & safety candidate profile moderation reports.
"""

import re
from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.cms.repository import CmsRepository
from app.modules.notifications import NotificationService
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


DEFAULT_BLOG_POSTS = [
    {
        "slug": "how-to-master-the-30-second-pitch",
        "title": "How to Master Your 30-Second Video Elevator Pitch",
        "excerpt": "Proven techniques to articulate your career highlights, project confidence, and hook recruiters in half a minute.",
        "date": "October 2026",
        "image": "/images/blog/blog-1.jpg",
        "author": "Ava Morgan",
        "category": "Video Pitch Mastery",
        "read_time_minutes": 4,
        "content": [
            "In today's fast-paced recruitment landscape, hiring managers spend an average of less than six seconds glancing at an incoming PDF resume before deciding whether to advance a candidate or pass.",
            "A high-impact 30-second elevator pitch breaks through automated applicant tracking systems (ATS) by instantly establishing human presence, communication clarity, and genuine enthusiasm for the role.",
        ],
        "key_takeaways": [
            "Hook (0-5s): State your name, primary craft, and core value proposition.",
            "Proof (5-20s): Share a tangible milestone or quantifiable impact from your career.",
            "Direction (20-30s): Clarify the kind of mission and engineering culture you want to join next.",
        ],
    },
    {
        "slug": "why-video-resumes-are-the-future",
        "title": "Why Video Resumes Outperform Static PDFs by 3x",
        "excerpt": "Data from 250+ tech companies reveals how personalized video introductions lead to higher interview conversion rates.",
        "date": "September 2026",
        "image": "/images/blog/blog-1.jpg",
        "author": "Jeremy Tran",
        "category": "Hiring Data",
        "read_time_minutes": 5,
        "content": [
            "Empirical cohort data across 250+ engineering teams shows candidates with a verified 30-second video pitch receive 3.1x more direct recruiter outreach than text-only resumes.",
            "Combining structured STAR metrics with a concise video introduction eliminates early screening friction and accelerates technical interview invitations.",
        ],
        "key_takeaways": [
            "3.1x higher shortlist conversion rate compared to static PDF-only profiles.",
            "Async video screening saves engineering managers up to 4.5 hours per hire.",
            "Pair your video pitch with quantified STAR bullets for maximum ATS + human score.",
        ],
    },
    {
        "slug": "optimizing-candidate-experience",
        "title": "Reinventing the Modern Candidate Discovery Experience",
        "excerpt": "Behind the scenes of Belooga's design system and architectural evolution to Next.js 16.3.8, PostgreSQL 16 GIN, and FastAPI.",
        "date": "September 2026",
        "image": "/images/blog/blog-1.jpg",
        "author": "Engineering Team",
        "category": "Platform Engineering",
        "read_time_minutes": 6,
        "content": [
            "Belooga's talent discovery engine combines PostgreSQL 16 GIN TSVECTOR full-text indexing with pg_trgm trigram similarity for sub-15ms candidate search.",
            "Every candidate workspace integrates WebRTC teleprompter recording, real-time ATS diagnostics, and verified career timelines into a single cohesive platform.",
        ],
        "key_takeaways": [
            "Sub-15ms full-text & trigram search powered by PostgreSQL 16 GIN indexes.",
            "Browser-native WebRTC studio with voice-activated teleprompter scrolling.",
            "End-to-end privacy controls with instant recruiter PDF export.",
        ],
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
        m = re.search(r"\[Inquiry for @([a-zA-Z0-9_.-]+)\]", payload.message or "")
        if m and self.db and self.cms_repo:
            username = m.group(1)
            candidate_identity_id = await self.cms_repo.get_candidate_identity_by_username(username)
            if candidate_identity_id:
                await NotificationService(self.db).dispatch_event(
                    identity_id=candidate_identity_id,
                    event_type="RECRUITER_INQUIRY",
                    title=f"New Recruiter Inquiry from {payload.name}",
                    message=payload.message[:200],
                    deep_link=f"/user/{username}",
                    send_email=True,
                    category="system",
                )
        await self.db.commit()
        return {
            "message": "Thank you! Your inquiry has been received.",
            "id": str(inquiry_id),
        }

    async def get_faqs(self) -> List[Dict[str, Any]]:
        return STATIC_FAQS

    async def list_blog_posts(self) -> List[Dict[str, Any]]:
        async def _compute() -> List[Dict[str, Any]]:
            return DEFAULT_BLOG_POSTS

        return await platform_cache.get_or_set("cms:blog_posts", 60, _compute)

    async def get_blog_post_by_slug(self, slug: str) -> Dict[str, Any]:
        posts = await self.list_blog_posts()
        clean_slug = slug.lower().strip()
        for post in posts:
            if post["slug"] == clean_slug:
                return post
        raise HTTPException(status_code=404, detail=f"Blog article '{slug}' not found")

    async def get_seo_sitemap_data(self) -> Dict[str, Any]:
        async def _compute() -> Dict[str, Any]:
            usernames = await self.cms_repo.list_public_usernames_for_seo() if self.cms_repo else ["alexnguyen"]
            posts = await self.list_blog_posts()
            return {
                "public_usernames": usernames,
                "blog_slugs": [p["slug"] for p in posts],
                "static_routes": [
                    "/",
                    "/search",
                    "/expert-review",
                    "/ats-diagnostics",
                    "/cv-studio",
                    "/salary-benchmark",
                    "/careers",
                    "/blog",
                    "/help",
                    "/contact-us",
                ],
            }

        return await platform_cache.get_or_set("cms:seo_sitemap", 120, _compute)

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
        clean_id = (job_id or "").strip()
        try:
            parsed_uuid = uuid.UUID(clean_id)
            posting = await self.cms_repo.get_career_posting_by_id(parsed_uuid)
            if posting:
                target_uuid = posting.id
        except ValueError:
            alias_map = {item["id"].lower(): item["title"].lower() for item in DEFAULT_CAREER_JOBS}
            wanted_title = alias_map.get(clean_id.lower(), clean_id.lower().replace("-", " "))
            for item in jobs:
                item_title = str(item.get("title") or "").lower()
                if str(item.get("id") or "").lower() == clean_id.lower() or item_title == wanted_title:
                    try:
                        target_uuid = uuid.UUID(str(item["id"]))
                    except ValueError:
                        target_uuid = None
                    break

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
