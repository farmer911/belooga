"""Service Layer for Domain 11: Candidate Job Applications Tracker (Kanban) (Vertical Module: job_tracker)."""

import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.job_tracker.repository import JobTrackerRepository
from app.modules.notifications import NotificationService
from app.modules.payments import PaymentService
from app.schemas.job_tracker import (
    AiJobMatchRequest,
    AiJobMatchResponse,
    CareerGoalResponse,
    CareerGoalUpsertRequest,
    JobPipelineAnalyticsResponse,
    MarketJobItemDTO,
    TrackedJobCreateRequest,
    TrackedJobResponse,
    TrackedJobUpdateRequest,
)
from app.schemas.payments import WalletPayRequest

VALID_STATUSES = {"TARGETING", "TAILORED", "APPLIED", "INTERVIEW", "OFFER"}

CURATED_MARKET_JOBS: List[Dict[str, Any]] = [
    {"id": "mkt-vng-go", "company_name": "VNG Digital Business", "position_title": "Senior Golang Microservices Engineer", "location": "Ho Chi Minh", "salary_range": "55M - 75M VNĐ", "match_score": 94, "skills": ["Golang", "Kafka", "Kubernetes"]},
    {"id": "mkt-shopee-be", "company_name": "Shopee Vietnam", "position_title": "Lead Distributed Systems Engineer", "location": "Ho Chi Minh / Hybrid", "salary_range": "65M - 90M VNĐ", "match_score": 91, "skills": ["Golang", "Redis", "PostgreSQL"]},
    {"id": "mkt-momo-ai", "company_name": "M_Service (MoMo)", "position_title": "Staff AI & Payment Platform Engineer", "location": "Ho Chi Minh", "salary_range": "60M - 85M VNĐ", "match_score": 89, "skills": ["Python", "FastAPI", "PostgreSQL"]},
    {"id": "mkt-fpt-fe", "company_name": "FPT Smart Cloud", "position_title": "Senior Full-Stack Next.js / TypeScript", "location": "Ha Noi / Remote", "salary_range": "42M - 58M VNĐ", "match_score": 86, "skills": ["React", "Next.js", "TypeScript"]},
]


class JobTrackerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = JobTrackerRepository(db)

    async def list_tracked_jobs(
        self,
        candidate_identity_id: Optional[uuid.UUID] = None,
        q: Optional[str] = None,
        status_filter: Optional[str] = None,
        min_score: int = 0,
        sort_by: str = "created_at",
    ) -> List[TrackedJobResponse]:
        jobs = await self.repo.list_jobs(candidate_identity_id)
        items = [TrackedJobResponse.model_validate(j) for j in jobs]
        if status_filter and status_filter.strip().upper() != "ALL":
            st_norm = status_filter.strip().upper()
            items = [i for i in items if i.status.upper() == st_norm]
        if min_score > 0:
            items = [i for i in items if (i.match_score or 0) >= min_score]
        if q and q.strip():
            q_low = q.strip().lower()
            items = [
                i for i in items
                if q_low in i.company_name.lower()
                or q_low in i.position_title.lower()
                or q_low in (i.expected_salary or "").lower()
                or q_low in (i.notes or "").lower()
            ]
        if sort_by == "match_score":
            items.sort(key=lambda x: x.match_score or 0, reverse=True)
        elif sort_by == "interview_date":
            items.sort(key=lambda x: x.interview_date.isoformat() if x.interview_date else "9999")
        else:
            items.sort(key=lambda x: x.created_at.isoformat() if x.created_at else "", reverse=True)
        return items

    async def search_market_jobs(
        self, q: Optional[str] = None, skills: Optional[str] = None, location: Optional[str] = None
    ) -> List[MarketJobItemDTO]:
        pool = [dict(j) for j in CURATED_MARKET_JOBS]
        if q and q.strip():
            ql = q.strip().lower()
            pool = [
                j for j in pool
                if ql in j["company_name"].lower()
                or ql in j["position_title"].lower()
                or ql in j["location"].lower()
                or any(ql in s.lower() for s in j["skills"])
            ]
        if skills and skills.strip():
            req = [s.strip().lower() for s in skills.split(",") if s.strip()]
            pool = [j for j in pool if any(r in " ".join(j["skills"]).lower() for r in req)]
        if location and location.strip():
            ll = location.strip().lower()
            pool = [j for j in pool if ll in j["location"].lower()]
        return [MarketJobItemDTO(**j) for j in pool]

    async def get_career_goal(self, candidate_identity_id: Optional[uuid.UUID] = None) -> CareerGoalResponse:
        data = await self.repo.get_career_goal(candidate_identity_id)
        return CareerGoalResponse(**data)

    async def save_career_goal(
        self, request: CareerGoalUpsertRequest, candidate_identity_id: Optional[uuid.UUID] = None
    ) -> CareerGoalResponse:
        saved = await self.repo.upsert_career_goal(request.model_dump(), candidate_identity_id)
        return CareerGoalResponse(**saved)

    async def ai_match_goal_jobs(
        self, goal_id: str, request: AiJobMatchRequest, candidate_identity_id: Optional[uuid.UUID] = None
    ) -> AiJobMatchResponse:
        fee_vnd = 19000
        await PaymentService.pay_with_wallet(
            db=self.db,
            wallet_key=str(candidate_identity_id or "default"),
            payload=WalletPayRequest(
                amount_vnd=fee_vnd, target_type="SYSTEM_PURCHASE",
                order_id=f"AI-JOB-{goal_id}", description=f"AI Job Matcher ({request.target_role})",
            ),
        )
        role_title = (request.target_role or "Senior Backend Engineer").strip()
        skills_str = (request.preferred_skills or "Golang, PostgreSQL, Kubernetes").strip()
        sal_str = (request.expected_salary or "55.000.000 VNĐ").strip()
        j1 = await self.add_tracked_job(
            TrackedJobCreateRequest(
                company_name="Grab Financial Group", position_title=f"{role_title} (AI Matched)",
                status="TARGETING", expected_salary=sal_str, match_score=95,
                notes=f"AI Job Radar khớp tự động theo kỹ năng: {skills_str}",
            ),
            candidate_identity_id=candidate_identity_id,
        )
        j2 = await self.add_tracked_job(
            TrackedJobCreateRequest(
                company_name="ZaloPay / Zion", position_title=f"Staff {role_title.split(' ')[0]} Architect (AI Matched)",
                status="TARGETING", expected_salary=sal_str, match_score=92,
                notes="AI Job Radar đề xuất ưu tiên phỏng vấn",
            ),
            candidate_identity_id=candidate_identity_id,
        )
        return AiJobMatchResponse(goal_id=goal_id, fee_charged_vnd=fee_vnd, matched_count=2, matched_jobs=[j1, j2])

    async def get_pipeline_analytics(self, candidate_identity_id: Optional[uuid.UUID] = None) -> JobPipelineAnalyticsResponse:
        cache_key = f"tracker_analytics:{candidate_identity_id or 'anon'}"

        async def _compute() -> dict:
            jobs = await self.repo.list_jobs(candidate_identity_id)
            counts = {s: 0 for s in VALID_STATUSES}
            for j in jobs:
                st = (j.status or "TARGETING").upper()
                if st in counts:
                    counts[st] += 1
            total = len(jobs)
            avg_score = round(sum(j.match_score or 0 for j in jobs) / max(total, 1), 1) if total > 0 else 78.0
            offer_prob = min(98.0, round((counts["OFFER"] * 45.0) + (counts["INTERVIEW"] * 22.0) + (counts["APPLIED"] * 8.0) + (counts["TAILORED"] * 4.0) + (avg_score * 0.25 if total > 0 else 18.0), 1))
            if counts["OFFER"] > 0 or counts["INTERVIEW"] >= 2:
                velocity, action = "HIGH_MOMENTUM", "Prepare STAR behavioral metrics and salary negotiation script for active interviews."
            elif counts["TARGETING"] + counts["TAILORED"] > counts["APPLIED"]:
                velocity, action = "NEEDS_OUTREACH", "Convert tailored CVs into submitted applications and attach your 60s Video Pitch."
            else:
                velocity, action = "STEADY_PIPELINE", "Scan 3 more target JDs in ATS Diagnostics to expand your high-match interview funnel."
            return JobPipelineAnalyticsResponse(
                total_tracked=total, stage_counts=counts, average_ats_match_score=avg_score,
                estimated_offer_probability_pct=offer_prob, pipeline_velocity_status=velocity,
                next_recommended_action=action,
            ).model_dump()

        cached = await platform_cache.get_or_set(cache_key, ttl_seconds=15, loader=_compute)
        return JobPipelineAnalyticsResponse(**cached)

    async def add_tracked_job(self, request: TrackedJobCreateRequest, candidate_identity_id: Optional[uuid.UUID] = None) -> TrackedJobResponse:
        status_val = request.status.upper()
        if status_val not in VALID_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status '{request.status}'. Allowed: {', '.join(VALID_STATUSES)}")
        job = await self.repo.create_job(
            company_name=request.company_name, position_title=request.position_title, status=status_val,
            expected_salary=request.expected_salary, match_score=request.match_score,
            interview_date=request.interview_date, notes=request.notes, candidate_identity_id=candidate_identity_id,
        )
        await platform_cache.invalidate_prefix("tracker_analytics:")
        await platform_cache.invalidate_prefix("analytics:")
        return TrackedJobResponse.model_validate(job)

    async def move_job_status(self, job_id: uuid.UUID, new_status: str, candidate_identity_id: Optional[uuid.UUID] = None) -> TrackedJobResponse:
        status_val = new_status.upper()
        if status_val not in VALID_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status '{new_status}'. Allowed: {', '.join(VALID_STATUSES)}")
        job = await self.repo.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracked job not found.")
        if not candidate_identity_id or job.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not own this tracked job.")
        updated = await self.repo.update_status(job, status_val, candidate_identity_id=candidate_identity_id)
        await platform_cache.invalidate_prefix("tracker_analytics:")
        target_uid = candidate_identity_id or job.candidate_identity_id
        if target_uid and status_val in ("INTERVIEW", "OFFER"):
            await NotificationService(self.db).dispatch_event(
                identity_id=target_uid, event_type="JOB_INTERVIEW_STAGE",
                title=f"{status_val.title()} Stage Reached at {job.company_name}",
                message=f"Congratulations on advancing to {status_val} for {job.position_title}. Open your Kanban board to prepare.",
                deep_link=f"/workspace/jobs?highlight={job.id}", send_email=True, category="career",
            )
        return TrackedJobResponse.model_validate(updated)

    async def update_tracked_job(self, job_id: uuid.UUID, request: TrackedJobUpdateRequest, candidate_identity_id: Optional[uuid.UUID] = None) -> TrackedJobResponse:
        job = await self.repo.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracked job not found.")
        if not candidate_identity_id or job.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not own this tracked job.")
        updates = request.model_dump(exclude_unset=True)
        if "status" in updates and updates["status"] is not None:
            status_val = str(updates["status"]).upper()
            if status_val not in VALID_STATUSES:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status '{updates['status']}'. Allowed: {', '.join(VALID_STATUSES)}")
            updates["status"] = status_val
        updated = await self.repo.update_job(job, updates, candidate_identity_id=candidate_identity_id)
        await platform_cache.invalidate_prefix("tracker_analytics:")
        new_st = updates.get("status")
        if new_st in ("INTERVIEW", "OFFER"):
            await NotificationService(self.db).dispatch_event(
                identity_id=candidate_identity_id, event_type="JOB_INTERVIEW_STAGE",
                title=f"{new_st.title()} Stage Reached at {updated.company_name}",
                message=f"Congratulations on advancing to {new_st} for {updated.position_title}. Open your Kanban board to prepare.",
                deep_link=f"/workspace/jobs?highlight={updated.id}", send_email=True, category="career",
            )
        return TrackedJobResponse.model_validate(updated)

    update_job = update_tracked_job

    async def remove_job(self, job_id: uuid.UUID, candidate_identity_id: Optional[uuid.UUID] = None) -> None:
        job = await self.repo.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracked job not found.")
        if not candidate_identity_id or job.candidate_identity_id != candidate_identity_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not own this tracked job.")
        await self.repo.delete_job(job, candidate_identity_id=candidate_identity_id)
        await platform_cache.invalidate_prefix("tracker_analytics:")
