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

PIPELINE_STAGES = {"SHORTLISTED", "PITCH_REVIEWED", "INTERVIEW_INVITED", "OFFER_SENT", "HIRED"}


class BookmarkService:
    """Domain service for candidate shortlist bookmarks and B2B Recruiter Hiring Hub."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BookmarkRepository(db)

    @staticmethod
    def _cache_key(recruiter_identity_id: uuid.UUID) -> str:
        return f"bookmarks:recruiter:{recruiter_identity_id}"

    @staticmethod
    def _stage(raw: str) -> str:
        stage = (raw or "").strip().upper()
        if stage not in PIPELINE_STAGES:
            raise HTTPException(status_code=400, detail=f"Invalid stage '{raw}'. Allowed: {', '.join(sorted(PIPELINE_STAGES))}")
        return stage

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

    async def list_pipeline(self, recruiter_identity_id: uuid.UUID) -> List[RecruiterPipelineItemDTO]:
        return [RecruiterPipelineItemDTO(**r) for r in await self.repo.list_pipeline_rows(recruiter_identity_id)]

    async def add_to_pipeline(
        self,
        recruiter_identity_id: uuid.UUID,
        payload: RecruiterPipelineCreateRequest,
    ) -> RecruiterPipelineItemDTO:
        stage = self._stage(payload.stage)
        clean_uname = payload.username.strip().lstrip("@")
        cand = await self.repo.get_visible_candidate(clean_uname)
        if not cand or cand.get("is_hidden"):
            raise HTTPException(status_code=404, detail="Candidate profile not found or hidden.")
        skills = cand.get("skills") or []
        item = {
            "username": cand["username"],
            "full_name": cand["full_name"],
            "headline": cand["headline"],
            "target_role": payload.target_role,
            "stage": stage,
            "ats_score": 90,
            "years_experience": 5,
            "expected_salary": "Negotiable",
            "video_pitch_url": f"/videos/pitch-{cand['username']}.mp4",
            "matched_skills": skills[:4],
            "missing_skills": ["Kubernetes"] if "Kubernetes" not in skills else [],
            "recruiter_rating": payload.recruiter_rating,
            "evaluation_notes": payload.evaluation_notes,
            "contact_unlocked": False,
            "interview_datetime": None,
        }
        saved = await self.repo.upsert_pipeline_row(recruiter_identity_id, item)
        await self.db.commit()
        return RecruiterPipelineItemDTO(**saved)

    async def update_pipeline_item(
        self,
        recruiter_identity_id: uuid.UUID,
        item_id: str,
        payload: RecruiterPipelineUpdateRequest,
    ) -> RecruiterPipelineItemDTO:
        updates = payload.model_dump(exclude_unset=True)
        if updates.get("stage") is not None:
            updates["stage"] = self._stage(updates["stage"])
        try:
            item_uuid = uuid.UUID(item_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="Pipeline item not found.")
        # Owner-scoped UPDATE: another recruiter's id is indistinguishable from a missing one (404, no existence leak).
        updated = await self.repo.update_pipeline_row(recruiter_identity_id, item_uuid, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Pipeline item not found.")
        await self.db.commit()
        return RecruiterPipelineItemDTO(**updated)

    async def compare_candidates(self, payload: RecruiterCompareRequest) -> RecruiterCompareResponse:
        jd_low = (payload.jd_text or "Golang Python FastAPI React PostgreSQL Kubernetes").lower()
        target_skills = [sk for sk in ["Golang", "Python", "FastAPI", "React", "PostgreSQL", "Kubernetes", "Docker", "TypeScript"] if sk.lower() in jd_low]
        if not target_skills:
            target_skills = ["Golang", "PostgreSQL", "Kubernetes", "React"]
        out: List[RecruiterCompareItemDTO] = []
        wanted = [u.strip().lstrip("@") for u in payload.usernames[:3]]
        found = await self.repo.get_visible_candidates(wanted)
        for idx, clean in enumerate(wanted):
            cand = found.get(clean.lower())
            if not cand:
                continue
            cand_skills = cand.get("skills") or []
            matched = [s for s in cand_skills if s in target_skills] or cand_skills[:3]
            missing = [s for s in target_skills if s not in matched][:2]
            score = min(98, 84 + len(matched) * 3 - idx)
            out.append(
                RecruiterCompareItemDTO(
                    username=cand["username"],
                    full_name=cand["full_name"],
                    headline=cand["headline"],
                    ats_score=score,
                    matched_skills=matched,
                    missing_skills=missing,
                    years_experience=5,
                    expected_salary="60.000.000 VNĐ",
                    video_pitch_url=f"/videos/pitch-{cand['username']}.mp4",
                    differentiator="Verified 60s Video Pitch & High-Concurrency Architecture Fit",
                )
            )
        return RecruiterCompareResponse(comparisons=out)

    async def invite_candidate(
        self,
        recruiter_identity_id: uuid.UUID,
        payload: RecruiterInviteRequest,
    ) -> RecruiterPipelineItemDTO:
        clean = payload.username.strip().lstrip("@")
        cand = await self.repo.get_visible_candidate(clean)
        if not cand or cand.get("is_hidden") or not cand.get("identity_id"):
            raise HTTPException(status_code=404, detail="Candidate profile not found or hidden.")
        rkey = str(recruiter_identity_id)
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
            "username": cand["username"],
            "full_name": cand["full_name"],
            "headline": cand["headline"],
            "target_role": payload.job_title,
            "stage": "INTERVIEW_INVITED",
            "ats_score": 94,
            "years_experience": 5,
            "expected_salary": payload.offered_salary_range,
            "video_pitch_url": f"/videos/pitch-{cand['username']}.mp4",
            "matched_skills": cand.get("skills") or [],
            "missing_skills": [],
            "recruiter_rating": 5,
            "evaluation_notes": f"Invited for {payload.job_title} at {payload.interview_datetime}",
            "contact_unlocked": bool(payload.unlock_contact_via_wallet),
            "interview_datetime": payload.interview_datetime,
        }
        target_uid = cand["identity_id"]
        # Pipeline card, candidate notification and candidate Kanban card commit together (one transaction).
        saved = await self.repo.upsert_pipeline_row(recruiter_identity_id, item)
        await NotificationService(self.db).dispatch_event(
            identity_id=target_uid,
            event_type="RECRUITER_INTERVIEW_INVITE",
            title=f"Lời mời phỏng vấn vị trí {payload.job_title}",
            message=f"Nhà tuyển dụng B2B mời bạn phỏng vấn ({payload.interview_datetime}) với mức lương đề xuất {payload.offered_salary_range}.",
            deep_link="/workspace/jobs",
            send_email=True,
            category="career",
            auto_commit=False,
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
            commit=False,
        )
        await self.db.commit()
        return RecruiterPipelineItemDTO(**saved)
