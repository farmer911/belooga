"""Candidate Job Applications Tracker (Kanban Board) Controller."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, get_current_user_optional
from app.schemas.job_tracker import (
    TrackedJobCreateRequest,
    TrackedJobStatusUpdateRequest,
    TrackedJobResponse,
)
from app.services.job_tracker_service import JobTrackerService

router = APIRouter(prefix="/tracker", tags=["Domain 11: Candidate Job Tracker & Kanban"])


@router.get("/jobs/", response_model=List[TrackedJobResponse])
async def list_tracked_jobs(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """List all tracked jobs for the current candidate or guest session."""
    candidate_id = current_user.id if current_user else None
    service = JobTrackerService(db)
    return await service.list_tracked_jobs(candidate_identity_id=candidate_id)


@router.post("/jobs/", response_model=TrackedJobResponse, status_code=status.HTTP_201_CREATED)
async def create_tracked_job(
    request: TrackedJobCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new job application to the Kanban tracker."""
    service = JobTrackerService(db)
    return await service.add_tracked_job(request, candidate_identity_id=current_user.id)


@router.patch("/jobs/{job_id}/status", response_model=TrackedJobResponse)
async def update_job_status(
    job_id: uuid.UUID,
    request: TrackedJobStatusUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Move a job application between Kanban columns (TARGETING -> TAILORED -> APPLIED -> INTERVIEW -> OFFER)."""
    service = JobTrackerService(db)
    return await service.move_job_status(
        job_id=job_id,
        new_status=request.status,
        candidate_identity_id=current_user.id,
    )


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_tracked_job(
    job_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a job application from the Kanban tracker."""
    service = JobTrackerService(db)
    await service.remove_job(job_id=job_id, candidate_identity_id=current_user.id)
    return None
