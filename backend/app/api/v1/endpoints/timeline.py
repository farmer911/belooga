"""Timeline and career experience endpoints (Thin Controller).

Transaction Invariants:
- Pessimistic Concurrency: Row-level SELECT ... FOR UPDATE locking in TimelineRepository
  prevents race conditions during drag-and-drop reordering without manual transaction conflict.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, get_current_user_optional
from app.schemas.timeline import (
    AwardCertificationCreate,
    AwardCertificationResponse,
    AwardOrderList,
    AwardResponse,
    AwardUpdate,
    CareerTrajectoryResponse,
    EducationExperienceCreate,
    EducationResponse,
    EducationUpdate,
    JobExperienceCreate,
    JobExperienceResponse,
    JobExperienceUpdate,
    MessageResponse,
    ReorderRequest,
)
from app.modules.timeline import TimelineService

router = APIRouter()


@router.get("/profile/{username}/career-trajectory", response_model=CareerTrajectoryResponse, tags=["Domain 3: Timeline CRUD & Reordering"])
async def get_candidate_career_trajectory(username: str, db: AsyncSession = Depends(get_db)):
    """Compute candidate seniority level, trajectory velocity, and promotion readiness score."""
    return await TimelineService(db).get_career_trajectory(username)


# --- Job Experiences ---

@router.get("/profile/{username}/job-experiences/", response_model=List[JobExperienceResponse], tags=["Domain 3: Timeline CRUD & Reordering"])
async def list_job_experiences(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).list_job_experiences(username, current_user)


@router.post("/profile/{username}/job-experiences/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, tags=["Domain 3: Timeline CRUD & Reordering"])
async def create_job_experience(
    username: str,
    payload: JobExperienceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).create_job_experience(username, payload, current_user)


@router.patch("/profile/{username}/job-experiences/{item_id}/", response_model=Dict[str, str], tags=["Domain 3: Timeline CRUD & Reordering"])
async def update_job_experience(
    username: str,
    item_id: str,
    payload: JobExperienceUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).update_job_experience(username, item_id, payload, current_user)


@router.delete("/profile/{username}/job-experiences/{item_id}/", response_model=Dict[str, str], tags=["Domain 3: Timeline CRUD & Reordering"])
async def delete_job_experience(
    username: str,
    item_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).delete_job_experience(username, item_id, current_user)


@router.post("/profile/{username}/job-experiences/order/", response_model=Dict[str, str], tags=["Domain 3: Timeline CRUD & Reordering"])
async def reorder_job_experiences(
    username: str,
    payload: ReorderRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).reorder_job_experiences(username, payload, current_user)


# --- Education Experiences ---

@router.get("/profile/{username}/education/", response_model=List[EducationResponse], tags=["Domain 3: Timeline CRUD & Reordering"])
async def list_education_experiences(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).list_education_experiences(username, current_user)


@router.post("/profile/{username}/education/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, tags=["Domain 3: Timeline CRUD & Reordering"])
async def create_education(
    username: str,
    payload: EducationExperienceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).create_education(username, payload, current_user)


@router.patch("/profile/{username}/education/{item_id}/", response_model=Dict[str, str], tags=["Domain 3: Timeline CRUD & Reordering"])
async def update_education(
    username: str,
    item_id: str,
    payload: EducationUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).update_education(username, item_id, payload, current_user)


@router.delete("/profile/{username}/education/{item_id}/", response_model=Dict[str, str], tags=["Domain 3: Timeline CRUD & Reordering"])
async def delete_education(
    username: str,
    item_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).delete_education(username, item_id, current_user)


@router.post("/profile/{username}/education/order/", response_model=Dict[str, str], tags=["Domain 3: Timeline CRUD & Reordering"])
async def reorder_education_experiences(
    username: str,
    payload: ReorderRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).reorder_education_experiences(username, payload, current_user)


# --- Awards & Certifications ---

@router.get("/profile/{username}/awards/", response_model=List[AwardCertificationResponse], tags=["Domain 3: Timeline CRUD & Reordering"])
async def list_awards(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).list_awards(username, current_user)


@router.post("/profile/{username}/awards/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, tags=["Domain 3: Timeline CRUD & Reordering"])
async def create_award(
    username: str,
    payload: AwardCertificationCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).create_award(username, payload, current_user)


@router.patch("/profile/{username}/awards/{item_id}/", response_model=AwardResponse, tags=["Domain 3: Timeline CRUD & Reordering"])
async def update_award(
    username: str,
    item_id: str,
    payload: AwardUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).update_award(username, item_id, payload, current_user)


@router.delete("/profile/{username}/awards/{item_id}/", response_model=Dict[str, str], tags=["Domain 3: Timeline CRUD & Reordering"])
async def delete_award(
    username: str,
    item_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).delete_award(username, item_id, current_user)


@router.post("/profile/{username}/awards/order/", response_model=MessageResponse, tags=["Domain 3: Timeline CRUD & Reordering"])
async def reorder_awards(
    username: str,
    payload: AwardOrderList,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).reorder_awards(username, payload, current_user)
