"""Service Layer for Domain 9: Expert CV Review & Monetization."""

import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expert_review import CVReviewFeedback, CVReviewPackage, ExpertProfile
from app.repositories.expert_review_repo import ExpertReviewRepository
from app.schemas.expert_review import (
    CVReviewFeedbackResponse,
    CVReviewOrderCreateRequest,
    CVReviewOrderResponse,
    CVReviewPackageResponse,
    ExpertProfileResponse,
    OrderCheckoutRequest,
)


class ExpertReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ExpertReviewRepository(db)

    async def list_experts(self, role_category: Optional[str] = None) -> List[ExpertProfileResponse]:
        await self._ensure_seed_data()
        experts = await self.repo.list_experts(role_category)
        return [ExpertProfileResponse.model_validate(e) for e in experts]

    async def list_packages(self) -> List[CVReviewPackageResponse]:
        await self._ensure_seed_data()
        packages = await self.repo.list_packages()
        return [CVReviewPackageResponse.model_validate(p) for p in packages]

    async def create_order(
        self, candidate_identity_id: uuid.UUID, payload: CVReviewOrderCreateRequest
    ) -> CVReviewOrderResponse:
        await self._ensure_seed_data()
        package = await self.repo.get_package_by_slug(payload.package_slug)
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review package '{payload.package_slug}' not found",
            )

        if payload.expert_id:
            expert = await self.repo.get_expert_by_id(payload.expert_id)
            if not expert or not expert.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected expert is currently unavailable",
                )

        order = await self.repo.create_order(
            candidate_identity_id=candidate_identity_id,
            package_id=package.id,
            resume_url=payload.resume_url,
            target_role=payload.target_role,
            amount_paid_cents=package.price_cents,
            expert_id=payload.expert_id,
            target_companies=payload.target_companies,
            candidate_notes=payload.candidate_notes,
            order_status="pending_payment",
        )
        full_order = await self.repo.get_order_by_id(order.id)
        return self._serialize_order(full_order)

    async def checkout_order(
        self, order_id: uuid.UUID, candidate_identity_id: uuid.UUID, payload: OrderCheckoutRequest
    ) -> CVReviewOrderResponse:
        order = await self.repo.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # IDOR Guard
        if order.candidate_identity_id != candidate_identity_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this review order"
            )

        payment_ref = f"txn_{uuid.uuid4().hex[:12]}_{payload.payment_method}"
        updated_order = await self.repo.update_order_status(
            order_id=order_id, new_status="paid", payment_reference=payment_ref
        )
        full_order = await self.repo.get_order_by_id(updated_order.id)
        return self._serialize_order(full_order)

    async def list_my_orders(self, candidate_identity_id: uuid.UUID) -> List[CVReviewOrderResponse]:
        orders = await self.repo.list_orders_by_candidate(candidate_identity_id)
        return [self._serialize_order(o) for o in orders]

    async def get_order_feedback(
        self, order_id: uuid.UUID, candidate_identity_id: uuid.UUID
    ) -> CVReviewFeedbackResponse:
        order = await self.repo.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # IDOR Guard
        if order.candidate_identity_id != candidate_identity_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this review order"
            )

        feedback = await self.repo.get_feedback_by_order_id(order_id)
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review feedback is still in progress by the expert",
            )

        expert_name = feedback.expert.full_name if feedback.expert else "Senior Expert"
        return CVReviewFeedbackResponse(
            id=feedback.id,
            order_id=feedback.order_id,
            expert_name=expert_name,
            score_overall=feedback.score_overall,
            score_ats_compatibility=feedback.score_ats_compatibility,
            score_impact_action_verbs=feedback.score_impact_action_verbs,
            score_structure_formatting=feedback.score_structure_formatting,
            summary_verdict=feedback.summary_verdict,
            strengths=feedback.strengths,
            improvements=feedback.improvements,
            annotated_cv_url=feedback.annotated_cv_url,
            video_feedback_url=feedback.video_feedback_url,
            submitted_at=feedback.submitted_at,
        )

    def _serialize_order(self, order) -> CVReviewOrderResponse:
        feedback_dto = None
        if order.feedback:
            expert_name = order.feedback.expert.full_name if order.feedback.expert else "Senior Expert"
            feedback_dto = CVReviewFeedbackResponse(
                id=order.feedback.id,
                order_id=order.feedback.order_id,
                expert_name=expert_name,
                score_overall=order.feedback.score_overall,
                score_ats_compatibility=order.feedback.score_ats_compatibility,
                score_impact_action_verbs=order.feedback.score_impact_action_verbs,
                score_structure_formatting=order.feedback.score_structure_formatting,
                summary_verdict=order.feedback.summary_verdict,
                strengths=order.feedback.strengths,
                improvements=order.feedback.improvements,
                annotated_cv_url=order.feedback.annotated_cv_url,
                video_feedback_url=order.feedback.video_feedback_url,
                submitted_at=order.feedback.submitted_at,
            )

        return CVReviewOrderResponse(
            id=order.id,
            package_name=order.package.name if order.package else "Custom Package",
            package_slug=order.package.slug if order.package else "custom",
            expert_name=order.expert.full_name if order.expert else "Auto-matched Senior Expert",
            resume_url=order.resume_url,
            target_role=order.target_role,
            target_companies=order.target_companies,
            candidate_notes=order.candidate_notes,
            order_status=order.order_status,
            amount_paid_cents=order.amount_paid_cents,
            payment_reference=order.payment_reference,
            created_at=order.created_at,
            feedback=feedback_dto,
        )

    async def _ensure_seed_data(self):
        packages = await self.repo.list_packages()
        if not packages:
            p1 = CVReviewPackage(
                name="Essential Review",
                slug="essential",
                description="Comprehensive ATS audit, keyword gap analysis, and bullet-point impact assessment.",
                price_cents=2900,
                turn_around_hours=48,
                is_popular=False,
                features=[
                    "Full ATS Compatibility Scan & Score",
                    "Keyword optimization for target job descriptions",
                    "Grammar, formatting & brevity overhaul",
                    "48-hour delivery guarantee",
                ],
            )
            p2 = CVReviewPackage(
                name="Pro Deep-Dive",
                slug="pro",
                description="Line-by-line rewrite suggestions, metric quantification, and 10-minute async video walkthrough.",
                price_cents=5900,
                turn_around_hours=48,
                is_popular=True,
                features=[
                    "Everything in Essential Review",
                    "Line-by-line bullet rewriting for high impact",
                    "10-min Loom video walkthrough by Senior Leader",
                    "Quantifiable metrics & XYZ-formula alignment",
                    "1 round of follow-up Q&A messaging",
                ],
            )
            p3 = CVReviewPackage(
                name="Elite 1-on-1 Fast-Track",
                slug="elite",
                description="Everything in Pro plus 30-min live technical mock screen and direct referral consideration.",
                price_cents=9900,
                turn_around_hours=24,
                is_popular=False,
                features=[
                    "Everything in Pro Deep-Dive",
                    "Expedited 24-hour turnaround",
                    "30-minute live 1-on-1 coaching session",
                    "Mock interview calibration & pitch review",
                    "Direct top-tier candidate pool spotlight",
                ],
            )
            self.db.add_all([p1, p2, p3])
            await self.db.commit()

        experts = await self.repo.list_experts()
        if not experts:
            e1 = ExpertProfile(
                full_name="Sarah Jenkins",
                headline="Staff Software Engineer @ Stripe",
                bio="10+ years scaling payment infrastructures. Interviewed 300+ backend and distributed system candidates.",
                avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
                company="Stripe",
                role_category="Backend & Systems",
                years_of_experience=11,
                rating=4.98,
                total_reviews_count=142,
                turn_around_days=2,
                is_active=True,
            )
            e2 = ExpertProfile(
                full_name="Alex Chen",
                headline="Head of Frontend Engineering @ Figma, ex-Uber",
                bio="Specializing in React, Next.js architecture, and Design Systems. Passionate about helping engineers stand out.",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
                company="Figma",
                role_category="Frontend & Web",
                years_of_experience=9,
                rating=4.95,
                total_reviews_count=98,
                turn_around_days=2,
                is_active=True,
            )
            e3 = ExpertProfile(
                full_name="Marcus Vance",
                headline="AI Research Engineering Lead @ OpenAI",
                bio="LLM fine-tuning and ML infra lead. Reviewed 200+ ML and AI resumes for Silicon Valley research labs.",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
                company="OpenAI",
                role_category="AI & Machine Learning",
                years_of_experience=12,
                rating=5.00,
                total_reviews_count=76,
                turn_around_days=1,
                is_active=True,
            )
            self.db.add_all([e1, e2, e3])
            await self.db.commit()
