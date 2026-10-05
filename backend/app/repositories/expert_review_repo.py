"""Repository Layer for Domain 9: Expert CV Review & Monetization."""

import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.expert_review import (
    CVReviewFeedback,
    CVReviewOrder,
    CVReviewPackage,
    ExpertProfile,
)


class ExpertReviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_experts(self, role_category: Optional[str] = None) -> List[ExpertProfile]:
        query = select(ExpertProfile).where(ExpertProfile.is_active == True)
        if role_category and role_category.lower() != "all":
            query = query.where(ExpertProfile.role_category.ilike(f"%{role_category}%"))
        query = query.order_by(ExpertProfile.rating.desc(), ExpertProfile.total_reviews_count.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_expert_by_id(self, expert_id: uuid.UUID) -> Optional[ExpertProfile]:
        query = select(ExpertProfile).where(ExpertProfile.id == expert_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_packages(self) -> List[CVReviewPackage]:
        query = select(CVReviewPackage).order_by(CVReviewPackage.price_cents.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_package_by_slug(self, slug: str) -> Optional[CVReviewPackage]:
        query = select(CVReviewPackage).where(CVReviewPackage.slug == slug)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_order(
        self,
        candidate_identity_id: uuid.UUID,
        package_id: uuid.UUID,
        resume_url: str,
        target_role: str,
        amount_paid_cents: int,
        expert_id: Optional[uuid.UUID] = None,
        target_companies: Optional[str] = None,
        candidate_notes: Optional[str] = None,
        order_status: str = "pending_payment",
    ) -> CVReviewOrder:
        order = CVReviewOrder(
            candidate_identity_id=candidate_identity_id,
            expert_id=expert_id,
            package_id=package_id,
            resume_url=resume_url,
            target_role=target_role,
            target_companies=target_companies,
            candidate_notes=candidate_notes,
            amount_paid_cents=amount_paid_cents,
            order_status=order_status,
        )
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def get_order_by_id(self, order_id: uuid.UUID, for_update: bool = False) -> Optional[CVReviewOrder]:
        query = (
            select(CVReviewOrder)
            .options(
                selectinload(CVReviewOrder.expert),
                selectinload(CVReviewOrder.package),
                selectinload(CVReviewOrder.feedback),
            )
            .where(CVReviewOrder.id == order_id)
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_orders_by_candidate(self, candidate_identity_id: uuid.UUID) -> List[CVReviewOrder]:
        query = (
            select(CVReviewOrder)
            .options(
                selectinload(CVReviewOrder.expert),
                selectinload(CVReviewOrder.package),
                selectinload(CVReviewOrder.feedback),
            )
            .where(CVReviewOrder.candidate_identity_id == candidate_identity_id)
            .order_by(CVReviewOrder.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_order_status(
        self, order_id: uuid.UUID, new_status: str, payment_reference: Optional[str] = None
    ) -> Optional[CVReviewOrder]:
        order = await self.get_order_by_id(order_id, for_update=True)
        if not order:
            return None
        order.order_status = new_status
        if payment_reference:
            order.payment_reference = payment_reference
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def get_feedback_by_order_id(self, order_id: uuid.UUID) -> Optional[CVReviewFeedback]:
        query = (
            select(CVReviewFeedback)
            .options(selectinload(CVReviewFeedback.expert))
            .where(CVReviewFeedback.order_id == order_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
