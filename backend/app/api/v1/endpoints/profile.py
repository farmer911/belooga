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
from app.schemas.profile import (
    InterestAdd,
    LanguageAdd,
    ProfileResponse,
    ProfileTrustScoreResponse,
    ProfileUpdate,
    SkillAdd,
    SkillResponse,
)
from app.modules.profile import ProfileService

router = APIRouter()


@router.get("/profile/{username}", response_model=ProfileResponse, tags=["Domain 2: Candidate Profile"])
async def get_candidate_public_profile(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).get_candidate_public_profile(username, current_user)


@router.get("/profile/{username}/trust-score", response_model=ProfileTrustScoreResponse, tags=["Domain 2: Candidate Profile"])
async def get_candidate_trust_score(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).get_candidate_trust_score(username, current_user)


@router.patch("/profile/{username}", response_model=SkillResponse, tags=["Domain 2: Candidate Profile"])
async def update_candidate_profile(
    username: str,
    payload: ProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).update_candidate_profile(username, payload, current_user)


@router.post("/profile/{username}/skills/", response_model=SkillResponse, tags=["Domain 2: Candidate Profile"])
async def add_candidate_skill(
    username: str,
    payload: SkillAdd,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).add_candidate_skill(username, payload.name, current_user)


@router.delete("/profile/{username}/skills/{skill_name}/", response_model=SkillResponse, tags=["Domain 2: Candidate Profile"])
async def remove_candidate_skill(
    username: str,
    skill_name: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).remove_candidate_skill(username, skill_name, current_user)


@router.post("/profile/{username}/languages/", response_model=SkillResponse, tags=["Domain 2: Candidate Profile"])
async def add_candidate_language(
    username: str,
    payload: LanguageAdd,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).add_candidate_language(
        username, payload.name, payload.proficiency, current_user
    )


@router.delete("/profile/{username}/languages/{language_name}/", response_model=SkillResponse, tags=["Domain 2: Candidate Profile"])
async def remove_candidate_language(
    username: str,
    language_name: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).remove_candidate_language(username, language_name, current_user)


@router.post("/profile/{username}/interests/", response_model=SkillResponse, tags=["Domain 2: Candidate Profile"])
async def add_candidate_interest(
    username: str,
    payload: InterestAdd,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).add_candidate_interest(username, payload.name, current_user)


@router.delete("/profile/{username}/interests/{interest_name}/", response_model=SkillResponse, tags=["Domain 2: Candidate Profile"])
async def remove_candidate_interest(
    username: str,
    interest_name: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).remove_candidate_interest(username, interest_name, current_user)
