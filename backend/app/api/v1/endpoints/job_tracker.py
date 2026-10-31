"""Candidate Job Applications Tracker (Kanban Board) Controller."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.security import AuthenticatedUser, get_current_user
from app.modules.job_tracker import JobTrackerService
from app.schemas.job_tracker import (
    AiJobMatchRequest,
    AiJobMatchResponse,
    CareerGoalResponse,
    CareerGoalUpsertRequest,
    JobPipelineAnalyticsResponse,
    MarketJobItemDTO,
    TrackedJobCreateRequest,
    TrackedJobStatusUpdateRequest,
    TrackedJobUpdateRequest,
    TrackedJobResponse,
)

router = APIRouter(prefix="/tracker", tags=["Domain 11: Candidate Job Tracker & Kanban"])


@router.get("/jobs/", response_model=List[TrackedJobResponse])
async def list_tracked_jobs(
    q: Optional[str] = Query(None, description="Search by company, position, salary, notes"),
    status: Optional[str] = Query(None, description="Filter by Kanban status"),
    min_score: int = Query(0, ge=0, le=100, description="Minimum ATS match score"),
    sort_by: str = Query("created_at", description="Sort by: created_at | match_score | interview_date"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    """List the authenticated candidate's tracked jobs."""
    candidate_id = current_user.id
    service = JobTrackerService(db)
    return await service.list_tracked_jobs(
        candidate_identity_id=candidate_id, q=q, status_filter=status, min_score=min_score, sort_by=sort_by
    )


@router.get("/search-market-jobs", response_model=List[MarketJobItemDTO])
async def search_market_jobs(
    q: Optional[str] = Query(None, description="Search market jobs by keyword"),
    skills: Optional[str] = Query(None, description="Comma-separated skills filter"),
    location: Optional[str] = Query(None, description="Location filter"),
    db: AsyncSession = Depends(get_read_db),
):
    """Search curated and live market jobs for 1-click Kanban addition."""
    return await JobTrackerService(db).search_market_jobs(q=q, skills=skills, location=location)


@router.get("/goals", response_model=CareerGoalResponse)
async def get_career_goal(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    """Retrieve persisted Career Goal for the candidate."""
    candidate_id = current_user.id
    return await JobTrackerService(db).get_career_goal(candidate_identity_id=candidate_id)


@router.post("/goals", response_model=CareerGoalResponse)
async def save_career_goal(
    request: CareerGoalUpsertRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Persist Career Goal in PostgreSQL so F5 reload retains 100% of goal state."""
    candidate_id = current_user.id
    return await JobTrackerService(db).save_career_goal(request=request, candidate_identity_id=candidate_id)


@router.post("/goals/{goal_id}/ai-match", response_model=AiJobMatchResponse)
async def ai_match_career_goal(
    goal_id: str,
    request: Optional[AiJobMatchRequest] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Paid AI Job Matcher deducting fee from Wallet and populating high-match Kanban cards."""
    candidate_id = current_user.id
    return await JobTrackerService(db).ai_match_goal_jobs(
        goal_id=goal_id, request=request or AiJobMatchRequest(), candidate_identity_id=candidate_id
    )


@router.get("/jobs/analytics", response_model=JobPipelineAnalyticsResponse)
async def get_job_pipeline_analytics(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    """Calculate Kanban funnel velocity, average ATS match score, and offer probability."""
    candidate_id = current_user.id
    service = JobTrackerService(db)
    return await service.get_pipeline_analytics(candidate_identity_id=candidate_id)



@router.post("/jobs/", response_model=TrackedJobResponse, status_code=status.HTTP_201_CREATED)
async def create_tracked_job(
    request: TrackedJobCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new job application to the Kanban tracker."""
    service = JobTrackerService(db)
    return await service.add_tracked_job(request, candidate_identity_id=current_user.id)


@router.patch("/jobs/{job_id}", response_model=TrackedJobResponse)
async def update_tracked_job(
    job_id: uuid.UUID,
    request: TrackedJobUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update details of a tracked job application on the Kanban board."""
    service = JobTrackerService(db)
    return await service.update_tracked_job(
        job_id=job_id,
        request=request,
        candidate_identity_id=current_user.id,
    )


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
