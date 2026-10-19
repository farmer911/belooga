"""Media repository.

Data access layer for ProfileMedia, CandidateProfile media URLs, and VideoArchive entities.
"""

import uuid
from typing import Optional

from sqlalchemy import text, update
from sqlalchemy.ext.asyncio import AsyncSession

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

    async def update_resume_url(self, profile_id: uuid.UUID, resume_url: Optional[str]) -> None:
        stmt = (
            update(CandidateProfile)
            .where(CandidateProfile.id == profile_id)
            .values(resume_url=resume_url)
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
            SELECT p.video_pitch_url, pm.file_url AS video_pitch_poster
            FROM candidate_profiles p
            LEFT JOIN profile_media pm ON pm.profile_id = p.id AND pm.category = 'pitch_poster'
            WHERE p.username = :u
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
