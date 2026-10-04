"""Candidate profile endpoints (Thin Controller).

Privacy & PII Invariants:
- Privacy Guard: When candidate profile has row.is_hidden and not is_owner, returns 404.
- PII Protection: Sensitive contact details masked as "email": row.email if is_owner else None.
"""

from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, get_current_user_optional
from app.schemas.profile import ProfileUpdate, SkillAdd
from app.services.profile_service import ProfileService

router = APIRouter()


@router.get("/profile/{username}", tags=["Domain 2: Candidate Profile"])
async def get_candidate_public_profile(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    return await service.get_candidate_public_profile(username, current_user)


@router.patch("/profile/{username}", tags=["Domain 2: Candidate Profile"])
async def update_candidate_profile(
    username: str,
    payload: ProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    return await service.update_candidate_profile(username, payload, current_user)


@router.post("/profile/{username}/skills/", tags=["Domain 2: Candidate Profile"])
async def add_candidate_skill(
    username: str,
    payload: SkillAdd,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    return await service.add_candidate_skill(username, payload.name, current_user)


@router.delete("/profile/{username}/skills/{skill_name}/", tags=["Domain 2: Candidate Profile"])
async def remove_candidate_skill(
    username: str,
    skill_name: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    return await service.remove_candidate_skill(username, skill_name, current_user)
