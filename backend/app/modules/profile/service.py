"""Candidate profile service & cross-module facade (Vertical Module: profile).

Enforces privacy guards (is_hidden check), PII masking, biographical updates,
skills/languages/interests taxonomy associations, and exposes clean facade methods.
"""

from typing import Any, Dict, List, Optional
import os
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_candidate_cache, platform_cache
from app.core.security import AuthenticatedUser, verify_profile_owner
from app.modules.profile.repository import ProfileRepository
from app.schemas.profile import ProfileUpdate

profile_cache = platform_cache


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
            profile_id=profile_id, identity_id=identity_id, username=username,
            first_name=first_name, last_name=last_name, headline="Candidate", bio="",
            is_hidden=False, is_fresh=True, submitted=False,
        )

    async def _require_owned(self, username: str, current_user: AuthenticatedUser):
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return profile, clean_username

    # --- Domain 2 Endpoints ---
    async def get_raw_profile_bundle(self, username: str) -> Dict[str, Any]:
        clean_username = username.lower().strip()
        session_key = f"bundle:{clean_username}"
        if session_key in self.db.info:
            return self.db.info[session_key]

        async def _load_bundle() -> Dict[str, Any]:
            row = await self.profile_repo.get_full_profile_bundle(clean_username)
            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Candidate @{username} not found")
            return {
                "id": str(row["id"]),
                "username": row["username"],
                "first_name": row["first_name"],
                "last_name": row["last_name"],
                "full_name": f"{row['first_name']} {row['last_name']}",
                "_raw_email": row["email"],
                "headline": row["headline"],
                "bio": row["bio"],
                "location": row["location"],
                "_raw_phone": row["phone"],
                "avatar_url": row["avatar_url"] or "/images/avatar.jpg",
                "video_pitch_url": row["video_pitch_url"],
                "video_pitch_poster": row["video_pitch_poster"],
                "resume_url": row["resume_url"] or f"{os.getenv('PUBLIC_API_URL', 'http://localhost:8080').rstrip('/')}/v1/profile/{clean_username}/pdf/",
                "seeking_status": row["seeking_status"],
                "employment_status": row["employment_status"],
                "is_hidden": bool(row["is_hidden"]),
                "job_experiences": list(row["jobs_json"] or []),
                "education_experiences": list(row["education_json"] or []),
                "skills": list(row["skills_arr"] or []),
                "languages": list(row["languages_json"] or []),
                "interests": list(row["interests_arr"] or []),
            }

        if os.getenv("ENVIRONMENT") == "testing":
            bundle = await _load_bundle()
        else:
            bundle = await profile_cache.get_or_set(f"pub_profile:{clean_username}", ttl_seconds=30, loader=_load_bundle)
        self.db.info[session_key] = bundle
        return bundle

    async def get_candidate_public_profile(
        self, username: str, current_user: Optional[AuthenticatedUser]
    ) -> Dict[str, Any]:
        clean_username = username.lower().strip()
        is_owner = current_user is not None and (
            current_user.username.lower() == clean_username or current_user.role == "admin"
        )
        bundle = await self.get_raw_profile_bundle(username)
        if bundle.get("is_hidden") and not is_owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Candidate @{username} not found")
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
            bundle = await self.get_raw_profile_bundle(username)
            jobs = bundle.get("job_experiences") or []
            education = bundle.get("education_experiences") or []
            skills = bundle.get("skills") or []
            headline = bundle.get("headline") or ""
            bio = bundle.get("bio") or ""

            has_video = bool(bundle.get("video_pitch_url"))
            video_pts = 35 if has_video else 0
            job_count = len(jobs)
            exp_pts = min(25, job_count * 10 + (5 if any(len(j.get("description") or "") >= 60 for j in jobs) else 0))
            bio_text = f"{headline} {bio}".lower()
            effective_skill_cnt = max(
                len(skills),
                sum(1 for tok in ("go", "python", "react", "postgres", "kubernetes", "aws", "typescript", "java") if tok in bio_text),
            )
            skill_pts = min(20, effective_skill_cnt * 4)
            bio_pts = min(20, (8 if len(bio) >= 40 else 3) + (6 if headline else 0) + (6 if education else 2))
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
                "username": bundle["username"],
                "_is_hidden": bool(bundle.get("is_hidden")),
                "trust_score": total,
                "readiness_tier": tier,
                "recruiter_conversion_multiplier": multiplier,
                "pillars": [
                    {"pillar": "Video Pitch Verification", "score": video_pts, "max_score": 35, "status": "Verified" if has_video else "Missing", "detail": "60s authentic video pitch attached" if has_video else "No video pitch recorded yet"},
                    {"pillar": "Career Timeline Depth", "score": exp_pts, "max_score": 25, "status": "Strong" if exp_pts >= 20 else "Partial", "detail": f"{job_count} verified role(s) on timeline"},
                    {"pillar": "Skill Taxonomy Coverage", "score": skill_pts, "max_score": 20, "status": "Indexed" if skill_pts >= 12 else "Needs Tags", "detail": f"{effective_skill_cnt} searchable domain skills indexed"},
                    {"pillar": "Executive Bio & Academic Proof", "score": bio_pts, "max_score": 20, "status": "Complete" if bio_pts >= 16 else "Basic", "detail": f"{len(education)} education record(s) & narrative summary"},
                ],
                "next_boost_action": next_action,
            }

        data = await profile_cache.get_or_set(f"trust:{clean_username}", ttl_seconds=45, loader=_compute)
        if data.get("_is_hidden") and not is_owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Candidate @{username} not found")
        return data

    async def update_candidate_profile(
        self, username: str, payload: ProfileUpdate, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned(username, current_user)
        update_dict = payload.model_dump(exclude_unset=True)
        if update_dict:
            await self.profile_repo.update_profile(profile.id, **update_dict)
            await self.db.commit()
            await invalidate_candidate_cache(clean_username)
        return {"message": "Profile updated successfully"}

    async def add_candidate_skill(
        self, username: str, skill_name: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        clean_name = skill_name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Skill name cannot be empty")
        profile, clean_username = await self._require_owned(username, current_user)
        await self.profile_repo.add_skill(profile.id, clean_name)
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"message": f"Skill '{clean_name}' added successfully"}

    async def remove_candidate_skill(
        self, username: str, skill_name: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned(username, current_user)
        await self.profile_repo.remove_skill(profile.id, skill_name.strip())
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"message": f"Skill '{skill_name.strip()}' removed"}

    async def add_candidate_language(
        self, username: str, language_name: str, proficiency: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned(username, current_user)
        await self.profile_repo.add_language(profile.id, language_name.strip(), proficiency.strip())
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"message": f"Language '{language_name.strip()}' added", "name": language_name.strip()}

    async def remove_candidate_language(
        self, username: str, language_name: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned(username, current_user)
        await self.profile_repo.remove_language(profile.id, language_name.strip())
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"message": f"Language '{language_name.strip()}' removed"}

    async def add_candidate_interest(
        self, username: str, interest_name: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned(username, current_user)
        await self.profile_repo.add_interest(profile.id, interest_name.strip())
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"message": f"Interest '{interest_name.strip()}' added"}

    async def remove_candidate_interest(
        self, username: str, interest_name: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned(username, current_user)
        await self.profile_repo.remove_interest(profile.id, interest_name.strip())
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"message": f"Interest '{interest_name.strip()}' removed"}
