"""Timeline repository.

Data access layer for JobExperience, EducationExperience, and AwardCertification entities,
including pessimistic row-level locking for reorder operations.
"""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import delete, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import CandidateProfile
from app.models.timeline import AwardCertification, EducationExperience, JobExperience


class TimelineRepository:
    """Repository handling database operations and reordering locks for timeline entries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Job Experiences ---

    async def list_jobs_by_username(self, username: str) -> List[Dict[str, Any]]:
        query = text("""
            SELECT j.id, j.title, j.company_name, j.from_date_month, j.from_date_year,
                   j.currently_work_here, j.to_date_month, j.to_date_year, j.description,
                   j.logo_url, j.display_order
            FROM job_experiences j
            JOIN candidate_profiles p ON p.id = j.profile_id
            WHERE p.username = :username
            ORDER BY j.display_order ASC, j.from_date_year DESC NULLS LAST
        """)
        res = await self.db.execute(query, {"username": username.lower().strip()})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_next_job_order(self, profile_id: uuid.UUID) -> int:
        stmt = select(func.coalesce(func.max(JobExperience.display_order), -1) + 1).where(
            JobExperience.profile_id == profile_id
        )
        res = await self.db.execute(stmt)
        return res.scalar() or 0

    async def create_job(
        self,
        profile_id: uuid.UUID,
        title: str,
        company_name: str,
        from_date_month: Optional[int] = 1,
        from_date_year: Optional[int] = 2022,
        currently_work_here: bool = False,
        to_date_month: Optional[int] = None,
        to_date_year: Optional[int] = None,
        description: Optional[str] = "",
        logo_url: Optional[str] = "/images/logo.svg",
        display_order: int = 0,
    ) -> uuid.UUID:
        item_id = uuid.uuid4()
        job = JobExperience(
            id=item_id,
            profile_id=profile_id,
            title=title,
            company_name=company_name,
            from_date_month=from_date_month,
            from_date_year=from_date_year,
            currently_work_here=currently_work_here,
            to_date_month=to_date_month,
            to_date_year=to_date_year,
            description=description,
            logo_url=logo_url,
            display_order=display_order,
        )
        self.db.add(job)
        await self.db.flush()
        return item_id

    async def delete_job(self, profile_id: uuid.UUID, item_id: uuid.UUID) -> bool:
        stmt = delete(JobExperience).where(
            JobExperience.id == item_id,
            JobExperience.profile_id == profile_id,
        )
        res = await self.db.execute(stmt)
        return res.rowcount > 0

    async def lock_jobs_for_update(self, profile_id: uuid.UUID) -> None:
        stmt = (
            select(JobExperience.id)
            .where(JobExperience.profile_id == profile_id)
            .with_for_update()
        )
        await self.db.execute(stmt)

    async def update_job_order(self, profile_id: uuid.UUID, item_id: uuid.UUID, display_order: int) -> None:
        stmt = (
            update(JobExperience)
            .where(JobExperience.id == item_id, JobExperience.profile_id == profile_id)
            .values(display_order=display_order)
        )
        await self.db.execute(stmt)

    # --- Education Experiences ---

    async def list_education_by_username(self, username: str) -> List[Dict[str, Any]]:
        query = text("""
            SELECT e.id, e.school_name, e.degree_name, e.gpa, e.from_date_month, e.from_date_year,
                   e.currently_work_here, e.to_date_month, e.to_date_year, e.description,
                   e.logo_url, e.display_order
            FROM education_experiences e
            JOIN candidate_profiles p ON p.id = e.profile_id
            WHERE p.username = :username
            ORDER BY e.display_order ASC
        """)
        res = await self.db.execute(query, {"username": username.lower().strip()})
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_next_education_order(self, profile_id: uuid.UUID) -> int:
        stmt = select(func.coalesce(func.max(EducationExperience.display_order), -1) + 1).where(
            EducationExperience.profile_id == profile_id
        )
        res = await self.db.execute(stmt)
        return res.scalar() or 0

    async def create_education(
        self,
        profile_id: uuid.UUID,
        school_name: str,
        degree_name: str,
        gpa: Optional[str] = "3.8",
        from_date_month: Optional[int] = 9,
        from_date_year: Optional[int] = 2018,
        currently_work_here: bool = False,
        to_date_month: Optional[int] = 6,
        to_date_year: Optional[int] = 2022,
        description: Optional[str] = "",
        display_order: int = 0,
    ) -> uuid.UUID:
        item_id = uuid.uuid4()
        edu = EducationExperience(
            id=item_id,
            profile_id=profile_id,
            school_name=school_name,
            degree_name=degree_name,
            gpa=gpa,
            from_date_month=from_date_month,
            from_date_year=from_date_year,
            currently_work_here=currently_work_here,
            to_date_month=to_date_month,
            to_date_year=to_date_year,
            description=description,
            display_order=display_order,
        )
        self.db.add(edu)
        await self.db.flush()
        return item_id

    async def delete_education(self, profile_id: uuid.UUID, item_id: uuid.UUID) -> bool:
        stmt = delete(EducationExperience).where(
            EducationExperience.id == item_id,
            EducationExperience.profile_id == profile_id,
        )
        res = await self.db.execute(stmt)
        return res.rowcount > 0

    async def lock_education_for_update(self, profile_id: uuid.UUID) -> None:
        stmt = (
            select(EducationExperience.id)
            .where(EducationExperience.profile_id == profile_id)
            .with_for_update()
        )
        await self.db.execute(stmt)

    async def update_education_order(self, profile_id: uuid.UUID, item_id: uuid.UUID, display_order: int) -> None:
        stmt = (
            update(EducationExperience)
            .where(EducationExperience.id == item_id, EducationExperience.profile_id == profile_id)
            .values(display_order=display_order)
        )
        await self.db.execute(stmt)
