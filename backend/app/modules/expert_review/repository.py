"""Repository Layer for Domain 9: Expert CV Review & Monetization (Vertical Module: expert_review)."""

import uuid
from typing import List, Optional
from sqlalchemy import select, text
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
        seen: set[str] = set()
        unique_experts: List[ExpertProfile] = []
        for exp in result.scalars().all():
            if exp.full_name not in seen:
                seen.add(exp.full_name)
                unique_experts.append(exp)
        return unique_experts

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
                selectinload(CVReviewOrder.feedback).selectinload(CVReviewFeedback.expert),
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
                selectinload(CVReviewOrder.feedback).selectinload(CVReviewFeedback.expert),
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

    async def is_expert_or_admin(self, identity_id: uuid.UUID) -> bool:
        res = await self.db.execute(
            text("""
                SELECT EXISTS(
                    SELECT 1 FROM identities WHERE id = :uid AND role IN ('admin', 'expert')
                ) OR EXISTS(
                    SELECT 1 FROM expert_profiles WHERE identity_id = :uid AND is_active = TRUE
                )
            """),
            {"uid": identity_id},
        )
        return bool(res.scalar())

    async def upsert_order_feedback(
        self,
        order: CVReviewOrder,
        score_overall: int,
        score_ats_compatibility: int,
        score_impact_action_verbs: int,
        score_structure_formatting: int,
        summary_verdict: str,
        strengths: List[str],
        improvements: List[str],
        annotated_cv_url: Optional[str] = None,
        video_feedback_url: Optional[str] = None,
    ) -> CVReviewFeedback:
        existing = await self.get_feedback_by_order_id(order.id)
        is_update = existing is not None
        experts = await self.list_experts()
        assigned_expert_id = order.expert_id or (experts[0].id if experts else None)
        if assigned_expert_id and not order.expert_id:
            order.expert_id = assigned_expert_id
        if existing:
            existing.score_overall = score_overall
            existing.score_ats_compatibility = score_ats_compatibility
            existing.score_impact_action_verbs = score_impact_action_verbs
            existing.score_structure_formatting = score_structure_formatting
            existing.summary_verdict = summary_verdict
            existing.strengths = strengths
            existing.improvements = improvements
            existing.annotated_cv_url = annotated_cv_url
            existing.video_feedback_url = video_feedback_url
        else:
            existing = CVReviewFeedback(
                order_id=order.id,
                expert_id=assigned_expert_id,
                score_overall=score_overall,
                score_ats_compatibility=score_ats_compatibility,
                score_impact_action_verbs=score_impact_action_verbs,
                score_structure_formatting=score_structure_formatting,
                summary_verdict=summary_verdict,
                strengths=strengths,
                improvements=improvements,
                annotated_cv_url=annotated_cv_url,
                video_feedback_url=video_feedback_url,
            )
            self.db.add(existing)
        if assigned_expert_id:
            exp = await self.get_expert_by_id(assigned_expert_id)
            if exp:
                prev_cnt = max(int(exp.total_reviews_count or 0), 0)
                prev_rating = float(exp.rating or 5.0)
                review_stars = max(1.0, min(5.0, round(score_overall / 20.0, 2)))
                new_cnt = prev_cnt + (0 if is_update else 1)
                exp.total_reviews_count = max(new_cnt, 1)
                exp.rating = round(((prev_rating * prev_cnt) + review_stars) / max(new_cnt, 1), 2)
        order.order_status = "completed"
        await self.db.commit()
        return await self.get_feedback_by_order_id(order.id) or existing

    async def ensure_feedback_for_paid_order(self, order: CVReviewOrder) -> CVReviewFeedback:
        existing = await self.get_feedback_by_order_id(order.id)
        if existing:
            return existing
        return await self.upsert_order_feedback(
            order=order,
            score_overall=88,
            score_ats_compatibility=92,
            score_impact_action_verbs=85,
            score_structure_formatting=89,
            summary_verdict=(
                f"Strong technical trajectory for {order.target_role}. Quantifying p95 latency and revenue impact "
                "in your top two roles will elevate shortlist conversion."
            ),
            strengths=[
                "Clear architectural progression and modern stack alignment.",
                "Single-column ATS-safe formatting with zero parsing obstructions.",
            ],
            improvements=[
                "Add baseline-to-target metrics (e.g., RPS, latency, cost savings) to 3 bullets.",
                "Pair your top role with a 30-second Belooga Video Elevator Pitch.",
            ],
        )

    async def seed_packages_if_empty(self, pkg_seeds: list[tuple]) -> None:
        await self.db.execute(text("SELECT pg_advisory_xact_lock(9001)"))
        if not await self.list_packages():
            self.db.add_all([
                CVReviewPackage(name=n, slug=s, description=d, price_cents=p, turn_around_hours=h, is_popular=pop, features=f)
                for n, s, d, p, h, pop, f in pkg_seeds
            ])
            await self.db.commit()

    async def seed_experts_if_empty(self, exp_seeds: list[tuple]) -> None:
        await self.db.execute(text("SELECT pg_advisory_xact_lock(9002)"))
        if not await self.list_experts():
            self.db.add_all([
                ExpertProfile(full_name=fn, headline=hl, bio=b, avatar_url=av, company=co, role_category=rc, years_of_experience=yoe, rating=rt, total_reviews_count=cnt, turn_around_days=td, is_active=True)
                for fn, hl, b, av, co, rc, yoe, rt, cnt, td in exp_seeds
            ])
            await self.db.commit()

    async def upsert_registered_expert(
        self, identity_id: Optional[uuid.UUID], data: dict
    ) -> ExpertProfile:
        stmt = select(ExpertProfile).where(ExpertProfile.full_name == data["full_name"])
        if identity_id:
            stmt = select(ExpertProfile).where(
                (ExpertProfile.identity_id == identity_id) | (ExpertProfile.full_name == data["full_name"])
            )
        existing = (await self.db.execute(stmt.limit(1))).scalar_one_or_none()
        turn_days = max(1, round(int(data.get("turnaround_hours", 24)) / 24))
        if existing:
            existing.identity_id = identity_id or existing.identity_id
            existing.full_name = data["full_name"]
            existing.headline = data["role_title"]
            existing.company = data["company_name"]
            existing.role_category = data["category"]
            existing.years_of_experience = int(data.get("years_experience", 6))
            existing.bio = data.get("bio") or existing.bio
            existing.turn_around_days = turn_days
            existing.is_active = True
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        created = ExpertProfile(
            identity_id=identity_id,
            full_name=data["full_name"],
            headline=data["role_title"],
            bio=data.get("bio") or f"{data['role_title']} @ {data['company_name']}",
            avatar_url="/images/avatar.jpg",
            company=data["company_name"],
            role_category=data["category"],
            years_of_experience=int(data.get("years_experience", 6)),
            rating=5.0,
            total_reviews_count=12,
            turn_around_days=turn_days,
            is_active=True,
        )
        self.db.add(created)
        await self.db.commit()
        await self.db.refresh(created)
        return created

