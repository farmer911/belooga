"""Thin Controller for Domain 9: Expert CV Review & Monetization."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user
from app.modules.expert_review import ExpertReviewService
from app.schemas.expert_review import (
    CVReviewFeedbackResponse,
    CVReviewFeedbackSubmitRequest,
    CVReviewOrderCreateRequest,
    CVReviewOrderResponse,
    CVReviewPackageResponse,
    ExpertMatchRecommendationResponse,
    ExpertProfileResponse,
    OrderCheckoutRequest,
)

router = APIRouter(prefix="/expert-review", tags=["Domain 9: Expert CV Review & Monetization"])


@router.get("/experts/", response_model=List[ExpertProfileResponse])
async def list_experts(
    category: Optional[str] = Query(None, description="Filter experts by role category"),
    db: AsyncSession = Depends(get_db),
):
    return await ExpertReviewService(db).list_experts(role_category=category)


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
        order_id=order_id, actor_identity_id=current_user.id, payload=payload
    )
