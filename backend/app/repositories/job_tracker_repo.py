"""Repository Layer for Domain 11: Candidate Job Applications Tracker (Kanban)."""

import uuid
from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_tracker import CandidateJobApplicationTracker


class JobTrackerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_jobs(self, candidate_identity_id: Optional[uuid.UUID] = None) -> List[CandidateJobApplicationTracker]:
        query = select(CandidateJobApplicationTracker)
        if candidate_identity_id:
            query = query.where(CandidateJobApplicationTracker.candidate_identity_id == candidate_identity_id)
        query = query.order_by(CandidateJobApplicationTracker.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_job_by_id(self, job_id: uuid.UUID) -> Optional[CandidateJobApplicationTracker]:
        query = select(CandidateJobApplicationTracker).where(CandidateJobApplicationTracker.id == job_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_job(
        self,
        company_name: str,
        position_title: str,
        status: str = "TARGETING",
        expected_salary: Optional[str] = None,
        match_score: int = 0,
        interview_date: Optional[object] = None,
        notes: Optional[str] = None,
        candidate_identity_id: Optional[uuid.UUID] = None,
    ) -> CandidateJobApplicationTracker:
        job = CandidateJobApplicationTracker(
            company_name=company_name,
            position_title=position_title,
            status=status,
            expected_salary=expected_salary,
            match_score=match_score,
            interview_date=interview_date,
            notes=notes,
            candidate_identity_id=candidate_identity_id,
        )
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def update_status(self, job: CandidateJobApplicationTracker, new_status: str) -> CandidateJobApplicationTracker:
        job.status = new_status
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def delete_job(self, job: CandidateJobApplicationTracker) -> None:
        await self.db.delete(job)
        await self.db.commit()
