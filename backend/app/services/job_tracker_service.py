"""Service Layer for Domain 11: Candidate Job Applications Tracker (Kanban)."""

import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_tracker_repo import JobTrackerRepository
from app.schemas.job_tracker import TrackedJobCreateRequest, TrackedJobResponse
from app.models.job_tracker import CandidateJobApplicationTracker

VALID_STATUSES = {"TARGETING", "TAILORED", "APPLIED", "INTERVIEW", "OFFER"}


class JobTrackerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = JobTrackerRepository(db)

    async def list_tracked_jobs(self, candidate_identity_id: Optional[uuid.UUID] = None) -> List[TrackedJobResponse]:
        jobs = await self.repo.list_jobs(candidate_identity_id)
        return [TrackedJobResponse.model_validate(j) for j in jobs]

    async def add_tracked_job(
        self,
        request: TrackedJobCreateRequest,
        candidate_identity_id: Optional[uuid.UUID] = None
    ) -> TrackedJobResponse:
        status_val = request.status.upper()
        if status_val not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{request.status}'. Allowed: {', '.join(VALID_STATUSES)}"
            )

        job = await self.repo.create_job(
            company_name=request.company_name,
            position_title=request.position_title,
            status=status_val,
            expected_salary=request.expected_salary,
            match_score=request.match_score,
            interview_date=request.interview_date,
            notes=request.notes,
            candidate_identity_id=candidate_identity_id,
        )
        return TrackedJobResponse.model_validate(job)

    async def move_job_status(
        self,
        job_id: uuid.UUID,
        new_status: str,
        candidate_identity_id: Optional[uuid.UUID] = None
    ) -> TrackedJobResponse:
        status_val = new_status.upper()
        if status_val not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{new_status}'. Allowed: {', '.join(VALID_STATUSES)}"
            )

        job = await self.repo.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracked job not found.")

        # IDOR check
        if candidate_identity_id and job.candidate_identity_id and job.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not own this tracked job.")

        updated = await self.repo.update_status(job, status_val)
        return TrackedJobResponse.model_validate(updated)

    async def remove_job(self, job_id: uuid.UUID, candidate_identity_id: Optional[uuid.UUID] = None) -> None:
        job = await self.repo.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracked job not found.")

        # IDOR check
        if candidate_identity_id and job.candidate_identity_id and job.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not own this tracked job.")

        await self.repo.delete_job(job)
