"""Public CMS, community social feed, and trust service (Vertical Module: cms)."""

from datetime import datetime, timezone
import os
import re
from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.core.security import AuthenticatedUser
from app.modules.cms.repository import CmsRepository, DEFAULT_BLOG_POSTS
from app.modules.notifications import NotificationService
from app.schemas.cms import (
    BlogCommentCreateRequest, BlogPostCreateRequest, CareerPostingCreateRequest,
    ContactInquiryRequest, JobApplicantRequest, ReportProfileRequest,
)

STATIC_FAQS = [
    {"id": 1, "category": "Candidate Experience", "question": "What is the 30-second elevator pitch video?", "answer": "It is an authentic short video where you introduce yourself, highlight your primary superpowers, and articulate what kind of team you want to join."},
    {"id": 2, "category": "Candidate Experience", "question": "Can I re-record my video elevator pitch?", "answer": "Yes! You can record or upload as many takes as you want inside your candidate workspace until you are 100% satisfied."},
    {"id": 3, "category": "Privacy & Security", "question": "Who can view my candidate profile?", "answer": "You have full control. You can set your profile to Public for recruiters, or keep it Hidden while continuing to refine your credentials."},
    {"id": 4, "category": "Recruiters", "question": "How do recruiters contact candidates?", "answer": "Recruiters can review video pitches, verify timelines, and contact candidates directly via their verified email or phone."},
]

DEFAULT_CAREER_JOBS = [
    {"id": "c1", "title": "Staff Full-Stack Engineer", "company_name": "Belooga", "department": "Engineering", "location": "Remote / San Francisco", "salary_range": "$4,500 - $6,500 / month", "skills": ["Next.js", "FastAPI", "PostgreSQL", "TypeScript"], "is_partner": False, "description": "Build high-throughput async services and sleek Next.js interfaces."},
    {"id": "c2", "title": "Lead Product Designer", "company_name": "Belooga", "department": "Design", "location": "San Francisco, CA", "salary_range": "$4,000 - $5,800 / month", "skills": ["Figma", "Design Systems", "UX Research"], "is_partner": False, "description": "Craft intuitive candidate workspaces and seamless WebRTC video studios."},
    {"id": "c3", "title": "Head of Talent Partnerships", "company_name": "Belooga", "department": "Operations", "location": "New York, NY", "salary_range": "$4,200 - $6,000 / month", "skills": ["B2B Sales", "Talent Acquisition", "Partnerships"], "is_partner": False, "description": "Expand employer networks across top high-growth tech companies."},
]


class CmsService:
    """Service layer managing public content, community social feed, and moderation reporting."""

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.cms_repo = CmsRepository(db) if db else None

    async def submit_contact_inquiry(self, payload: ContactInquiryRequest) -> Dict[str, str]:
        inquiry_id = await self.cms_repo.create_contact_inquiry(name=payload.name, email=payload.email, message=payload.message)
        m = re.search(r"\[Inquiry for @([a-zA-Z0-9_.-]+)\]", payload.message or "")
        if m and self.db and self.cms_repo:
            username = m.group(1)
            candidate_identity_id = await self.cms_repo.get_candidate_identity_by_username(username)
            if candidate_identity_id:
                await NotificationService(self.db).dispatch_event(
                    identity_id=candidate_identity_id, event_type="RECRUITER_INQUIRY",
                    title=f"New Recruiter Inquiry from {payload.name}",
                    message=payload.message[:200], deep_link=f"/user/{username}",
                    send_email=True, category="system",
                )
        await self.db.commit()
        return {"message": "Thank you! Your inquiry has been received.", "id": str(inquiry_id)}

    async def get_faqs(self) -> List[Dict[str, Any]]:
        return STATIC_FAQS

    def _format_post(self, raw: Dict[str, Any], viewer_username: Optional[str] = None) -> Dict[str, Any]:
        post = dict(raw)
        liked_by, comments = list(post.get("liked_by") or []), list(post.get("comments") or [])
        post.update({"is_liked_by_me": bool(viewer_username and viewer_username in liked_by), "comments_count": len(comments), "likes_count": int(post.get("likes_count", 12))})
        return post

    async def _load_all_posts(self) -> List[Dict[str, Any]]:
        if not self.cms_repo:
            return [dict(p) for p in DEFAULT_BLOG_POSTS]
        persisted = await self.cms_repo.list_persisted_blog_posts()
        by_slug = {p["slug"]: p for p in persisted if "slug" in p}
        default_slugs = {d["slug"] for d in DEFAULT_BLOG_POSTS}
        merged: List[Dict[str, Any]] = [p for p in persisted if p.get("slug") not in default_slugs]
        return merged + [by_slug.get(d["slug"], dict(d)) for d in DEFAULT_BLOG_POSTS]

    async def list_blog_posts(self, post_type: Optional[str] = None, viewer_username: Optional[str] = None) -> List[Dict[str, Any]]:
        posts = await self._load_all_posts()
        t_norm = (post_type or "all").strip().lower()
        if t_norm in ("user", "user_status"):
            posts = [p for p in posts if p.get("post_type") == "USER_STATUS"]
        elif t_norm == "editorial":
            posts = [p for p in posts if p.get("post_type", "EDITORIAL") == "EDITORIAL"]
        return [self._format_post(p, viewer_username) for p in posts]

    async def get_blog_post_by_slug(self, slug: str, viewer_username: Optional[str] = None) -> Dict[str, Any]:
        clean_slug = slug.lower().strip()
        for post in await self._load_all_posts():
            if post.get("slug") == clean_slug or post.get("id") == clean_slug:
                return self._format_post(post, viewer_username)
        raise HTTPException(status_code=404, detail=f"Blog article '{slug}' not found")

    async def create_blog_post(self, payload: BlogPostCreateRequest, current_user: Optional[AuthenticatedUser] = None) -> Dict[str, Any]:
        body_text = (payload.excerpt or (payload.content[0] if payload.content else "") or payload.title or "").strip()
        if not body_text:
            raise HTTPException(status_code=400, detail="Post content cannot be empty")
        title_text = (payload.title or body_text[:72]).strip()
        username = current_user.username if current_user else "alexnguyen"
        slug_base = re.sub(r"[^a-z0-9]+", "-", title_text.lower()).strip("-")[:36] or "status"
        slug = f"{slug_base}-{uuid.uuid4().hex[:6]}"
        post_data: Dict[str, Any] = {
            "id": f"post-{uuid.uuid4().hex[:8]}", "slug": slug, "title": title_text, "excerpt": body_text,
            "date": "Vừa xong", "image": "/images/blog/blog-1.jpg", "author": username, "author_username": username,
            "author_headline": "Verified Member @ Belooga Talent Network", "author_avatar": "/images/avatar.jpg",
            "post_type": payload.post_type if payload.post_type in ("EDITORIAL", "USER_STATUS") else "USER_STATUS",
            "category": payload.category or "Community Feed", "tags": payload.tags or ["Belooga", "Career"],
            "ats_score_badge": payload.ats_score_badge, "read_time_minutes": 2, "likes_count": 1, "comments_count": 0,
            "liked_by": [username], "comments": [], "content": payload.content or [body_text], "key_takeaways": [],
        }
        if self.cms_repo:
            await self.cms_repo.upsert_blog_post(slug, post_data)
        await platform_cache.invalidate_prefix("cms:")
        return self._format_post(post_data, username)

    async def toggle_like_blog_post(self, post_id: str, current_user: Optional[AuthenticatedUser] = None) -> Dict[str, Any]:
        viewer = current_user.username if current_user else "guest_viewer"
        target = next((p for p in await self._load_all_posts() if p.get("slug") == post_id or p.get("id") == post_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="Blog post not found")
        post = dict(target)
        liked_by = list(post.get("liked_by") or [])
        base_likes = int(post.get("likes_count", 12))
        if viewer in liked_by:
            liked_by = [u for u in liked_by if u != viewer]
            post["likes_count"] = max(0, base_likes - 1)
        else:
            liked_by.append(viewer)
            post["likes_count"] = base_likes + 1
        post["liked_by"] = liked_by
        if self.cms_repo:
            await self.cms_repo.upsert_blog_post(post["slug"], post)
        await platform_cache.invalidate_prefix("cms:")
        return self._format_post(post, viewer)

    async def add_comment_blog_post(self, post_id: str, payload: BlogCommentCreateRequest, current_user: Optional[AuthenticatedUser] = None) -> Dict[str, Any]:
        viewer = current_user.username if current_user else "alexnguyen"
        target = next((p for p in await self._load_all_posts() if p.get("slug") == post_id or p.get("id") == post_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="Blog post not found")
        post = dict(target)
        comments = list(post.get("comments") or [])
        comments.append({"id": f"cm-{uuid.uuid4().hex[:8]}", "author_name": viewer, "author_username": viewer, "content": payload.content.strip(), "created_at": datetime.now(timezone.utc).strftime("%H:%M")})
        post["comments"], post["comments_count"] = comments, len(comments)
        if self.cms_repo:
            await self.cms_repo.upsert_blog_post(post["slug"], post)
            author_username = post.get("author_username")
            if author_username and self.db:
                author_identity_id = await self.cms_repo.get_candidate_identity_by_username(author_username)
                if author_identity_id:
                    await NotificationService(self.db).dispatch_event(
                        identity_id=author_identity_id, event_type="COMMUNITY_POST_COMMENT",
                        title=f"@{viewer} đã bình luận bài viết của bạn",
                        message=payload.content.strip()[:160], deep_link=f"/blog/{post['slug']}",
                        send_email=False, category="general",
                    )
        await platform_cache.invalidate_prefix("cms:")
        return self._format_post(post, viewer)

    async def get_seo_sitemap_data(self) -> Dict[str, Any]:
        async def _compute() -> Dict[str, Any]:
            usernames = await self.cms_repo.list_public_usernames_for_seo() if self.cms_repo else ["alexnguyen"]
            posts = await self.list_blog_posts()
            return {
                "public_usernames": usernames, "blog_slugs": [p["slug"] for p in posts],
                "static_routes": ["/", "/search", "/expert-review", "/ats-diagnostics", "/cv-studio", "/salary-benchmark", "/careers", "/blog", "/help", "/contact-us"],
            }

        return await _compute() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set("cms:seo_sitemap", 120, _compute)

    async def list_career_jobs(
        self, company: Optional[str] = None, department: Optional[str] = None,
        location: Optional[str] = None, q: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        async def _compute() -> List[Dict[str, Any]]:
            if not self.cms_repo:
                return DEFAULT_CAREER_JOBS
            jobs = await self.cms_repo.list_active_career_jobs()
            if len(jobs) < 3:
                await self.cms_repo.seed_default_career_postings(DEFAULT_CAREER_JOBS)
                await self.db.commit()
                jobs = await self.cms_repo.list_active_career_jobs()
            return jobs if jobs else DEFAULT_CAREER_JOBS

        all_jobs = await _compute() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set("cms:career_jobs", 60, _compute)
        out = [dict(j) for j in all_jobs]
        if company and company.strip().upper() != "ALL":
            c_norm = company.strip().lower()
            out = [j for j in out if c_norm in str(j.get("company_name") or "Belooga").lower()]
        if department:
            d_norm = department.strip().lower()
            out = [j for j in out if d_norm in str(j.get("department") or "").lower()]
        if location:
            l_norm = location.strip().lower()
            out = [j for j in out if l_norm in str(j.get("location") or "").lower()]
        if q:
            q_norm = q.strip().lower()
            out = [
                j for j in out
                if q_norm in str(j.get("title") or "").lower()
                or q_norm in str(j.get("company_name") or "").lower()
                or q_norm in str(j.get("description") or "").lower()
                or any(q_norm in str(s).lower() for s in (j.get("skills") or []))
            ]
        return out

    async def create_career_job(
        self, payload: CareerPostingCreateRequest, current_user: Optional[AuthenticatedUser] = None
    ) -> Dict[str, Any]:
        desc = (payload.description or payload.job_description or "").strip() or "Join a high-velocity engineering and product team."
        skills = payload.skills or payload.skills_required or ["FastAPI", "Next.js", "PostgreSQL"]
        meta = {
            "company_name": (payload.company_name or "Belooga").strip(),
            "company_logo_url": payload.company_logo_url,
            "company_website": payload.company_website,
            "salary_range": (payload.salary_range or "Negotiable").strip(),
            "skills": skills,
            "is_partner": payload.is_partner,
            "is_system_role": payload.is_system_role,
            "posted_by_identity_id": str(current_user.id) if current_user else None,
        }
        created = await self.cms_repo.create_career_posting(
            title=payload.title.strip(), department=(payload.department or "Engineering").strip(),
            location=(payload.location or "Remote").strip(), description=desc, meta=meta,
        )
        await self.db.commit()
        await platform_cache.invalidate_prefix("cms:")
        return created

    async def apply_career_job(
        self, job_id: str, payload: JobApplicantRequest, current_user: Optional[AuthenticatedUser] = None
    ) -> Dict[str, Any]:
        jobs = await self.list_career_jobs()
        target_uuid: Optional[uuid.UUID] = None
        matched_job: Optional[Dict[str, Any]] = None
        clean_id = (job_id or "").strip()
        try:
            parsed_uuid = uuid.UUID(clean_id)
            posting = await self.cms_repo.get_career_posting_by_id(parsed_uuid)
            if posting:
                target_uuid = posting.id
                matched_job = next((j for j in jobs if str(j.get("id")) == str(target_uuid)), None)
        except ValueError:
            alias_map = {item["id"].lower(): item["title"].lower() for item in DEFAULT_CAREER_JOBS}
            wanted_title = alias_map.get(clean_id.lower(), clean_id.lower().replace("-", " "))
            for item in jobs:
                if str(item.get("id") or "").lower() == clean_id.lower() or str(item.get("title") or "").lower() == wanted_title:
                    matched_job = item
                    try:
                        target_uuid = uuid.UUID(str(item["id"]))
                    except ValueError:
                        target_uuid = None
                    break
        if not target_uuid:
            raise HTTPException(status_code=404, detail="Career job posting not found")

        app_id = await self.cms_repo.create_career_application(
            job_id=target_uuid, applicant_name=payload.applicant_name.strip(),
            applicant_email=payload.applicant_email.lower().strip(), resume_url=payload.resume_url.strip(),
        )
        cand_id = current_user.id if current_user else await self.cms_repo.get_candidate_identity_by_username("alexnguyen")
        comp_name = (matched_job or {}).get("company_name") or "Belooga"
        pos_title = (matched_job or {}).get("title") or "Software Engineer"
        sal_range = (matched_job or {}).get("salary_range") or "Negotiable"
        loc_str = (matched_job or {}).get("location") or "Remote"
        tracker_id = await self.cms_repo.sync_career_application_to_tracker(cand_id, comp_name, pos_title, sal_range, loc_str)
        if cand_id and self.db:
            await NotificationService(self.db).dispatch_event(
                identity_id=cand_id, event_type="CAREER_APPLICATION_SUBMITTED",
                title=f"Đã ứng tuyển 1-Click: {pos_title} @ {comp_name}",
                message=f"Hồ sơ của bạn đã gửi tới {comp_name} và tự động đồng bộ vào Kanban Job Tracker.",
                deep_link="/workspace/jobs", send_email=False, category="system",
            )
        await self.db.commit()
        return {"message": "Application submitted successfully.", "id": str(app_id), "tracker_synced": bool(tracker_id), "tracker_item_id": tracker_id}

    async def report_candidate_profile(self, user_id: uuid.UUID, payload: ReportProfileRequest) -> Dict[str, str]:
        reason = payload.reason.strip()
        if not reason:
            raise HTTPException(status_code=400, detail="Report reason cannot be empty")
        if not await self.cms_repo.check_candidate_exists(user_id):
            raise HTTPException(status_code=404, detail="Candidate profile not found")
        report_id = await self.cms_repo.create_profile_report(reported_profile_id=user_id, reason=reason)
        await self.db.commit()
        return {"message": "Candidate profile reported. Our trust and safety team will investigate.", "id": str(report_id)}
