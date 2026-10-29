"""Thin Controller for Domain 9: Expert CV Review & Monetization."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user
from app.modules.expert_review import ExpertLeaderboardService, ExpertReviewService
from app.schemas.expert_review import (
    CVReviewFeedbackResponse,
    CVReviewFeedbackSubmitRequest,
    CVReviewOrderCreateRequest,
    CVReviewOrderResponse,
    CVReviewPackageResponse,
    ExpertApplicationRequest,
    ExpertMatchRecommendationResponse,
    ExpertProfileResponse,
    OrderCheckoutRequest,
    RankedExpertItemDTO,
    RegisteredExpertApplicationDTO,
)

router = APIRouter(prefix="/expert-review", tags=["Domain 9: Expert CV Review & Monetization"])


@router.get("/experts/", response_model=List[ExpertProfileResponse])
async def list_experts(
    category: Optional[str] = Query(None, description="Filter experts by role category"),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).list_experts(role_category=category)


@router.get("/leaderboard", response_model=List[RankedExpertItemDTO])
async def get_expert_leaderboard(
    category: Optional[str] = Query(None, description="Filter by category: backend | frontend | ai | devops | management"),
    sort_by: str = Query("rank", description="Sort by: rank | ats_lift | rating | speed | reviews_count"),
    db: AsyncSession = Depends(get_db),
):
    """BEL-199: Expert Reviewer Ranking & Leaderboard Engine API."""
    return await ExpertLeaderboardService(db).get_leaderboard(category=category, sort_by=sort_by)


@router.post("/apply", response_model=RegisteredExpertApplicationDTO, status_code=status.HTTP_201_CREATED)
async def apply_become_expert_reviewer(
    payload: ExpertApplicationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """BEL-203: Register or update Expert Reviewer profile in PostgreSQL."""
    return await ExpertLeaderboardService(db).apply_expert(current_user.id, payload)


@router.get("/me", response_model=Optional[RegisteredExpertApplicationDTO])
async def get_my_expert_reviewer_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """BEL-203: Retrieve current user's registered Expert Reviewer profile."""
    return await ExpertLeaderboardService(db).get_my_expert_application(current_user.id)




@router.get("/packages/", response_model=List[CVReviewPackageResponse])
async def list_packages(db: AsyncSession = Depends(get_db)):
    return await ExpertReviewService(db).list_packages()


@router.get("/recommend", response_model=ExpertMatchRecommendationResponse)
async def recommend_expert_reviewer(
    target_role: str = Query("Senior Backend Engineer", description="Candidate target role"),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).recommend_expert_and_package(target_role=target_role)


@router.post("/orders/", response_model=CVReviewOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_review_order(
    payload: CVReviewOrderCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).create_order(
        candidate_identity_id=current_user.id, payload=payload
    )


@router.post("/orders/{order_id}/checkout/", response_model=CVReviewOrderResponse)
async def checkout_review_order(
    order_id: uuid.UUID,
    payload: OrderCheckoutRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).checkout_order(
        order_id=order_id,
        candidate_identity_id=current_user.id,
        payload=payload,
    )


@router.get("/orders/my-orders/", response_model=List[CVReviewOrderResponse])
async def list_candidate_orders(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).list_my_orders(candidate_identity_id=current_user.id)


@router.get("/orders/me", response_model=List[CVReviewOrderResponse])
async def list_candidate_orders_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).list_my_orders(candidate_identity_id=current_user.id)


@router.get("/orders/{order_id}/feedback/", response_model=CVReviewFeedbackResponse)
async def get_order_feedback(
    order_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).get_order_feedback(
        order_id=order_id, candidate_identity_id=current_user.id
    )


@router.post("/orders/{order_id}/feedback/", response_model=CVReviewFeedbackResponse)
async def submit_order_feedback(
    order_id: uuid.UUID,
    payload: CVReviewFeedbackSubmitRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).submit_order_feedback(
        order_id=order_id,
        actor_identity_id=current_user.id,
        payload=payload,
        actor_role=current_user.role,
    )


@router.post("/orders/{order_id}/simulate-delivery", response_model=CVReviewOrderResponse)
async def simulate_expert_review_delivery(
    order_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).simulate_delivery(
        order_id=order_id, actor_identity_id=current_user.id, actor_role=current_user.role
    )


@router.post("/orders/{order_id}/complete", response_model=CVReviewOrderResponse)
async def complete_expert_review_order(
    order_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).complete_order_and_release_escrow(
        order_id=order_id, actor_identity_id=current_user.id, actor_role=current_user.role
    )

