"""Media repository.

Data access layer for ProfileMedia, CandidateProfile media URLs, and VideoArchive entities.
"""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media import ProfileMedia, VideoArchive
from app.models.profile import CandidateProfile


class MediaRepository:
    """Repository handling database operations for candidate media assets."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_avatar_url(self, profile_id: uuid.UUID, avatar_url: str) -> None:
        stmt = (
            update(CandidateProfile)
            .where(CandidateProfile.id == profile_id)
            .values(avatar_url=avatar_url)
        )
        await self.db.execute(stmt)

    async def update_video_pitch_url(self, profile_id: uuid.UUID, video_url: str) -> None:
        stmt = (
            update(CandidateProfile)
            .where(CandidateProfile.id == profile_id)
            .values(video_pitch_url=video_url)
        )
        await self.db.execute(stmt)

    async def upsert_pitch_poster(self, profile_id: uuid.UUID, poster_url: str) -> None:
        query = text("""
            INSERT INTO profile_media (id, profile_id, category, file_url, mime_type, file_size_bytes)
            VALUES (gen_random_uuid(), :pid, 'pitch_poster', :purl, 'image/jpeg', 0)
            ON CONFLICT (profile_id, category) DO UPDATE SET file_url = :purl, updated_at = NOW()
        """)
        await self.db.execute(query, {"pid": profile_id, "purl": poster_url})

    async def get_video_status(self, username: str):
        query = text("""
            SELECT video_pitch_url, video_pitch_poster
            FROM candidate_profiles
            WHERE username = :u
            LIMIT 1
        """)
        res = await self.db.execute(query, {"u": username.lower().strip()})
        return res.fetchone()

    async def get_candidate_for_pdf(self, username: str):
        query = text("""
            SELECT p.id, p.first_name, p.last_name, p.headline, p.bio, p.location, p.phone,
                   p.seeking_status, p.is_hidden, i.email
            FROM candidate_profiles p
            JOIN identities i ON i.id = p.identity_id
            WHERE p.username = :username
            LIMIT 1
        """)
        res = await self.db.execute(query, {"username": username.lower().strip()})
        return res.fetchone()

    async def get_pdf_jobs(self, profile_id: uuid.UUID) -> List[Dict[str, Any]]:
        query = text("""
            SELECT title, company_name, from_date_year, to_date_year, currently_work_here, description
            FROM job_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC, from_date_year DESC NULLS LAST
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_pdf_education(self, profile_id: uuid.UUID) -> List[Dict[str, Any]]:
        query = text("""
            SELECT school_name, degree_name, gpa, from_date_year, to_date_year
            FROM education_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_pdf_skills(self, profile_id: uuid.UUID) -> List[str]:
        query = text("""
            SELECT s.name
            FROM skills s
            JOIN profile_skills ps ON ps.skill_id = s.id
            WHERE ps.profile_id = :pid
            ORDER BY s.name ASC
        """)
        res = await self.db.execute(query, {"pid": profile_id})
        return [r[0] for r in res.fetchall()]
