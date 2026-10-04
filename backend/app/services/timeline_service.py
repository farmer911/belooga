"""Timeline service.

Business domain service managing work history, academic credentials,
and pessimistic row-locking atomic reordering.
"""

from typing import Any, Dict, List
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, verify_profile_owner
from app.repositories.profile_repo import ProfileRepository
from app.repositories.timeline_repo import TimelineRepository
from app.schemas.timeline import (
    EducationExperienceCreate,
    JobExperienceCreate,
    ReorderRequest,
)


class TimelineService:
    """Service layer managing timeline experiences and atomic display order locks."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_repo = ProfileRepository(db)
        self.timeline_repo = TimelineRepository(db)

    # --- Job Experiences ---

    async def list_job_experiences(self, username: str) -> List[Dict[str, Any]]:
        return await self.timeline_repo.list_jobs_by_username(username)

    async def create_job_experience(
        self, username: str, payload: JobExperienceCreate, current_user: AuthenticatedUser
    ) -> Dict[str, Any]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()

        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

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
        return {"id": str(item_id), "display_order": next_order, "message": "Job experience added"}

    async def delete_job_experience(
        self, username: str, item_id: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()

        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        try:
            target_uuid = uuid.UUID(str(item_id))
        except ValueError:
            raise HTTPException(status_code=404, detail="Job experience not found on this profile")

        deleted = await self.timeline_repo.delete_job(profile.id, target_uuid)
        if not deleted:
            raise HTTPException(status_code=404, detail="Job experience not found on this profile")

        await self.db.commit()
        return {"message": "Job experience deleted"}

    async def reorder_job_experiences(
        self, username: str, payload: ReorderRequest, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()

        try:
            profile = await self.profile_repo.get_by_username(clean_username)
            if not profile:
                raise HTTPException(status_code=404, detail="Candidate not found")

            await self.timeline_repo.lock_jobs_for_update(profile.id)

            for item in payload.orders:
                target_uuid = uuid.UUID(str(item.id))
                await self.timeline_repo.update_job_order(profile.id, target_uuid, item.order)

            await self.db.commit()
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        return {"message": "Job experiences reordered successfully"}

    # --- Education Experiences ---

    async def list_education_experiences(self, username: str) -> List[Dict[str, Any]]:
        return await self.timeline_repo.list_education_by_username(username)

    async def create_education(
        self, username: str, payload: EducationExperienceCreate, current_user: AuthenticatedUser
    ) -> Dict[str, Any]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()

        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

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
        return {"id": str(item_id), "display_order": next_order, "message": "Education added successfully"}

    async def delete_education(
        self, username: str, item_id: str, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()

        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        try:
            target_uuid = uuid.UUID(str(item_id))
        except ValueError:
            raise HTTPException(status_code=404, detail="Education experience not found on this profile")

        deleted = await self.timeline_repo.delete_education(profile.id, target_uuid)
        if not deleted:
            raise HTTPException(status_code=404, detail="Education experience not found on this profile")

        await self.db.commit()
        return {"message": "Education experience deleted"}

    async def reorder_education_experiences(
        self, username: str, payload: ReorderRequest, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()

        try:
            profile = await self.profile_repo.get_by_username(clean_username)
            if not profile:
                raise HTTPException(status_code=404, detail="Candidate not found")

            await self.timeline_repo.lock_education_for_update(profile.id)

            for item in payload.orders:
                target_uuid = uuid.UUID(str(item.id))
                await self.timeline_repo.update_education_order(profile.id, target_uuid, item.order)

            await self.db.commit()
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        return {"message": "Education experiences reordered successfully"}
