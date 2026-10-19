"""Timeline and career experience endpoints (Thin Controller).

Transaction Invariants:
- Pessimistic Concurrency: Row-level SELECT ... FOR UPDATE locking in TimelineRepository
  prevents race conditions during drag-and-drop reordering without manual transaction conflict.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.timeline import (
    EducationExperienceCreate,
    EducationResponse,
    JobExperienceCreate,
    JobExperienceResponse,
    ReorderRequest,
)
from app.services.timeline_service import TimelineService

router = APIRouter()


# --- Job Experiences ---

@router.get("/profile/{username}/job-experiences/", response_model=List[JobExperienceResponse], tags=["Domain 3: Timeline CRUD & Reordering"])
async def list_job_experiences(username: str, db: AsyncSession = Depends(get_db)):
    return await TimelineService(db).list_job_experiences(username)


@router.post("/profile/{username}/job-experiences/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, tags=["Domain 3: Timeline CRUD & Reordering"])
async def create_job_experience(
    username: str,
    payload: JobExperienceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).create_job_experience(username, payload, current_user)


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
async def list_education_experiences(username: str, db: AsyncSession = Depends(get_db)):
    return await TimelineService(db).list_education_experiences(username)


@router.post("/profile/{username}/education/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, tags=["Domain 3: Timeline CRUD & Reordering"])
async def create_education(
    username: str,
    payload: EducationExperienceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TimelineService(db).create_education(username, payload, current_user)


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
