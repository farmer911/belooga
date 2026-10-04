"""Candidate profile service.

Business domain service enforcing privacy guards (is_hidden check),
PII masking, biographical updates, and skills taxonomy associations.
"""

from typing import Any, Dict, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, verify_profile_owner
from app.repositories.profile_repo import ProfileRepository
from app.schemas.profile import ProfileUpdate


class ProfileService:
    """Service layer managing candidate profiles and privacy boundaries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_repo = ProfileRepository(db)

    async def get_candidate_public_profile(
        self, username: str, current_user: Optional[AuthenticatedUser]
    ) -> Dict[str, Any]:
        clean_username = username.lower().strip()
        row = await self.profile_repo.get_profile_with_identity(clean_username)

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate @{username} not found",
            )

        is_owner = current_user is not None and (
            current_user.username.lower() == clean_username or current_user.role == "admin"
        )
        if row.is_hidden and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate @{username} not found",
            )

        profile_id = row.id
        jobs = await self.profile_repo.get_jobs(profile_id)
        education = await self.profile_repo.get_education(profile_id)
        skills = await self.profile_repo.get_skills(profile_id)
        video_pitch_poster = await self.profile_repo.get_pitch_poster(profile_id)
        languages = await self.profile_repo.get_languages(profile_id)
        interests = await self.profile_repo.get_interests(profile_id)

        return {
            "id": str(row.id),
            "username": row.username,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "full_name": f"{row.first_name} {row.last_name}",
            "email": row.email if is_owner else None,
            "headline": row.headline,
            "bio": row.bio,
            "location": row.location,
            "phone": row.phone if is_owner else None,
            "avatar_url": row.avatar_url or "/images/avatar.jpg",
            "video_pitch_url": row.video_pitch_url,
            "video_pitch_poster": video_pitch_poster,
            "resume_url": row.resume_url or f"http://localhost:8000/v1/profile/{clean_username}/pdf/",
            "seeking_status": row.seeking_status,
            "employment_status": row.employment_status,
            "job_experiences": jobs,
            "education_experiences": education,
            "skills": skills,
            "languages": languages,
            "interests": interests,
        }

    async def update_candidate_profile(
        self, username: str, payload: ProfileUpdate, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()

        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        update_dict = payload.model_dump(exclude_unset=True)
        if update_dict:
            await self.profile_repo.update_profile(profile.id, **update_dict)
            await self.db.commit()

        return {"message": "Profile updated successfully"}

    async def add_candidate_skill(
        self, username: str, skill_name: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_name = skill_name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Skill name cannot be empty")

        clean_username = username.lower().strip()
        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        await self.profile_repo.add_skill(profile.id, clean_name)
        await self.db.commit()
        return {"message": f"Skill '{clean_name}' added successfully"}

    async def remove_candidate_skill(
        self, username: str, skill_name: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_name = skill_name.strip()

        clean_username = username.lower().strip()
        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        await self.profile_repo.remove_skill(profile.id, clean_name)
        await self.db.commit()
        return {"message": f"Skill '{clean_name}' removed"}
