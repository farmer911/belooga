"""Service Layer for Domain 11: Candidate Job Applications Tracker (Kanban)."""

import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.repositories.job_tracker_repo import JobTrackerRepository
from app.schemas.job_tracker import (
    JobPipelineAnalyticsResponse,
    TrackedJobCreateRequest,
    TrackedJobResponse,
)

VALID_STATUSES = {"TARGETING", "TAILORED", "APPLIED", "INTERVIEW", "OFFER"}


class JobTrackerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = JobTrackerRepository(db)

    async def list_tracked_jobs(self, candidate_identity_id: Optional[uuid.UUID] = None) -> List[TrackedJobResponse]:
        jobs = await self.repo.list_jobs(candidate_identity_id)
        return [TrackedJobResponse.model_validate(j) for j in jobs]

    async def get_pipeline_analytics(
        self, candidate_identity_id: Optional[uuid.UUID] = None
    ) -> JobPipelineAnalyticsResponse:
        cache_key = f"tracker_analytics:{candidate_identity_id or 'anon'}"

        async def _compute() -> dict:
            jobs = await self.repo.list_jobs(candidate_identity_id)
            counts = {s: 0 for s in VALID_STATUSES}
            for j in jobs:
                st = (j.status or "TARGETING").upper()
                if st in counts:
                    counts[st] += 1

            total = len(jobs)
            avg_score = round(sum(j.match_score or 0 for j in jobs) / max(total, 1), 1) if total > 0 else 78.0
            offer_prob = min(
                98.0,
                round(
                    (counts["OFFER"] * 45.0)
                    + (counts["INTERVIEW"] * 22.0)
                    + (counts["APPLIED"] * 8.0)
                    + (counts["TAILORED"] * 4.0)
                    + (avg_score * 0.25 if total > 0 else 18.0),
                    1,
                ),
            )
            if counts["OFFER"] > 0 or counts["INTERVIEW"] >= 2:
                velocity = "HIGH_MOMENTUM"
                action = "Prepare STAR behavioral metrics and salary negotiation script for active interviews."
            elif counts["TARGETING"] + counts["TAILORED"] > counts["APPLIED"]:
                velocity = "NEEDS_OUTREACH"
                action = "Convert tailored CVs into submitted applications and attach your 60s Video Pitch."
            else:
                velocity = "STEADY_PIPELINE"
                action = "Scan 3 more target JDs in ATS Diagnostics to expand your high-match interview funnel."

            return JobPipelineAnalyticsResponse(
                total_tracked=total,
                stage_counts=counts,
                average_ats_match_score=avg_score,
                estimated_offer_probability_pct=offer_prob,
                pipeline_velocity_status=velocity,
                next_recommended_action=action,
            ).model_dump()

        cached = await platform_cache.get_or_set(cache_key, ttl_seconds=15, loader=_compute)
        return JobPipelineAnalyticsResponse(**cached)

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
        await platform_cache.invalidate_prefix("tracker_analytics:")
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
        await platform_cache.invalidate_prefix("tracker_analytics:")
        return TrackedJobResponse.model_validate(updated)

    async def remove_job(self, job_id: uuid.UUID, candidate_identity_id: Optional[uuid.UUID] = None) -> None:
        job = await self.repo.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracked job not found.")

        # IDOR check
        if candidate_identity_id and job.candidate_identity_id and job.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not own this tracked job.")

        await self.repo.delete_job(job)
        await platform_cache.invalidate_prefix("tracker_analytics:")


