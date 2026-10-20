"""Timeline service (Vertical Module: timeline).

Business domain service managing work history, academic credentials,
and pessimistic row-locking atomic reordering.
Communicates with the `profile` module strictly via its public facade (`ProfileService`).
"""

from typing import Any, Dict, List
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_candidate_cache, platform_cache
from app.core.security import AuthenticatedUser, verify_profile_owner
from app.modules.profile import ProfileService
from app.modules.timeline.repository import TimelineRepository
from app.schemas.timeline import (
    CareerTrajectoryResponse,
    EducationExperienceCreate,
    JobExperienceCreate,
    ReorderRequest,
)


class TimelineService:
    """Service layer managing timeline experiences and atomic display order locks."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_facade = ProfileService(db)
        self.timeline_repo = TimelineRepository(db)

    async def _require_owned_profile(self, username: str, current_user: AuthenticatedUser):
        verify_profile_owner(current_user, username)
        profile = await self.profile_facade.get_by_username(username.lower().strip())
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return profile

    @staticmethod
    def _parse_item_uuid(item_id: str, not_found_detail: str) -> uuid.UUID:
        try:
            return uuid.UUID(str(item_id))
        except ValueError:
            raise HTTPException(status_code=404, detail=not_found_detail)

    async def list_job_experiences(self, username: str) -> List[Dict[str, Any]]:
        return await self.timeline_repo.list_jobs_by_username(username)

    async def create_job_experience(
        self, username: str, payload: JobExperienceCreate, current_user: AuthenticatedUser
    ) -> Dict[str, Any]:
        profile = await self._require_owned_profile(username, current_user)
        next_order = await self.timeline_repo.get_next_job_order(profile.id)
        item_id = await self.timeline_repo.create_job(
            profile_id=profile.id,
            title=payload.title,
            company_name=payload.company_name,
            from_date_month=payload.from_date_month,
            from_date_year=payload.from_date_year,
            currently_work_here=payload.currently_work_here,
            to_date_month=payload.to_date_month,
            to_date_year=payload.to_date_year,
            description=payload.description,
            logo_url=payload.logo_url,
            display_order=next_order,
        )
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"id": str(item_id), "display_order": next_order, "message": "Job experience added"}

    async def delete_job_experience(
        self, username: str, item_id: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile = await self._require_owned_profile(username, current_user)
        detail = "Job experience not found on this profile"
        target_uuid = self._parse_item_uuid(item_id, detail)
        if not await self.timeline_repo.delete_job(profile.id, target_uuid):
            raise HTTPException(status_code=404, detail=detail)
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"message": "Job experience deleted"}

    async def reorder_job_experiences(
        self, username: str, payload: ReorderRequest, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        try:
            profile = await self.profile_facade.get_by_username(username.lower().strip())
            if not profile:
                raise HTTPException(status_code=404, detail="Candidate not found")
            await self.timeline_repo.lock_jobs_for_update(profile.id)
            for item in payload.orders:
                await self.timeline_repo.update_job_order(profile.id, uuid.UUID(str(item.id)), item.order)
            await self.db.commit()
            await invalidate_candidate_cache(username)
        except Exception:
            await self.db.rollback()
            raise
        return {"message": "Job experiences reordered successfully"}

    async def list_education_experiences(self, username: str) -> List[Dict[str, Any]]:
        return await self.timeline_repo.list_education_by_username(username)

    async def create_education(
        self, username: str, payload: EducationExperienceCreate, current_user: AuthenticatedUser
    ) -> Dict[str, Any]:
        profile = await self._require_owned_profile(username, current_user)
        next_order = await self.timeline_repo.get_next_education_order(profile.id)
        item_id = await self.timeline_repo.create_education(
            profile_id=profile.id,
            school_name=payload.school_name,
            degree_name=payload.degree_name,
            gpa=payload.gpa,
            from_date_month=payload.from_date_month,
            from_date_year=payload.from_date_year,
            currently_work_here=payload.currently_work_here,
            to_date_month=payload.to_date_month,
            to_date_year=payload.to_date_year,
            description=payload.description,
            display_order=next_order,
        )
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"id": str(item_id), "display_order": next_order, "message": "Education added successfully"}

    async def delete_education(
        self, username: str, item_id: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile = await self._require_owned_profile(username, current_user)
        detail = "Education experience not found on this profile"
        target_uuid = self._parse_item_uuid(item_id, detail)
        if not await self.timeline_repo.delete_education(profile.id, target_uuid):
            raise HTTPException(status_code=404, detail=detail)
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"message": "Education experience deleted"}

    async def reorder_education_experiences(
        self, username: str, payload: ReorderRequest, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        try:
            profile = await self.profile_facade.get_by_username(username.lower().strip())
            if not profile:
                raise HTTPException(status_code=404, detail="Candidate not found")
            await self.timeline_repo.lock_education_for_update(profile.id)
            for item in payload.orders:
                await self.timeline_repo.update_education_order(profile.id, uuid.UUID(str(item.id)), item.order)
            await self.db.commit()
            await invalidate_candidate_cache(username)
        except Exception:
            await self.db.rollback()
            raise
        return {"message": "Education experiences reordered successfully"}

    async def get_career_trajectory(self, username: str) -> CareerTrajectoryResponse:
        uname = username.lower().strip()

        async def _compute() -> Dict[str, Any]:
            profile = await self.profile_facade.get_by_username(uname)
            if not profile or bool(getattr(profile, "is_hidden", False)):
                raise HTTPException(status_code=404, detail="Candidate not found")
            jobs = await self.timeline_repo.list_jobs_by_username(uname)
            edus = await self.timeline_repo.list_education_by_username(uname)
            text_blob = f"{profile.headline or ''} {profile.bio or ''}".lower()
            if any(k in text_blob for k in ("principal", "staff", "architect", "director", "vp", "cto")):
                cur_lvl, nxt_lvl = "Staff / Principal", "Distinguished / VP Engineering"
            elif any(k in text_blob for k in ("senior", "lead", "sr.", "manager")):
                cur_lvl, nxt_lvl = "Senior", "Staff / Principal"
            elif any(k in text_blob for k in ("junior", "intern", "fresher")):
                cur_lvl, nxt_lvl = "Junior", "Mid-Level"
            else:
                cur_lvl, nxt_lvl = "Mid-Level", "Senior"

            exp_count = len(jobs)
            tenure = round(max(1.5, exp_count * 1.8 + (2.0 if "senior" in text_blob or "staff" in text_blob else 0.5)), 1)
            readiness = min(96, 58 + exp_count * 8 + (10 if edus else 0) + (12 if getattr(profile, "video_pitch_url", None) else 0))
            velocity = "Accelerated Fast-Track" if readiness >= 75 else "Steady Progression"
            return CareerTrajectoryResponse(
                username=profile.username,
                current_inferred_level=cur_lvl,
                next_target_level=nxt_lvl,
                promotion_readiness_pct=readiness,
                total_experience_entries=exp_count,
                estimated_tenure_years=tenure,
                trajectory_velocity=velocity,
                key_promotion_gaps=[
                    f"Bổ sung chỉ số định lượng (SLA, RPS, Cost Saving) cho cột mốc tiến lên {nxt_lvl}.",
                    "Hoàn thiện Video Pitch 60s nêu rõ kiến trúc hệ thống hoặc phạm vi dẫn dắt đội ngũ.",
                ],
            ).model_dump()

        cached = await platform_cache.get_or_set(f"trajectory:{uname}", ttl_seconds=60, loader=_compute)
        return CareerTrajectoryResponse(**cached)
