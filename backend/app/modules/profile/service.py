"""Candidate profile service & cross-module facade (Vertical Module: profile).

Enforces privacy guards (is_hidden check), PII masking, biographical updates,
skills taxonomy associations, and exposes clean facade methods for sibling modules.
"""

from typing import Any, Dict, List, Optional
import os
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import AsyncTieredCache
from app.core.security import AuthenticatedUser, verify_profile_owner
from app.modules.profile.repository import ProfileRepository
from app.schemas.profile import ProfileUpdate

profile_cache = AsyncTieredCache(namespace="profile", l1_max_size=1024)


class ProfileService:
    """Service & Facade layer managing candidate profiles and privacy boundaries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_repo = ProfileRepository(db)

    # --- Cross-Module Public Facade Methods (for auth, timeline, media) ---
    async def get_by_username(self, username: str):
        return await self.profile_repo.get_by_username(username)

    async def get_profile_with_identity(self, username: str):
        return await self.profile_repo.get_profile_with_identity(username)

    async def get_skills(self, profile_id: uuid.UUID) -> List[str]:
        return await self.profile_repo.get_skills(profile_id)

    async def get_jobs(self, profile_id: uuid.UUID) -> List[Dict[str, Any]]:
        return await self.profile_repo.get_jobs(profile_id)

    async def get_education(self, profile_id: uuid.UUID) -> List[Dict[str, Any]]:
        return await self.profile_repo.get_education(profile_id)

    async def create_initial_profile(
        self,
        profile_id: uuid.UUID,
        identity_id: uuid.UUID,
        username: str,
        first_name: str,
        last_name: str,
    ):
        return await self.profile_repo.create_profile(
            profile_id=profile_id,
            identity_id=identity_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
            headline="Candidate",
            bio="",
            is_hidden=False,
            is_fresh=True,
            submitted=False,
        )

    # --- Domain 2 Endpoints ---
    async def get_candidate_public_profile(
        self, username: str, current_user: Optional[AuthenticatedUser]
    ) -> Dict[str, Any]:
        clean_username = username.lower().strip()
        is_owner = current_user is not None and (
            current_user.username.lower() == clean_username or current_user.role == "admin"
        )

        async def _load_bundle() -> Dict[str, Any]:
            row = await self.profile_repo.get_profile_with_identity(clean_username)
            if not row:
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
                "_raw_email": row.email,
                "headline": row.headline,
                "bio": row.bio,
                "location": row.location,
                "_raw_phone": row.phone,
                "avatar_url": row.avatar_url or "/images/avatar.jpg",
                "video_pitch_url": row.video_pitch_url,
                "video_pitch_poster": video_pitch_poster,
                "resume_url": row.resume_url or f"http://localhost:8000/v1/profile/{clean_username}/pdf/",
                "seeking_status": row.seeking_status,
                "employment_status": row.employment_status,
                "is_hidden": bool(row.is_hidden),
                "job_experiences": jobs,
                "education_experiences": education,
                "skills": skills,
                "languages": languages,
                "interests": interests,
            }

        if os.getenv("ENVIRONMENT") == "testing":
            bundle = await _load_bundle()
        else:
            bundle = await profile_cache.get_or_set(
                f"pub_profile:{clean_username}", ttl_seconds=30, loader=_load_bundle
            )

        if bundle.get("is_hidden") and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate @{username} not found",
            )

        return {
            **bundle,
            "email": bundle.get("_raw_email") if is_owner else None,
            "phone": bundle.get("_raw_phone") if is_owner else None,
        }

    async def get_candidate_trust_score(
        self, username: str, current_user: Optional[AuthenticatedUser]
    ) -> Dict[str, Any]:
        clean_username = username.lower().strip()
        is_owner = current_user is not None and (
            current_user.username.lower() == clean_username or current_user.role == "admin"
        )

        async def _compute() -> Dict[str, Any]:
            row = await self.profile_repo.get_profile_with_identity(clean_username)
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Candidate @{username} not found",
                )
            profile_id = row.id
            jobs = await self.profile_repo.get_jobs(profile_id)
            education = await self.profile_repo.get_education(profile_id)
            skills = await self.profile_repo.get_skills(profile_id)

            has_video = bool(row.video_pitch_url)
            video_pts = 35 if has_video else 0

            job_count = len(jobs)
            exp_pts = min(25, job_count * 10 + (5 if any(len(j.get("description") or "") >= 60 for j in jobs) else 0))

            bio_text = f"{row.headline or ''} {row.bio or ''}"
            effective_skill_cnt = max(
                len(skills),
                sum(1 for tok in ("go", "python", "react", "postgres", "kubernetes", "aws", "typescript", "java") if tok in bio_text.lower()),
            )
            skill_pts = min(20, effective_skill_cnt * 4)

            bio_pts = min(20, (8 if len(row.bio or "") >= 40 else 3) + (6 if row.headline else 0) + (6 if education else 2))
            total = min(100, video_pts + exp_pts + skill_pts + bio_pts)
            tier = (
                "Platinum Verified" if total >= 85
                else "Gold Verified" if total >= 65
                else "Silver Rising" if total >= 45
                else "Starter Profile"
            )
            multiplier = round(1.0 + (1.4 if has_video else 0.0) + (total / 100.0) * 1.3, 2)
            next_action = (
                "Record a 60s Video Pitch to unlock +35 Trust Points and 2.4x recruiter shortlist conversion."
                if not has_video
                else "Add quantified work experience milestones to reach Platinum Verified status."
                if job_count < 2
                else "Tag at least 5 core technical skills to maximize ATS and recruiter search ranking."
                if len(skills) < 5
                else "Profile is recruiter-ready. Keep seeking status updated for priority shortlist placement."
            )

            return {
                "username": row.username,
                "_is_hidden": bool(row.is_hidden),
                "trust_score": total,
                "readiness_tier": tier,
                "recruiter_conversion_multiplier": multiplier,
                "pillars": [
                    {
                        "pillar": "Video Pitch Verification",
                        "score": video_pts,
                        "max_score": 35,
                        "status": "Verified" if has_video else "Missing",
                        "detail": "60s authentic video pitch attached" if has_video else "No video pitch recorded yet",
                    },
                    {
                        "pillar": "Career Timeline Depth",
                        "score": exp_pts,
                        "max_score": 25,
                        "status": "Strong" if exp_pts >= 20 else "Partial",
                        "detail": f"{job_count} verified role(s) on timeline",
                    },
                    {
                        "pillar": "Skill Taxonomy Coverage",
                        "score": skill_pts,
                        "max_score": 20,
                        "status": "Indexed" if skill_pts >= 12 else "Needs Tags",
                        "detail": f"{effective_skill_cnt} searchable domain skills indexed",
                    },
                    {
                        "pillar": "Executive Bio & Academic Proof",
                        "score": bio_pts,
                        "max_score": 20,
                        "status": "Complete" if bio_pts >= 16 else "Basic",
                        "detail": f"{len(education)} education record(s) & narrative summary",
                    },
                ],
                "next_boost_action": next_action,
            }

        data = await profile_cache.get_or_set(f"trust:{clean_username}", ttl_seconds=45, loader=_compute)
        if data.get("_is_hidden") and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate @{username} not found",
            )
        return data

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
            await profile_cache.invalidate_prefix(f"pub_profile:{clean_username}")
            await profile_cache.invalidate_prefix(f"trust:{clean_username}")
            await profile_cache.invalidate_prefix(f"trajectory:{clean_username}")

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
        await profile_cache.invalidate_prefix(f"pub_profile:{clean_username}")
        await profile_cache.invalidate_prefix(f"trust:{clean_username}")
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
        await profile_cache.invalidate_prefix(f"pub_profile:{clean_username}")
        await profile_cache.invalidate_prefix(f"trust:{clean_username}")
        return {"message": f"Skill '{clean_name}' removed"}
