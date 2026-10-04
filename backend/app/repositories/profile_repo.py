"""Candidate profile repository.

Data access layer for candidate profiles, skills, languages, and interests.
"""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import delete, insert, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalogs import Interest, Language, Skill
from app.models.profile import CandidateProfile, ProfileInterest, ProfileLanguage, ProfileSkill


class ProfileRepository:
    """Repository handling database operations for CandidateProfile and related taxonomies."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_username(self, username: str) -> Optional[CandidateProfile]:
        stmt = select(CandidateProfile).where(CandidateProfile.username == username.lower().strip())
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_id(self, profile_id: uuid.UUID) -> Optional[CandidateProfile]:
        stmt = select(CandidateProfile).where(CandidateProfile.id == profile_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_profile(
        self,
        profile_id: uuid.UUID,
        identity_id: uuid.UUID,
        username: str,
        first_name: str,
        last_name: str,
        headline: str = "Candidate",
        bio: str = "",
        is_hidden: bool = False,
        is_fresh: bool = True,
        submitted: bool = False,
    ) -> CandidateProfile:
        profile = CandidateProfile(
            id=profile_id,
            identity_id=identity_id,
            username=username.lower().strip(),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            headline=headline,
            bio=bio,
            is_hidden=is_hidden,
            is_fresh=is_fresh,
            submitted=submitted,
        )
        self.db.add(profile)
        await self.db.flush()
        return profile

    async def get_profile_with_identity(self, username: str):
        query = text("""
            SELECT p.id, p.identity_id, p.username, p.first_name, p.last_name,
                   p.headline, p.bio, p.location, p.phone, p.employment_status,
                   p.seeking_status, p.avatar_url, p.video_pitch_url, p.resume_url,
                   p.is_hidden, p.is_fresh, p.created_at,
                   i.email
            FROM candidate_profiles p
            JOIN identities i ON i.id = p.identity_id
            WHERE p.username = :username
            LIMIT 1
        """)
        res = await self.db.execute(query, {"username": username.lower().strip()})
        return res.fetchone()

    async def get_jobs(self, profile_id: uuid.UUID) -> List[Dict[str, Any]]:
        query = text("""
            SELECT id, title, company_name, from_date_month, from_date_year,
                   currently_work_here, to_date_month, to_date_year, description,
                   logo_url, display_order
            FROM job_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC, from_date_year DESC NULLS LAST
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_education(self, profile_id: uuid.UUID) -> List[Dict[str, Any]]:
        query = text("""
            SELECT id, school_name, degree_name, gpa, from_date_month, from_date_year,
                   currently_work_here, to_date_month, to_date_year, description,
                   logo_url, display_order
            FROM education_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_skills(self, profile_id: uuid.UUID) -> List[str]:
        query = text("""
            SELECT s.name
            FROM skills s
            JOIN profile_skills ps ON ps.skill_id = s.id
            WHERE ps.profile_id = :pid
            ORDER BY s.name ASC
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [r[0] for r in res.fetchall()]

    async def get_pitch_poster(self, profile_id: uuid.UUID) -> Optional[str]:
        query = text(
            "SELECT file_url FROM profile_media WHERE profile_id = :pid AND category = 'pitch_poster' LIMIT 1"
        )
        res = await self.db.execute(query, {"pid": profile_id})
        row = res.fetchone()
        return row[0] if row else None

    async def get_languages(self, profile_id: uuid.UUID) -> List[Dict[str, Any]]:
        query = text("""
            SELECT l.name, pl.proficiency
            FROM languages l
            JOIN profile_languages pl ON pl.language_id = l.id
            WHERE pl.profile_id = :pid
            ORDER BY l.name ASC
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [{"name": r[0], "proficiency": r[1]} for r in res.fetchall()]

    async def get_interests(self, profile_id: uuid.UUID) -> List[str]:
        query = text("""
            SELECT i.name
            FROM interests i
            JOIN profile_interests pi ON pi.interest_id = i.id
            WHERE pi.profile_id = :pid
            ORDER BY i.name ASC
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [r[0] for r in res.fetchall()]

    async def update_profile(self, profile_id: uuid.UUID, **fields) -> None:
        valid_fields = {k: v for k, v in fields.items() if v is not None}
        if not valid_fields:
            return
        stmt = (
            update(CandidateProfile)
            .where(CandidateProfile.id == profile_id)
            .values(**valid_fields)
        )
        await self.db.execute(stmt)

    async def add_skill(self, profile_id: uuid.UUID, skill_name: str) -> None:
        clean_name = skill_name.strip()
        await self.db.execute(
            text("INSERT INTO skills (id, name) VALUES (:id, :name) ON CONFLICT (name) DO NOTHING"),
            {"id": uuid.uuid4(), "name": clean_name},
        )
        skill_res = await self.db.execute(
            text("SELECT id FROM skills WHERE name = :name"),
            {"name": clean_name},
        )
        s_row = skill_res.fetchone()
        if s_row:
            await self.db.execute(
                text("INSERT INTO profile_skills (profile_id, skill_id) VALUES (:pid, :sid) ON CONFLICT DO NOTHING"),
                {"pid": profile_id, "sid": s_row.id},
            )

    async def remove_skill(self, profile_id: uuid.UUID, skill_name: str) -> None:
        clean_name = skill_name.strip()
        skill_res = await self.db.execute(
            text("SELECT id FROM skills WHERE name = :name"),
            {"name": clean_name},
        )
        s_row = skill_res.fetchone()
        if s_row:
            await self.db.execute(
                text("DELETE FROM profile_skills WHERE profile_id = :pid AND skill_id = :sid"),
                {"pid": profile_id, "sid": s_row.id},
            )
