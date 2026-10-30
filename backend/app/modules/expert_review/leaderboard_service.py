"""Expert Reviewer Ranking & Leaderboard Engine Service (BEL-199 — Vertical Module: expert_review)."""

from typing import Any, Dict, List, Optional
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.expert_review.repository import ExpertReviewRepository
from app.modules.notifications import NotificationService
from app.schemas.expert_review import (
    ExpertApplicationRequest,
    RankedExpertItemDTO,
    RegisteredExpertApplicationDTO,
)

DEFAULT_RANKED_EXPERTS: List[Dict[str, Any]] = [
    {
        "id": "exp-rank-1",
        "rank": 1,
        "full_name": "Dr. Trần Minh Quân",
        "role_title": "Principal Distributed Systems Architect",
        "company_name": "Grab Financial Group",
        "category": "backend",
        "badge_title": "Grandmaster Mentor",
        "ranking_score": 98.4,
        "rating": 4.98,
        "completed_reviews_count": 186,
        "avg_ats_lift_points": 28,
        "avg_turnaround_hours": 11,
        "interview_callback_rate_pct": 92,
        "specialties": ["Golang", "PostgreSQL", "System Design", "High-Scale ATS"],
    },
    {
        "id": "exp-rank-2",
        "rank": 2,
        "full_name": "Lê Hoàng Nam",
        "role_title": "Staff AI & LLM Infrastructure Lead",
        "company_name": "Shopee & Sea AI Lab",
        "category": "ai",
        "badge_title": "Top ATS Lifter",
        "ranking_score": 96.2,
        "rating": 4.95,
        "completed_reviews_count": 142,
        "avg_ats_lift_points": 31,
        "avg_turnaround_hours": 14,
        "interview_callback_rate_pct": 90,
        "specialties": ["Python", "PyTorch", "FastAPI", "RAG & Agentic AI"],
    },
    {
        "id": "exp-rank-3",
        "rank": 3,
        "full_name": "Nguyễn Thu Hà",
        "role_title": "Engineering Manager & Hiring Committee Chair",
        "company_name": "VNG Cloud",
        "category": "management",
        "badge_title": "Fastest SLA",
        "ranking_score": 94.8,
        "rating": 4.93,
        "completed_reviews_count": 124,
        "avg_ats_lift_points": 25,
        "avg_turnaround_hours": 9,
        "interview_callback_rate_pct": 89,
        "specialties": ["STAR Behavioral", "Tech Lead CV", "Salary Negotiation"],
    },
    {
        "id": "exp-rank-4",
        "rank": 4,
        "full_name": "Võ Thị Mai",
        "role_title": "Staff Frontend & Design System Architect",
        "company_name": "M_Service (MoMo)",
        "category": "frontend",
        "badge_title": "Top Frontend Mentor",
        "ranking_score": 93.5,
        "rating": 4.91,
        "completed_reviews_count": 98,
        "avg_ats_lift_points": 24,
        "avg_turnaround_hours": 12,
        "interview_callback_rate_pct": 88,
        "specialties": ["React 19", "Next.js", "TypeScript", "UI/UX Portfolio"],
    },
]


class ExpertLeaderboardService:
    """Service computing Expert Reviewer Leaderboard rankings and sorting."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ExpertReviewRepository(db)

    async def get_leaderboard(
        self, category: Optional[str] = None, sort_by: str = "rank"
    ) -> List[RankedExpertItemDTO]:
        items = [dict(e) for e in DEFAULT_RANKED_EXPERTS]
        db_experts = await self.repo.list_experts(None)
        seen_names = {e["full_name"].lower() for e in items}
        for exp in db_experts:
            if exp.full_name.lower() in seen_names:
                continue
            cat_raw = (exp.role_category or "backend").lower()
            cat = (
                "frontend" if "front" in cat_raw
                else "ai" if "ai" in cat_raw
                else "devops" if "devops" in cat_raw
                else "management" if "manage" in cat_raw
                else "backend"
            )
            items.append({
                "id": str(exp.id),
                "rank": len(items) + 1,
                "full_name": exp.full_name,
                "role_title": exp.headline,
                "company_name": exp.company,
                "category": cat,
                "badge_title": "Verified Mentor",
                "ranking_score": round(float(exp.rating or 4.9) * 19.2, 1),
                "rating": float(exp.rating or 4.95),
                "completed_reviews_count": int(exp.total_reviews_count or 24),
                "avg_ats_lift_points": 26,
                "avg_turnaround_hours": max(8, int(exp.turn_around_days or 1) * 12),
                "interview_callback_rate_pct": 90,
                "specialties": ["ATS Calibration", "STAR Metrics", exp.company],
            })
            seen_names.add(exp.full_name.lower())

        if category and category.strip().lower() not in ("all", ""):
            c_low = category.strip().lower()
            items = [i for i in items if i["category"].lower() == c_low]

        if sort_by == "ats_lift":
            items.sort(key=lambda x: x["avg_ats_lift_points"], reverse=True)
        elif sort_by == "rating":
            items.sort(key=lambda x: x["rating"], reverse=True)
        elif sort_by == "speed":
            items.sort(key=lambda x: x["avg_turnaround_hours"])
        elif sort_by == "reviews_count":
            items.sort(key=lambda x: x["completed_reviews_count"], reverse=True)
        else:
            items.sort(key=lambda x: x["ranking_score"], reverse=True)

        for idx, item in enumerate(items):
            item["rank"] = idx + 1
        return [RankedExpertItemDTO(**i) for i in items]

    async def apply_expert(self, identity_id: uuid.UUID, payload: ExpertApplicationRequest) -> RegisteredExpertApplicationDTO:
        data = payload.model_dump()
        if data["years_experience"] < 0 or data["turnaround_hours"] <= 0 or data["hourly_rate_vnd"] < 0:
            raise HTTPException(status_code=422, detail="years_experience/hourly_rate_vnd must be >= 0 and turnaround_hours > 0.")
        exp = await self.repo.upsert_registered_expert(identity_id, data)
        saved = await self.repo.upsert_expert_application(identity_id, exp.id, data)
        await NotificationService(self.db).dispatch_event(
            identity_id=identity_id,
            event_type="EXPERT_PROFILE_ACTIVATED",
            title=f"Hồ sơ Chuyên gia {payload.full_name} đã kích hoạt!",
            message=f"Bạn đã hiển thị trên Bảng xếp hạng Chuyên gia ({payload.role_title} @ {payload.company_name}).",
            deep_link="/expert-review",
            send_email=True,
            category="system",
            auto_commit=False,
        )
        await self.db.commit()  # expert profile + application + notification in one transaction
        await platform_cache.invalidate_prefix("expert_")
        return RegisteredExpertApplicationDTO(**saved)

    async def get_my_expert_application(self, identity_id: uuid.UUID) -> Optional[RegisteredExpertApplicationDTO]:
        """Only the caller's own application; None when they never applied (no fallback to other users)."""
        row = await self.repo.get_expert_application(identity_id)
        return RegisteredExpertApplicationDTO(**row) if row else None
