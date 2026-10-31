"""Public CMS, community social feed, and moderation repository (Vertical Module: cms)."""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cms import CareerApplication, CareerPosting, ContactInquiry, ProfileReport
from app.models.job_tracker import CandidateJobApplicationTracker
from app.models.profile import CandidateProfile

from app.modules.cms.user_posts_repository import UserPostsMixin

class CmsRepository(UserPostsMixin):
    """Repository handling database operations for public CMS content, community feed, and trust reports."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_contact_inquiry(self, name: str, email: str, message: str) -> uuid.UUID:
        inquiry_id = uuid.uuid4()
        self.db.add(ContactInquiry(id=inquiry_id, name=name, email=email, message=message))
        await self.db.flush()
        return inquiry_id

    @staticmethod
    def _career_dict(r: Any) -> Dict[str, Any]:
        skills = list(r["skills"] or [])
        return {
            "id": str(r["id"]),
            "title": r["title"],
            "company_name": r["company_name"] or "Belooga",
            "company_logo_url": r["company_logo_url"],
            "company_website": r["company_website"],
            "department": r["department"],
            "location": r["location"],
            "salary_range": r["salary_range"] or "Negotiable",
            "skills": skills,
            "skills_required": skills,
            "is_partner": bool(r["is_partner"]),
            "is_system_role": bool(r["is_system_role"]),
            "posted_by_identity_id": str(r["posted_by_identity_id"]) if r["posted_by_identity_id"] else None,
            "description": r["description"],
            "is_active": True,
        }

    async def list_active_career_jobs(self) -> List[Dict[str, Any]]:
        res = await self.db.execute(
            text("""
                SELECT p.id, p.title, p.department, p.location, p.description,
                       m.company_name, m.company_logo_url, m.company_website, m.salary_range,
                       COALESCE(m.skills, '{}') AS skills, COALESCE(m.is_partner, FALSE) AS is_partner,
                       COALESCE(m.is_system_role, TRUE) AS is_system_role, m.posted_by_identity_id
                FROM career_postings p
                LEFT JOIN career_posting_meta m ON m.career_posting_id = p.id
                WHERE p.is_active = TRUE
                ORDER BY p.created_at DESC
            """)
        )
        return [self._career_dict(r) for r in res.mappings().all()]

    async def _insert_career_posting(
        self, title: str, department: str, location: str, description: str, meta: Dict[str, Any]
    ) -> Dict[str, Any]:
        res = await self.db.execute(
            text("""
                WITH p AS (
                    INSERT INTO career_postings (title, department, location, description, is_active)
                    VALUES (:title, :department, :location, :description, TRUE)
                    RETURNING id, title, department, location, description
                ), m AS (
                    INSERT INTO career_posting_meta (career_posting_id, company_name, company_logo_url, company_website,
                        salary_range, skills, is_partner, is_system_role, posted_by_identity_id)
                    SELECT p.id, CAST(:company_name AS varchar), CAST(:company_logo_url AS text), CAST(:company_website AS text),
                        CAST(:salary_range AS varchar), CAST(:skills AS text[]), CAST(:is_partner AS boolean),
                        CAST(:is_system_role AS boolean), CAST(:posted_by_identity_id AS uuid)
                    FROM p
                    RETURNING *
                )
                SELECT p.*, m.company_name, m.company_logo_url, m.company_website, m.salary_range, m.skills,
                       m.is_partner, m.is_system_role, m.posted_by_identity_id
                FROM p JOIN m ON m.career_posting_id = p.id
            """),
            {
                "title": title, "department": department, "location": location, "description": description,
                "company_name": meta.get("company_name") or "Belooga",
                "company_logo_url": meta.get("company_logo_url"),
                "company_website": meta.get("company_website"),
                "salary_range": meta.get("salary_range") or "Negotiable",
                "skills": list(meta.get("skills") or []),
                "is_partner": bool(meta.get("is_partner", False)),
                "is_system_role": bool(meta.get("is_system_role", False)),
                "posted_by_identity_id": meta.get("posted_by_identity_id"),
            },
        )
        return self._career_dict(res.mappings().one())

    async def create_career_posting(self, title: str, department: str, location: str, description: str, meta: Dict[str, Any]) -> Dict[str, Any]:
        comp_norm = (meta.get("company_name") or "Belooga").strip().lower()
        title_norm = title.strip().lower()
        for item in await self.list_active_career_jobs():
            if item["title"].strip().lower() == title_norm and (item.get("company_name") or "Belooga").strip().lower() == comp_norm:
                return item
        return await self._insert_career_posting(title, department, location, description, meta)

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

    # --- Blog / community feed (blog_posts, blog_post_likes, blog_post_comments) ---

    _BLOG_SQL = """
        SELECT b.id, b.slug, b.title, b.excerpt, b.date_label AS date, b.image, b.author, b.author_username,
               b.author_headline, b.author_avatar, b.post_type, b.category, b.tags, b.ats_score_badge,
               b.read_time_minutes, b.likes_count, b.content, b.key_takeaways, b.author_identity_id,
               EXISTS (SELECT 1 FROM blog_post_likes l WHERE l.post_id = b.id AND l.identity_id = :viewer) AS is_liked_by_me,
               COALESCE((
                   SELECT json_agg(json_build_object(
                       'id', c.id, 'author_name', c.author_name, 'author_username', c.author_username,
                       'content', c.content, 'created_at', to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI'))
                       ORDER BY c.created_at)
                   FROM blog_post_comments c WHERE c.post_id = b.id
               ), '[]'::json) AS comments
        FROM blog_posts b
    """

    async def list_blog_posts(self, post_type: Optional[str], viewer_id: Optional[uuid.UUID]) -> List[Dict[str, Any]]:
        where = "WHERE b.post_type = :pt" if post_type else ""
        res = await self.db.execute(
            text(f"{self._BLOG_SQL} {where} ORDER BY b.created_at DESC"),
            {"viewer": viewer_id, **({"pt": post_type} if post_type else {})},
        )
        return [dict(r) for r in res.mappings().all()]

    async def get_blog_post(self, slug_or_id: str, viewer_id: Optional[uuid.UUID]) -> Optional[Dict[str, Any]]:
        res = await self.db.execute(
            text(f"{self._BLOG_SQL} WHERE b.slug = :k OR b.id = :k LIMIT 1"),
            {"viewer": viewer_id, "k": slug_or_id.strip()},
        )
        row = res.mappings().first()
        return dict(row) if row else None

    async def insert_blog_post(self, data: Dict[str, Any]) -> None:
        await self.db.execute(
            text("""
                INSERT INTO blog_posts (id, slug, author_identity_id, author, author_username, author_headline, author_avatar,
                    title, excerpt, date_label, image, post_type, category, tags, ats_score_badge, read_time_minutes,
                    likes_count, content, key_takeaways)
                VALUES (:id, :slug, :author_identity_id, :author, :author_username, :author_headline, :author_avatar,
                    :title, :excerpt, :date_label, :image, :post_type, :category, :tags, :ats_score_badge, :read_time_minutes,
                    :likes_count, :content, :key_takeaways)
            """),
            data,
        )

    async def toggle_blog_like(self, post_id: str, identity_id: uuid.UUID) -> None:
        """Like if not yet liked, otherwise unlike; counter moves in the same statement batch."""
        removed = await self.db.execute(
            text("DELETE FROM blog_post_likes WHERE post_id = :pid AND identity_id = :iid RETURNING post_id"),
            {"pid": post_id, "iid": identity_id},
        )
        if removed.scalar_one_or_none():
            await self.db.execute(
                text("UPDATE blog_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = :pid"), {"pid": post_id}
            )
            return
        await self.db.execute(
            text("INSERT INTO blog_post_likes (post_id, identity_id) VALUES (:pid, :iid) ON CONFLICT DO NOTHING"),
            {"pid": post_id, "iid": identity_id},
        )
        await self.db.execute(text("UPDATE blog_posts SET likes_count = likes_count + 1 WHERE id = :pid"), {"pid": post_id})

    async def add_blog_comment(self, post_id: str, author_identity_id: uuid.UUID, author_username: str, content: str) -> None:
        await self.db.execute(
            text("""
                INSERT INTO blog_post_comments (id, post_id, author_identity_id, author_name, author_username, content)
                VALUES (:id, :pid, :aid, :uname, :uname, :content)
            """),
            {"id": f"cm-{uuid.uuid4().hex[:10]}", "pid": post_id, "aid": author_identity_id, "uname": author_username, "content": content},
        )

    # --- User profile posts (user_posts, user_post_likes, user_post_comments) ---

    _USER_POST_SQL = """
        SELECT p.id, p.author_identity_id, p.username, p.author_name, p.title, p.category, p.body, p.tags,
               p.attachment_link, p.likes_count, to_char(p.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS created_at,
               COALESCE((
                   SELECT json_agg(json_build_object(
                       'id', c.id, 'author_name', c.author_name, 'content', c.content,
                       'created_at', to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI'))
                       ORDER BY c.created_at)
                   FROM user_post_comments c WHERE c.post_id = p.id
               ), '[]'::json) AS comments
        FROM user_posts p
    """
