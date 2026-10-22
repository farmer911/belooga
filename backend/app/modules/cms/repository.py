"""Public CMS, community social feed, and moderation repository (Vertical Module: cms)."""

import json
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cms import CareerApplication, CareerPosting, ContactInquiry, ProfileReport
from app.models.job_tracker import CandidateJobApplicationTracker
from app.models.profile import CandidateProfile

DEFAULT_BLOG_POSTS: List[Dict[str, Any]] = [
    {
        "id": "editorial-1", "slug": "how-to-master-the-30-second-pitch",
        "title": "How to Master Your 30-Second Video Elevator Pitch",
        "excerpt": "Proven techniques to articulate your career highlights, project confidence, and hook recruiters in half a minute.",
        "date": "October 2026", "image": "/images/blog/blog-1.jpg", "author": "Ava Morgan",
        "author_username": "avamorgan", "author_headline": "Head of Talent Coaching @ Belooga Editorial",
        "post_type": "EDITORIAL", "category": "Video Pitch Mastery", "tags": ["VideoPitch", "CareerGrowth", "InterviewPrep"],
        "read_time_minutes": 4, "likes_count": 42, "comments_count": 1, "liked_by": [],
        "comments": [{"id": "c-1", "author_name": "Alex Nguyen", "author_username": "alexnguyen", "content": "Kịch bản 60s Teleprompter trong ATS Studio giúp mình quay 1 lần ăn ngay!", "created_at": "2 giờ trước"}],
        "content": [
            "In today's fast-paced recruitment landscape, hiring managers spend an average of less than six seconds glancing at an incoming PDF resume before deciding whether to advance a candidate or pass.",
            "A high-impact 30-second elevator pitch breaks through automated applicant tracking systems (ATS) by instantly establishing human presence, communication clarity, and genuine enthusiasm for the role.",
        ],
        "key_takeaways": ["Hook (0-5s): State your name, primary craft, and core value proposition.", "Proof (5-20s): Share a tangible milestone or quantifiable impact.", "Direction (20-30s): Clarify the mission you want to join next."],
    },
    {
        "id": "status-1", "slug": "alex-nguyen-ats-94-golang-milestone",
        "title": "Vừa tối ưu CV chuẩn STAR đạt 94/100 điểm ATS cho vị trí Senior Golang @ VNG!",
        "excerpt": "Sau khi dùng tính năng Nạp CV Hồ Sơ và 1-Click STAR Tailor trên Belooga, điểm khớp từ khóa PostgreSQL GIN & Distributed Systems của mình tăng từ 68 lên 94/100.",
        "date": "Hôm nay", "image": "/images/blog/blog-1.jpg", "author": "Alex Nguyen",
        "author_username": "alexnguyen", "author_headline": "Senior Distributed Systems Engineer",
        "post_type": "USER_STATUS", "category": "Community Feed", "tags": ["Golang", "PostgreSQL", "ATSScore", "SystemDesign"],
        "ats_score_badge": 94, "read_time_minutes": 2, "likes_count": 29, "comments_count": 1, "liked_by": [],
        "comments": [{"id": "c-2", "author_name": "Minh Tran", "author_username": "minhtran", "content": "Chúc mừng bác! Điểm STAR Impact 24/25 quá đỉnh.", "created_at": "1 giờ trước"}],
        "content": ["Sau khi dùng tính năng Nạp CV Hồ Sơ và 1-Click STAR Tailor trên Belooga, điểm khớp từ khóa PostgreSQL GIN & Distributed Systems của mình tăng từ 68 lên 94/100."],
        "key_takeaways": [],
    },
    {
        "id": "editorial-2", "slug": "why-video-resumes-are-the-future",
        "title": "Why Video Resumes Outperform Static PDFs by 3x",
        "excerpt": "Data from 250+ tech companies reveals how personalized video introductions lead to higher interview conversion rates.",
        "date": "September 2026", "image": "/images/blog/blog-1.jpg", "author": "Jeremy Tran",
        "author_username": "jeremytran", "author_headline": "Principal Talent Researcher",
        "post_type": "EDITORIAL", "category": "Hiring Data", "tags": ["HiringData", "VideoResume", "ATS"],
        "read_time_minutes": 5, "likes_count": 37, "comments_count": 0, "liked_by": [], "comments": [],
        "content": [
            "Empirical cohort data across 250+ engineering teams shows candidates with a verified 30-second video pitch receive 3.1x more direct recruiter outreach than text-only resumes.",
            "Combining structured STAR metrics with a concise video introduction eliminates early screening friction and accelerates technical interview invitations.",
        ],
        "key_takeaways": ["3.1x higher shortlist conversion rate compared to static PDF-only profiles.", "Async video screening saves engineering managers up to 4.5 hours per hire."],
    },
    {
        "id": "status-2", "slug": "sarah-le-hiring-fullstack-nextjs-fastapi",
        "title": "Team Fintech đang tìm gấp 2 Senior Full-Stack (Next.js 16 + FastAPI) — Ưu tiên ứng viên có Video Pitch!",
        "excerpt": "Mình vừa lọc trên Recruiter Talent Shortlist thấy nhiều hồ sơ rất chất. Bạn nào có sẵn Video Pitch 30s và điểm ATS > 85 gửi link hồ sơ Belooga dưới comment nhé!",
        "date": "3 giờ trước", "image": "/images/blog/blog-1.jpg", "author": "Sarah Le",
        "author_username": "sarahle", "author_headline": "Tech Talent Acquisition Lead @ FinCloud",
        "post_type": "USER_STATUS", "category": "Community Feed", "tags": ["Hiring", "NextJS", "FastAPI", "RemoteVN"],
        "ats_score_badge": None, "read_time_minutes": 2, "likes_count": 51, "comments_count": 1, "liked_by": [],
        "comments": [{"id": "c-3", "author_name": "Hoang Pham", "author_username": "hoangpham", "content": "Mình vừa gửi link hồ sơ /public/alexnguyen kèm Video Pitch nhé chị!", "created_at": "45 phút trước"}],
        "content": ["Mình vừa lọc trên Recruiter Talent Shortlist thấy nhiều hồ sơ rất chất. Bạn nào có sẵn Video Pitch 30s và điểm ATS > 85 gửi link hồ sơ Belooga dưới comment nhé!"],
        "key_takeaways": [],
    },
    {
        "id": "editorial-3", "slug": "optimizing-candidate-experience",
        "title": "Reinventing the Modern Candidate Discovery Experience",
        "excerpt": "Behind the scenes of Belooga's design system and architectural evolution to Next.js 16.3.8, PostgreSQL 16 GIN, and FastAPI.",
        "date": "September 2026", "image": "/images/blog/blog-1.jpg", "author": "Engineering Team",
        "author_username": "belooga_eng", "author_headline": "Core Platform Engineering",
        "post_type": "EDITORIAL", "category": "Platform Engineering", "tags": ["PostgreSQL", "FastAPI", "NextJS16"],
        "read_time_minutes": 6, "likes_count": 64, "comments_count": 0, "liked_by": [], "comments": [],
        "content": [
            "Belooga's talent discovery engine combines PostgreSQL 16 GIN TSVECTOR full-text indexing with pg_trgm trigram similarity for sub-15ms candidate search.",
            "Every candidate workspace integrates WebRTC teleprompter recording, real-time ATS diagnostics, and verified career timelines into a single cohesive platform.",
        ],
        "key_takeaways": ["Sub-15ms full-text & trigram search powered by PostgreSQL 16 GIN indexes.", "Browser-native WebRTC studio with voice-activated teleprompter scrolling."],
    },
]


class CmsRepository:
    """Repository handling database operations for public CMS content, community feed, and trust reports."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_contact_inquiry(self, name: str, email: str, message: str) -> uuid.UUID:
        inquiry_id = uuid.uuid4()
        self.db.add(ContactInquiry(id=inquiry_id, name=name, email=email, message=message))
        await self.db.flush()
        return inquiry_id

    async def list_active_career_jobs(self) -> List[Dict[str, Any]]:
        res = await self.db.execute(
            text("SELECT id, title, department, location, description FROM career_postings WHERE is_active = TRUE ORDER BY created_at DESC")
        )
        rows = res.fetchall()
        meta_res = await self.db.execute(text("SELECT name, message FROM contact_inquiries WHERE name LIKE 'CAREER_META:%'"))
        meta_map: Dict[str, Dict[str, Any]] = {}
        for m in meta_res.mappings().all():
            if m["message"]:
                meta_map[str(m["name"]).replace("CAREER_META:", "")] = json.loads(m["message"])
        out: List[Dict[str, Any]] = []
        for r in rows:
            jid = str(r.id)
            meta = meta_map.get(jid, {})
            skills = meta.get("skills") or ["FastAPI", "Next.js", "PostgreSQL", "TypeScript"]
            out.append({
                "id": jid,
                "title": r.title,
                "company_name": meta.get("company_name") or "Belooga",
                "company_logo_url": meta.get("company_logo_url"),
                "company_website": meta.get("company_website"),
                "department": r.department,
                "location": r.location,
                "salary_range": meta.get("salary_range") or "$4,500 - $6,500 / month",
                "skills": skills,
                "skills_required": skills,
                "is_partner": bool(meta.get("is_partner", False)),
                "is_system_role": bool(meta.get("is_system_role", True)),
                "posted_by_identity_id": meta.get("posted_by_identity_id"),
                "description": r.description,
                "is_active": True,
            })
        return out

    async def seed_default_career_postings(self, defaults: List[Dict[str, Any]]) -> None:
        existing_titles = {j["title"].strip().lower() for j in await self.list_active_career_jobs()}
        for item in defaults:
            if item["title"].strip().lower() in existing_titles:
                continue
            jid = uuid.uuid4()
            self.db.add(CareerPosting(id=jid, title=item["title"], department=item["department"], location=item["location"], description=item["description"], is_active=True))
            meta_json = json.dumps({
                "company_name": item.get("company_name", "Belooga"),
                "salary_range": item.get("salary_range", "$4,500 - $6,500 / month"),
                "skills": item.get("skills", ["Next.js", "FastAPI", "PostgreSQL", "TypeScript"]),
                "is_partner": bool(item.get("is_partner", False)),
                "is_system_role": not bool(item.get("is_partner", False)),
            }, ensure_ascii=False)
            self.db.add(ContactInquiry(id=uuid.uuid4(), name=f"CAREER_META:{jid}", email="careers@belooga.internal", message=meta_json))
        await self.db.flush()

    async def create_career_posting(self, title: str, department: str, location: str, description: str, meta: Dict[str, Any]) -> Dict[str, Any]:
        existing = await self.list_active_career_jobs()
        comp_norm = (meta.get("company_name") or "Belooga").strip().lower()
        title_norm = title.strip().lower()
        for item in existing:
            if item["title"].strip().lower() == title_norm and (item.get("company_name") or "Belooga").strip().lower() == comp_norm:
                return item
        jid = uuid.uuid4()
        self.db.add(CareerPosting(id=jid, title=title, department=department, location=location, description=description, is_active=True))
        meta_json = json.dumps(meta, ensure_ascii=False)
        self.db.add(ContactInquiry(id=uuid.uuid4(), name=f"CAREER_META:{jid}", email="careers@belooga.internal", message=meta_json))
        await self.db.flush()
        skills = meta.get("skills") or []
        return {
            "id": str(jid), "title": title, "company_name": meta.get("company_name") or "Belooga",
            "company_logo_url": meta.get("company_logo_url"), "company_website": meta.get("company_website"),
            "department": department, "location": location, "salary_range": meta.get("salary_range") or "Negotiable",
            "skills": skills, "skills_required": skills, "is_partner": bool(meta.get("is_partner", True)),
            "is_system_role": bool(meta.get("is_system_role", False)), "posted_by_identity_id": meta.get("posted_by_identity_id"),
            "description": description, "is_active": True,
        }

    async def sync_career_application_to_tracker(
        self, candidate_identity_id: Optional[uuid.UUID], company_name: str, position_title: str, salary_range: str, location: str
    ) -> Optional[str]:
        stmt = select(CandidateJobApplicationTracker).where(
            CandidateJobApplicationTracker.company_name == company_name,
            CandidateJobApplicationTracker.position_title == position_title,
        )
        if candidate_identity_id:
            stmt = stmt.where(CandidateJobApplicationTracker.candidate_identity_id == candidate_identity_id)
        res = await self.db.execute(stmt.limit(1))
        existing = res.scalar_one_or_none()
        if existing:
            return str(existing.id)
        item = CandidateJobApplicationTracker(
            id=uuid.uuid4(), candidate_identity_id=candidate_identity_id,
            company_name=company_name, position_title=position_title,
            status="APPLIED", expected_salary=salary_range or "Negotiable",
            match_score=88, notes=f"Applied 1-Click via Belooga Careers ({location})",
        )
        self.db.add(item)
        await self.db.flush()
        return str(item.id)

    async def get_career_posting_by_id(self, job_id: uuid.UUID) -> Optional[CareerPosting]:
        res = await self.db.execute(select(CareerPosting).where(CareerPosting.id == job_id, CareerPosting.is_active.is_(True)))
        return res.scalar_one_or_none()

    async def create_career_application(self, job_id: uuid.UUID, applicant_name: str, applicant_email: str, resume_url: str) -> uuid.UUID:
        app_id = uuid.uuid4()
        self.db.add(CareerApplication(id=app_id, job_id=job_id, applicant_name=applicant_name, applicant_email=applicant_email, resume_url=resume_url))
        await self.db.flush()
        return app_id

    async def check_candidate_exists(self, profile_id: uuid.UUID) -> bool:
        res = await self.db.execute(select(CandidateProfile.id).where(CandidateProfile.id == profile_id))
        return res.scalar_one_or_none() is not None

    async def get_candidate_identity_by_username(self, username: str) -> Optional[uuid.UUID]:
        clean = (username or "").strip()
        if not clean:
            return None
        res = await self.db.execute(select(CandidateProfile.identity_id).where(CandidateProfile.username == clean))
        return res.scalar_one_or_none()

    async def create_profile_report(self, reported_profile_id: uuid.UUID, reason: str, reporter_identity_id: Optional[uuid.UUID] = None) -> uuid.UUID:
        report_id = uuid.uuid4()
        self.db.add(ProfileReport(id=report_id, reported_profile_id=reported_profile_id, reporter_identity_id=reporter_identity_id, reason=reason))
        await self.db.flush()
        return report_id

    async def list_public_usernames_for_seo(self, limit: int = 100) -> List[str]:
        stmt = select(CandidateProfile.username).where(CandidateProfile.is_hidden.is_(False)).order_by(CandidateProfile.created_at.desc()).limit(limit)
        res = await self.db.execute(stmt)
        return [r[0] for r in res.fetchall() if r[0]]

    async def list_persisted_blog_posts(self) -> List[Dict[str, Any]]:
        res = await self.db.execute(text("SELECT id, message FROM contact_inquiries WHERE name LIKE 'BLOG_POST:%' ORDER BY created_at DESC"))
        return [json.loads(r["message"]) for r in res.mappings().all() if r["message"]]

    async def upsert_blog_post(self, slug: str, post_data: Dict[str, Any]) -> Dict[str, Any]:
        key_tag = f"BLOG_POST:{slug}"
        payload_json = json.dumps(post_data, ensure_ascii=False)
        res = await self.db.execute(text("SELECT id FROM contact_inquiries WHERE name = :k LIMIT 1"), {"k": key_tag})
        row = res.mappings().first()
        if row:
            await self.db.execute(text("UPDATE contact_inquiries SET message = :msg WHERE id = :id"), {"msg": payload_json, "id": row["id"]})
        else:
            await self.db.execute(
                text("INSERT INTO contact_inquiries (id, name, email, message) VALUES (:id, :k, 'blog@belooga.internal', :msg)"),
                {"id": uuid.uuid4(), "k": key_tag, "msg": payload_json},
            )
        await self.db.commit()
        return post_data

    async def list_persisted_user_posts(self) -> List[Dict[str, Any]]:
        res = await self.db.execute(text("SELECT id, message FROM contact_inquiries WHERE name LIKE 'USER_POST:%' ORDER BY created_at DESC"))
        out: List[Dict[str, Any]] = []
        for r in res.mappings().all():
            if r["message"]:
                try:
                    out.append(json.loads(r["message"]))
                except Exception:
                    continue
        return out

    async def upsert_user_post(self, post_id: str, post_data: Dict[str, Any]) -> Dict[str, Any]:
        key_tag = f"USER_POST:{post_id}"
        payload_json = json.dumps(post_data, ensure_ascii=False)
        res = await self.db.execute(text("SELECT id FROM contact_inquiries WHERE name = :k LIMIT 1"), {"k": key_tag})
        row = res.mappings().first()
        if row:
            await self.db.execute(text("UPDATE contact_inquiries SET message = :msg WHERE id = :id"), {"msg": payload_json, "id": row["id"]})
        else:
            await self.db.execute(
                text("INSERT INTO contact_inquiries (id, name, email, message) VALUES (:id, :k, 'posts@belooga.internal', :msg)"),
                {"id": uuid.uuid4(), "k": key_tag, "msg": payload_json},
            )
        await self.db.commit()
        return post_data

    async def delete_user_post(self, post_id: str) -> bool:
        key_tag = f"USER_POST:{post_id}"
        res = await self.db.execute(text("DELETE FROM contact_inquiries WHERE name = :k RETURNING id"), {"k": key_tag})
        await self.db.commit()
        return res.scalar_one_or_none() is not None

