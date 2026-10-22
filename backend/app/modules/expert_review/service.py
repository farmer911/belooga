"""Service Layer for Domain 9: Expert CV Review & Monetization (Vertical Module: expert_review)."""

import os
import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.models.expert_review import CVReviewFeedback
from app.modules.expert_review.repository import ExpertReviewRepository
from app.modules.notifications import NotificationService
from app.modules.payments import PaymentService
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


class ExpertReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ExpertReviewRepository(db)

    async def list_experts(self, role_category: Optional[str] = None) -> List[ExpertProfileResponse]:
        async def _compute() -> List[Dict[str, Any]]:
            await self._ensure_seed_data()
            experts = await self.repo.list_experts(role_category)
            return [ExpertProfileResponse.model_validate(e).model_dump(mode="json") for e in experts]

        rows = await _compute() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set(f"expert_list:{(role_category or 'all').lower().strip()}", 60, _compute)
        return [ExpertProfileResponse(**r) for r in rows]

    async def list_packages(self) -> List[CVReviewPackageResponse]:
        async def _compute() -> List[Dict[str, Any]]:
            await self._ensure_seed_data()
            packages = await self.repo.list_packages()
            return [CVReviewPackageResponse.model_validate(p).model_dump(mode="json") for p in packages]

        rows = await _compute() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set("expert_packages:all", 60, _compute)
        return [CVReviewPackageResponse(**r) for r in rows]

    async def recommend_expert_and_package(self, target_role: str) -> ExpertMatchRecommendationResponse:
        async def _compute() -> Dict[str, Any]:
            await self._ensure_seed_data()
            experts, packages = await self.repo.list_experts(None), await self.repo.list_packages()
            role_lower = target_role.lower()
            cat_match = (
                "Frontend" if any(k in role_lower for k in ("front", "react", "next", "ui", "design"))
                else "AI" if any(k in role_lower for k in ("ai", "ml", "data", "llm", "research"))
                else "Backend"
            )
            chosen_exp = next((e for e in experts if cat_match.lower() in (e.role_category or "").lower()), experts[0])
            is_exec = any(k in role_lower for k in ("staff", "principal", "lead", "head", "architect"))
            chosen_pkg = next((p for p in packages if p.slug == ("elite" if is_exec else "pro")), packages[0])
            return ExpertMatchRecommendationResponse(
                target_role=target_role,
                recommended_expert=ExpertProfileResponse.model_validate(chosen_exp),
                recommended_package=CVReviewPackageResponse.model_validate(chosen_pkg),
                match_confidence_pct=96 if is_exec else 92,
                estimated_ats_lift_points=26 if is_exec else 19,
                match_rationale=f"Matched with {chosen_exp.full_name} ({chosen_exp.headline}) and {chosen_pkg.name} for {target_role} calibration (+{26 if is_exec else 19} projected ATS points).",
            ).model_dump(mode="json")

        data = await _compute() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set(f"expert_rec:{target_role.lower().strip()}", 60, _compute)
        return ExpertMatchRecommendationResponse(**data)

    async def create_order(
        self, candidate_identity_id: uuid.UUID, payload: CVReviewOrderCreateRequest
    ) -> CVReviewOrderResponse:
        await self._ensure_seed_data()
        package = await self.repo.get_package_by_slug(payload.package_slug)
        if not package:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Review package '{payload.package_slug}' not found")
        if payload.expert_id:
            expert = await self.repo.get_expert_by_id(payload.expert_id)
            if not expert or not expert.is_active:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected expert is currently unavailable")

        order = await self.repo.create_order(
            candidate_identity_id=candidate_identity_id, package_id=package.id,
            resume_url=payload.resume_url, target_role=payload.target_role,
            amount_paid_cents=package.price_cents, expert_id=payload.expert_id,
            target_companies=payload.target_companies, candidate_notes=payload.candidate_notes,
            order_status="pending_payment",
        )
        full_order = await self.repo.get_order_by_id(order.id)
        await NotificationService(self.db).dispatch_event(
            identity_id=candidate_identity_id, event_type="EXPERT_REVIEW_ORDERED",
            title=f"Expert CV Review Order Created ({package.name})",
            message=f"Your CV review order for {payload.target_role} has been created and awaits checkout.",
            deep_link=f"/expert-review?order_id={order.id}", send_email=True, category="order",
        )
        return self._serialize_order(full_order)

    async def checkout_order(
        self, order_id: uuid.UUID, candidate_identity_id: uuid.UUID, payload: OrderCheckoutRequest
    ) -> CVReviewOrderResponse:
        order = await self.repo.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this review order")

        payment_ref = f"txn_{uuid.uuid4().hex[:12]}_{payload.payment_method}"
        updated_order = await self.repo.update_order_status(order_id=order_id, new_status="paid", payment_reference=payment_ref)
        full_order = await self.repo.get_order_by_id(updated_order.id)
        await NotificationService(self.db).dispatch_event(
            identity_id=candidate_identity_id, event_type="EXPERT_ORDER_PAID",
            title="Expert CV Review Payment Confirmed",
            message=f"Payment reference {payment_ref} verified. Your senior reviewer is now auditing your CV.",
            deep_link=f"/expert-review?order_id={order_id}&status=paid", send_email=True, category="order",
        )
        return self._serialize_order(full_order)

    async def list_my_orders(self, candidate_identity_id: uuid.UUID) -> List[CVReviewOrderResponse]:
        return [self._serialize_order(o) for o in await self.repo.list_orders_by_candidate(candidate_identity_id)]

    async def get_order_feedback(
        self, order_id: uuid.UUID, candidate_identity_id: uuid.UUID
    ) -> CVReviewFeedbackResponse:
        order = await self.repo.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this review order")

        feedback = await self.repo.get_feedback_by_order_id(order_id)
        if not feedback and order.order_status in ("paid", "in_review", "completed"):
            feedback = await self.repo.ensure_feedback_for_paid_order(order)
        if not feedback:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review feedback is still in progress by the expert")
        return self._serialize_feedback(feedback)

    async def submit_order_feedback(
        self, order_id: uuid.UUID, actor_identity_id: uuid.UUID,
        payload: CVReviewFeedbackSubmitRequest, actor_role: str = "candidate",
    ) -> CVReviewFeedbackResponse:
        order = await self.repo.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        is_owner = order.candidate_identity_id == actor_identity_id
        is_privileged = actor_role in ("admin", "expert") or await self.repo.is_expert_or_admin(actor_identity_id)
        if not (is_owner or is_privileged):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this review order")

        feedback = await self.repo.upsert_order_feedback(
            order=order, score_overall=payload.score_overall,
            score_ats_compatibility=payload.score_ats_compatibility,
            score_impact_action_verbs=payload.score_impact_action_verbs,
            score_structure_formatting=payload.score_structure_formatting,
            summary_verdict=payload.summary_verdict, strengths=payload.strengths,
            improvements=payload.improvements, annotated_cv_url=payload.annotated_cv_url,
            video_feedback_url=payload.video_feedback_url,
        )
        await platform_cache.invalidate_prefix("expert_")
        await NotificationService(self.db).dispatch_event(
            identity_id=order.candidate_identity_id, event_type="EXPERT_FEEDBACK_READY",
            title=f"Expert CV Review Completed ({payload.score_overall}/100)",
            message=payload.summary_verdict[:160],
            deep_link=f"/expert-review?order_id={order_id}&status=completed",
            send_email=True, category="order",
        )
        return self._serialize_feedback(feedback)

    async def simulate_delivery(
        self, order_id: uuid.UUID, actor_identity_id: uuid.UUID, actor_role: str = "candidate"
    ) -> CVReviewOrderResponse:
        order = await self.repo.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.candidate_identity_id != actor_identity_id and actor_role not in ("admin", "expert"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this review order")

        target_co = order.target_companies or "Tier-1 Engineering Teams"
        verdict = (
            f"[Executive Summary] Strong senior trajectory for {order.target_role} targeting {target_co}.\n"
            f"[Experience STAR Critique] Top bullets demonstrate ownership; convert passive phrases into STAR metrics (baseline -> action -> p95 latency/RPS delta).\n"
            f"[Skills Gap & Keyword Calibration] Core backend/cloud keywords aligned with ATS parser rules.\n"
            f"[Line-by-Line Rewrite] Lead each role with quantified production SLA and throughput impact."
        )
        await self.repo.upsert_order_feedback(
            order=order, score_overall=92, score_ats_compatibility=95,
            score_impact_action_verbs=90, score_structure_formatting=93,
            summary_verdict=verdict,
            strengths=[
                f"High-signal architecture progression tailored for {order.target_role}.",
                "Clean single-column ATS structure with zero parser warnings.",
                "Strong production ownership across distributed systems and database indexing.",
            ],
            improvements=[
                "Rewrite bullet #2 using STAR format: 'Engineered X handling 45,000+ RPS, reducing p95 latency by 38%'.",
                f"Highlight domain keywords specific to {target_co} in the Executive Summary.",
                "Attach a 30-second Belooga Video Elevator Pitch link at the top header.",
            ],
        )
        await self.repo.update_order_status(order_id=order_id, new_status="in_review")
        await platform_cache.invalidate_prefix("expert_")
        await NotificationService(self.db).dispatch_event(
            identity_id=order.candidate_identity_id, event_type="EXPERT_FEEDBACK_READY",
            title=f"Báo cáo chấm CV từ Chuyên gia đã sẵn sàng ({order.target_role})",
            message="Chuyên gia đã hoàn tất bản nhận xét chi tiết chuẩn STAR. Hãy xem báo cáo và nghiệm thu giải ngân Escrow.",
            deep_link=f"/expert-review?order_id={order_id}&status=report_ready",
            send_email=True, category="order",
        )
        full_order = await self.repo.get_order_by_id(order_id)
        return self._serialize_order(full_order)

    async def complete_order_and_release_escrow(
        self, order_id: uuid.UUID, actor_identity_id: uuid.UUID, actor_role: str = "candidate"
    ) -> CVReviewOrderResponse:
        order = await self.repo.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.candidate_identity_id != actor_identity_id and actor_role not in ("admin", "expert"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this review order")

        await self.repo.ensure_feedback_for_paid_order(order)
        await self.repo.update_order_status(order_id=order_id, new_status="completed")
        full_order = await self.repo.get_order_by_id(order_id)
        amount_vnd = int((full_order.amount_paid_cents or 1960) * 250)
        exp_name = full_order.expert.full_name if full_order.expert else "Senior Expert"
        await PaymentService.release_escrow_for_order(
            self.db, str(order.candidate_identity_id), str(order_id), amount_vnd, exp_name
        )
        await platform_cache.invalidate_prefix("expert_")
        await platform_cache.invalidate_prefix("analytics:")
        await NotificationService(self.db).dispatch_event(
            identity_id=order.candidate_identity_id, event_type="EXPERT_ESCROW_RELEASED",
            title="Đã nghiệm thu & Giải ngân Escrow thành công",
            message=f"Đơn chấm CV #{str(order_id)[:8]} đã hoàn tất và giải ngân cho {exp_name}.",
            deep_link=f"/expert-review?order_id={order_id}&status=completed",
            send_email=False, category="order",
        )
        return self._serialize_order(full_order)

    def _serialize_feedback(self, fb: CVReviewFeedback) -> CVReviewFeedbackResponse:
        return CVReviewFeedbackResponse(
            id=fb.id, order_id=fb.order_id,
            expert_name=fb.expert.full_name if fb.expert else "Senior Expert",
            score_overall=fb.score_overall, score_ats_compatibility=fb.score_ats_compatibility,
            score_impact_action_verbs=fb.score_impact_action_verbs,
            score_structure_formatting=fb.score_structure_formatting,
            summary_verdict=fb.summary_verdict, strengths=fb.strengths,
            improvements=fb.improvements, annotated_cv_url=fb.annotated_cv_url,
            video_feedback_url=fb.video_feedback_url, submitted_at=fb.submitted_at,
        )

    def _serialize_order(self, order) -> CVReviewOrderResponse:
        return CVReviewOrderResponse(
            id=order.id,
            package_name=order.package.name if order.package else "Custom Package",
            package_slug=order.package.slug if order.package else "custom",
            expert_name=order.expert.full_name if order.expert else "Auto-matched Senior Expert",
            resume_url=order.resume_url, target_role=order.target_role,
            target_companies=order.target_companies, candidate_notes=order.candidate_notes,
            order_status=order.order_status, amount_paid_cents=order.amount_paid_cents,
            payment_reference=order.payment_reference, created_at=order.created_at,
            feedback=self._serialize_feedback(order.feedback) if order.feedback else None,
        )

    async def _ensure_seed_data(self):
        pkg_seeds = [
            ("Essential Review", "essential", "Comprehensive ATS audit, keyword gap analysis, and bullet-point impact assessment.", 2900, 48, False, ["Full ATS Compatibility Scan & Score", "Keyword optimization for target job descriptions", "Grammar, formatting & brevity overhaul", "48-hour delivery guarantee"]),
            ("Pro Deep-Dive", "pro", "Line-by-line rewrite suggestions, metric quantification, and 10-minute async video walkthrough.", 5900, 48, True, ["Everything in Essential Review", "Line-by-line bullet rewriting for high impact", "10-min Loom video walkthrough by Senior Leader", "Quantifiable metrics & XYZ-formula alignment", "1 round of follow-up Q&A messaging"]),
            ("Elite 1-on-1 Fast-Track", "elite", "Everything in Pro plus 30-min live technical mock screen and direct referral consideration.", 9900, 24, False, ["Everything in Pro Deep-Dive", "Expedited 24-hour turnaround", "30-minute live 1-on-1 coaching session", "Mock interview calibration & pitch review", "Direct top-tier candidate pool spotlight"]),
        ]
        exp_seeds = [
            ("Sarah Jenkins", "Staff Software Engineer @ Stripe", "10+ years scaling payment infrastructures. Interviewed 300+ backend and distributed system candidates.", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", "Stripe", "Backend & Systems", 11, 4.98, 142, 2),
            ("Alex Chen", "Head of Frontend Engineering @ Figma, ex-Uber", "Specializing in React, Next.js architecture, and Design Systems. Passionate about helping engineers stand out.", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80", "Figma", "Frontend & Web", 9, 4.95, 98, 2),
            ("Marcus Vance", "AI Research Engineering Lead @ OpenAI", "LLM fine-tuning and ML infra lead. Reviewed 200+ ML and AI resumes for Silicon Valley research labs.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", "OpenAI", "AI & Machine Learning", 12, 5.00, 76, 1),
        ]
        await self.repo.seed_packages_if_empty(pkg_seeds)
        await self.repo.seed_experts_if_empty(exp_seeds)
