"""Candidate Shortlist Bookmarks & B2B Recruiter Hiring Hub service (Vertical Module: bookmarks).

Coordinates recruiter shortlist business rules, hiring pipeline stages, candidate comparison,
interview invitations with Wallet contact unlock, and SWR cache invalidation.
"""

from typing import Any, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.bookmarks.repository import BookmarkRepository
from app.modules.job_tracker import JobTrackerService
from app.modules.notifications import NotificationService
from app.modules.payments import PaymentService
from app.schemas.bookmarks import (
    RecruiterCompareItemDTO,
    RecruiterCompareRequest,
    RecruiterCompareResponse,
    RecruiterInviteRequest,
    RecruiterPipelineCreateRequest,
    RecruiterPipelineItemDTO,
    RecruiterPipelineUpdateRequest,
)
from app.schemas.job_tracker import TrackedJobCreateRequest
from app.schemas.payments import WalletPayRequest

SEEDED_PIPELINE: List[dict[str, Any]] = [
    {"id": "pipe-1", "username": "phucnguyen", "full_name": "Nguyễn Minh Phúc", "headline": "Principal Distributed Systems & Golang Architect", "target_role": "Principal Engineer", "stage": "INTERVIEW_INVITED", "ats_score": 96, "years_experience": 7, "expected_salary": "75.000.000 VNĐ", "video_pitch_url": "/videos/pitch-phuc.mp4", "matched_skills": ["Golang", "PostgreSQL", "Kubernetes", "FastAPI"], "missing_skills": [], "recruiter_rating": 5, "evaluation_notes": "Kiến trúc sư hệ thống xuất sắc, tối ưu 25k CCU thực chiến.", "contact_unlocked": True, "interview_datetime": "2026-10-25 14:00"},
    {"id": "pipe-2", "username": "huypham", "full_name": "Phạm Gia Huy", "headline": "Senior Backend & Cloud Native Engineer", "target_role": "Principal Engineer", "stage": "SHORTLISTED", "ats_score": 91, "years_experience": 5, "expected_salary": "60.000.000 VNĐ", "video_pitch_url": "/videos/pitch-huy.mp4", "matched_skills": ["Golang", "PostgreSQL", "Docker"], "missing_skills": ["Kubernetes"], "recruiter_rating": 4, "evaluation_notes": "Nền tảng Golang & Microservices rất vững.", "contact_unlocked": False, "interview_datetime": None},
    {"id": "pipe-3", "username": "maivo", "full_name": "Võ Thị Mai", "headline": "Staff Full-Stack React 19 & FastAPI Lead", "target_role": "Staff Full-Stack Engineer", "stage": "PITCH_REVIEWED", "ats_score": 89, "years_experience": 5, "expected_salary": "58.000.000 VNĐ", "video_pitch_url": "/videos/pitch-mai.mp4", "matched_skills": ["React", "TypeScript", "FastAPI", "PostgreSQL"], "missing_skills": ["Golang"], "recruiter_rating": 5, "evaluation_notes": "Video Pitch 60s trình bày rõ ràng, tốc độ làm sản phẩm rất nhanh.", "contact_unlocked": False, "interview_datetime": None},
]


class BookmarkService:
    """Domain service for candidate shortlist bookmarks and B2B Recruiter Hiring Hub."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BookmarkRepository(db)

    @staticmethod
    def _cache_key(recruiter_identity_id: uuid.UUID) -> str:
        return f"bookmarks:recruiter:{recruiter_identity_id}"

    @staticmethod
    def _recruiter_key(recruiter_identity_id: Optional[uuid.UUID]) -> str:
        return str(recruiter_identity_id) if recruiter_identity_id else "default"

    async def list_bookmarks(self, recruiter_identity_id: uuid.UUID) -> list[dict[str, Any]]:
        return await platform_cache.get_or_set(
            self._cache_key(recruiter_identity_id),
            ttl_seconds=60,
            stale_ttl_seconds=120,
            loader=lambda: self.repo.list_by_recruiter(recruiter_identity_id),
        )

    async def add_bookmark(
        self,
        recruiter_identity_id: uuid.UUID,
        username: str,
        note: Optional[str] = None,
    ) -> dict[str, Any]:
        item = await self.repo.upsert_bookmark(
            recruiter_identity_id=recruiter_identity_id,
            username=username,
            note=note,
        )
        if not item:
            raise HTTPException(
                status_code=404,
                detail="Candidate profile not found or hidden",
            )
        await self.db.commit()
        await platform_cache.invalidate_prefix(self._cache_key(recruiter_identity_id))
        await platform_cache.invalidate_prefix("analytics:")
        return item

    async def remove_bookmark(
        self,
        recruiter_identity_id: uuid.UUID,
        username: str,
    ) -> dict[str, str]:
        deleted = await self.repo.delete_bookmark(
            recruiter_identity_id=recruiter_identity_id,
            username=username,
        )
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Bookmark not found",
            )
        await self.db.commit()
        await platform_cache.invalidate_prefix(self._cache_key(recruiter_identity_id))
        await platform_cache.invalidate_prefix("analytics:")
        return {"status": "deleted", "username": username.strip()}

    async def list_pipeline(self, recruiter_identity_id: Optional[uuid.UUID] = None) -> List[RecruiterPipelineItemDTO]:
        rkey = self._recruiter_key(recruiter_identity_id)
        persisted = await self.repo.list_pipeline_rows(rkey)
        seen = {p["username"].lower() for p in persisted}
        merged = list(persisted) + [dict(s) for s in SEEDED_PIPELINE if s["username"].lower() not in seen]
        return [RecruiterPipelineItemDTO(**m) for m in merged]

    async def add_to_pipeline(
        self,
        recruiter_identity_id: Optional[uuid.UUID],
        payload: RecruiterPipelineCreateRequest,
    ) -> RecruiterPipelineItemDTO:
        clean_uname = payload.username.strip().lstrip("@")
        cand = await self.repo.get_visible_candidate(clean_uname)
        if cand and cand.get("is_hidden"):
            raise HTTPException(status_code=404, detail="Candidate profile is hidden or private.")
        skills = cand["skills"] if cand and cand.get("skills") else ["Golang", "React", "PostgreSQL"]
        item = {
            "id": str(uuid.uuid4()),
            "username": cand["username"] if cand else clean_uname,
            "full_name": cand["full_name"] if cand else clean_uname.upper(),
            "headline": cand["headline"] if cand else "Senior Software Engineer",
            "target_role": payload.target_role,
            "stage": payload.stage.upper(),
            "ats_score": 90,
            "years_experience": 5,
            "expected_salary": "55.000.000 VNĐ",
            "video_pitch_url": f"/videos/pitch-{clean_uname}.mp4",
            "matched_skills": skills[:4],
            "missing_skills": ["Kubernetes"] if "Kubernetes" not in skills else [],
            "recruiter_rating": payload.recruiter_rating,
            "evaluation_notes": payload.evaluation_notes,
            "contact_unlocked": False,
            "interview_datetime": None,
        }
        saved = await self.repo.upsert_pipeline_row(self._recruiter_key(recruiter_identity_id), item)
        return RecruiterPipelineItemDTO(**saved)

    async def update_pipeline_item(
        self,
        recruiter_identity_id: Optional[uuid.UUID],
        item_id: str,
        payload: RecruiterPipelineUpdateRequest,
    ) -> RecruiterPipelineItemDTO:
        updates = payload.model_dump(exclude_unset=True)
        updated = await self.repo.update_pipeline_by_id(item_id, updates)
        if updated:
            return RecruiterPipelineItemDTO(**updated)
        for s in SEEDED_PIPELINE:
            if s["id"] == item_id:
                merged = {**s, **{k: v for k, v in updates.items() if v is not None}}
                saved = await self.repo.upsert_pipeline_row(self._recruiter_key(recruiter_identity_id), merged)
                return RecruiterPipelineItemDTO(**saved)
        raise HTTPException(status_code=404, detail="Pipeline item not found.")

    async def compare_candidates(self, payload: RecruiterCompareRequest) -> RecruiterCompareResponse:
        jd_low = (payload.jd_text or "Golang Python FastAPI React PostgreSQL Kubernetes").lower()
        target_skills = [sk for sk in ["Golang", "Python", "FastAPI", "React", "PostgreSQL", "Kubernetes", "Docker", "TypeScript"] if sk.lower() in jd_low]
        if not target_skills:
            target_skills = ["Golang", "PostgreSQL", "Kubernetes", "React"]
        out: List[RecruiterCompareItemDTO] = []
        for idx, uname in enumerate(payload.usernames[:3]):
            clean = uname.strip().lstrip("@")
            cand = await self.repo.get_visible_candidate(clean)
            if cand and cand.get("is_hidden"):
                continue
            seeded = next((s for s in SEEDED_PIPELINE if s["username"].lower() == clean.lower()), None)
            cand_skills = (cand.get("skills") if cand else None) or (seeded["matched_skills"] if seeded else ["Golang", "FastAPI", "PostgreSQL", "React"])
            matched = [s for s in cand_skills if s in target_skills] or cand_skills[:3]
            missing = [s for s in target_skills if s not in matched][:2]
            score = min(98, 84 + len(matched) * 3 - idx)
            out.append(
                RecruiterCompareItemDTO(
                    username=cand["username"] if cand else clean,
                    full_name=(cand["full_name"] if cand else (seeded["full_name"] if seeded else clean.upper())),
                    headline=(cand["headline"] if cand else (seeded["headline"] if seeded else "Senior Software Engineer")),
                    ats_score=score,
                    matched_skills=matched,
                    missing_skills=missing,
                    years_experience=seeded["years_experience"] if seeded else 5,
                    expected_salary=seeded["expected_salary"] if seeded else "60.000.000 VNĐ",
                    video_pitch_url=seeded["video_pitch_url"] if seeded else f"/videos/pitch-{clean}.mp4",
                    differentiator="Verified 60s Video Pitch & High-Concurrency Architecture Fit",
                )
            )
        return RecruiterCompareResponse(comparisons=out)

    async def invite_candidate(
        self,
        recruiter_identity_id: Optional[uuid.UUID],
        payload: RecruiterInviteRequest,
    ) -> RecruiterPipelineItemDTO:
        clean = payload.username.strip().lstrip("@")
        cand = await self.repo.get_visible_candidate(clean)
        if cand and cand.get("is_hidden"):
            raise HTTPException(status_code=404, detail="Candidate profile is hidden or private.")
        rkey = self._recruiter_key(recruiter_identity_id)
        if payload.unlock_contact_via_wallet:
            await PaymentService.pay_with_wallet(
                db=self.db,
                wallet_key=rkey,
                payload=WalletPayRequest(
                    amount_vnd=49000,
                    target_type="SYSTEM_PURCHASE",
                    order_id=f"B2B-INV-{clean}-{uuid.uuid4().hex[:6]}",
                    description=f"B2B Contact Unlock & Interview Invite: @{clean}",
                ),
            )
        item = {
            "id": str(uuid.uuid4()),
            "username": cand["username"] if cand else clean,
            "full_name": cand["full_name"] if cand else clean.upper(),
            "headline": cand["headline"] if cand else "Senior Software Engineer",
            "target_role": payload.job_title,
            "stage": "INTERVIEW_INVITED",
            "ats_score": 94,
            "years_experience": 5,
            "expected_salary": payload.offered_salary_range,
            "video_pitch_url": f"/videos/pitch-{clean}.mp4",
            "matched_skills": (cand.get("skills") if cand else None) or ["Golang", "PostgreSQL", "Kubernetes"],
            "missing_skills": [],
            "recruiter_rating": 5,
            "evaluation_notes": f"Invited for {payload.job_title} at {payload.interview_datetime}",
            "contact_unlocked": bool(payload.unlock_contact_via_wallet),
            "interview_datetime": payload.interview_datetime,
        }
        saved = await self.repo.upsert_pipeline_row(rkey, item)
        target_uid = (cand.get("identity_id") if cand else None) or recruiter_identity_id
        if target_uid:
            await NotificationService(self.db).dispatch_event(
                identity_id=target_uid,
                event_type="RECRUITER_INTERVIEW_INVITE",
                title=f"Lời mời phỏng vấn vị trí {payload.job_title}",
                message=f"Nhà tuyển dụng B2B mời bạn phỏng vấn ({payload.interview_datetime}) với mức lương đề xuất {payload.offered_salary_range}.",
                deep_link="/workspace/jobs",
                send_email=True,
                category="career",
            )
            await JobTrackerService(self.db).add_tracked_job(
                TrackedJobCreateRequest(
                    company_name="Belooga Enterprise Partner",
                    position_title=payload.job_title,
                    status="INTERVIEW",
                    expected_salary=payload.offered_salary_range,
                    match_score=94,
                    notes=f"B2B Direct Invite ({payload.interview_datetime}) — Prompt: {payload.custom_video_prompt or '60s Pitch'}",
                ),
                candidate_identity_id=target_uid,
            )
        return RecruiterPipelineItemDTO(**saved)

