"""Timeline service (Vertical Module: timeline).

Business domain service managing work history, academic credentials, awards,
and pessimistic row-locking atomic reordering.
"""

from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_candidate_cache, platform_cache
from app.core.security import AuthenticatedUser, verify_profile_owner
from app.modules.profile import ProfileService
from app.modules.timeline.repository import TimelineRepository
from app.schemas.timeline import (
    AwardCertificationCreate, AwardOrderList, AwardUpdate, CareerTrajectoryResponse,
    EducationExperienceCreate, EducationUpdate, JobExperienceCreate, JobExperienceUpdate,
    ReorderItem, ReorderRequest,
)


def _extract_order_pairs(payload: ReorderRequest) -> List[tuple[uuid.UUID, int]]:
    raw_list = payload.orders or payload.items or payload.award_ids or []
    return [
        (uuid.UUID(str(item.id)), item.resolved_order) if isinstance(item, ReorderItem) else (uuid.UUID(str(item)), idx)
        for idx, item in enumerate(raw_list)
    ]


class TimelineService:
    """Service layer managing timeline experiences and atomic display order locks."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_facade = ProfileService(db)
        self.timeline_repo = TimelineRepository(db)

    async def _require_owned_profile(self, username: str, current_user: AuthenticatedUser):
        verify_profile_owner(current_user, username)
        profile = await self.profile_facade.get_by_username(username.lower().strip())
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return profile

    async def _require_visible_profile(self, username: str, current_user: Optional[AuthenticatedUser] = None):
        uname = username.lower().strip()
        profile = await self.profile_facade.get_by_username(uname)
        is_owner = current_user is not None and (current_user.username.lower().strip() == uname or current_user.role == "admin")
        if not profile or (profile.is_hidden and not is_owner):
            raise HTTPException(status_code=404, detail="Profile is private or not found")
        return profile

    @staticmethod
    def _parse_item_uuid(item_id: str, not_found_detail: str) -> uuid.UUID:
        try:
            return uuid.UUID(str(item_id))
        except ValueError:
            raise HTTPException(status_code=404, detail=not_found_detail)

    async def _reorder_section(
        self, username: str, payload: ReorderRequest, current_user: AuthenticatedUser,
        lock_fn: Any, update_fn: Any, msg: str,
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        try:
            profile = await self.profile_facade.get_by_username(username.lower().strip())
            if not profile:
                raise HTTPException(status_code=404, detail="Candidate not found")
            await lock_fn(profile.id)
            await update_fn(profile.id, _extract_order_pairs(payload))
            await self.db.commit()
            await invalidate_candidate_cache(username)
        except Exception:
            await self.db.rollback()
            raise
        return {"message": msg}

    async def _delete_item(
        self, username: str, item_id: str, current_user: AuthenticatedUser,
        del_fn: Any, detail: str, msg: str,
    ) -> Dict[str, str]:
        profile = await self._require_owned_profile(username, current_user)
        target_uuid = self._parse_item_uuid(item_id, detail)
        if not await del_fn(profile.id, target_uuid):
            raise HTTPException(status_code=404, detail=detail)
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"message": msg}

    async def list_job_experiences(self, username: str, current_user: Optional[AuthenticatedUser] = None) -> List[Dict[str, Any]]:
        await self._require_visible_profile(username, current_user)
        return await self.timeline_repo.list_jobs_by_username(username)

    async def create_job_experience(self, username: str, payload: JobExperienceCreate, current_user: AuthenticatedUser) -> Dict[str, Any]:
        profile = await self._require_owned_profile(username, current_user)
        next_order = await self.timeline_repo.get_next_job_order(profile.id)
        item_id = await self.timeline_repo.create_job(
            profile_id=profile.id, title=payload.title, company_name=payload.company_name,
            from_date_month=payload.from_date_month, from_date_year=payload.from_date_year,
            currently_work_here=payload.currently_work_here, to_date_month=payload.to_date_month,
            to_date_year=payload.to_date_year, description=payload.description,
            logo_url=payload.logo_url, display_order=next_order,
        )
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"id": str(item_id), "display_order": next_order, "message": "Job experience added"}

    async def update_job_experience(self, username: str, item_id: str, payload: JobExperienceUpdate, current_user: AuthenticatedUser) -> Dict[str, str]:
        profile = await self._require_owned_profile(username, current_user)
        detail = "Job experience not found on this profile"
        target_uuid = self._parse_item_uuid(item_id, detail)
        if not await self.timeline_repo.update_job(profile.id, target_uuid, **payload.model_dump(exclude_unset=True)):
            raise HTTPException(status_code=404, detail=detail)
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"id": str(target_uuid), "message": "Job experience updated"}

    async def delete_job_experience(self, username: str, item_id: str, current_user: AuthenticatedUser) -> Dict[str, str]:
        return await self._delete_item(
            username, item_id, current_user, self.timeline_repo.delete_job,
            "Job experience not found on this profile", "Job experience deleted",
        )

    async def reorder_job_experiences(self, username: str, payload: ReorderRequest, current_user: AuthenticatedUser) -> Dict[str, str]:
        return await self._reorder_section(
            username, payload, current_user,
            self.timeline_repo.lock_jobs_for_update, self.timeline_repo.bulk_update_job_orders,
            "Job experiences reordered successfully",
        )

    async def list_education_experiences(self, username: str, current_user: Optional[AuthenticatedUser] = None) -> List[Dict[str, Any]]:
        await self._require_visible_profile(username, current_user)
        return await self.timeline_repo.list_education_by_username(username)

    async def create_education(self, username: str, payload: EducationExperienceCreate, current_user: AuthenticatedUser) -> Dict[str, Any]:
        profile = await self._require_owned_profile(username, current_user)
        next_order = await self.timeline_repo.get_next_education_order(profile.id)
        item_id = await self.timeline_repo.create_education(
            profile_id=profile.id, school_name=payload.school_name, degree_name=payload.degree_name,
            gpa=payload.gpa, from_date_month=payload.from_date_month, from_date_year=payload.from_date_year,
            currently_work_here=payload.currently_work_here, to_date_month=payload.to_date_month,
            to_date_year=payload.to_date_year, description=payload.description, display_order=next_order,
        )
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"id": str(item_id), "display_order": next_order, "message": "Education added successfully"}

    async def update_education(self, username: str, item_id: str, payload: EducationUpdate, current_user: AuthenticatedUser) -> Dict[str, str]:
        profile = await self._require_owned_profile(username, current_user)
        detail = "Education experience not found on this profile"
        target_uuid = self._parse_item_uuid(item_id, detail)
        if not await self.timeline_repo.update_education(profile.id, target_uuid, **payload.model_dump(exclude_unset=True)):
            raise HTTPException(status_code=404, detail=detail)
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"id": str(target_uuid), "message": "Education experience updated"}

    async def delete_education(self, username: str, item_id: str, current_user: AuthenticatedUser) -> Dict[str, str]:
        return await self._delete_item(
            username, item_id, current_user, self.timeline_repo.delete_education,
            "Education experience not found on this profile", "Education experience deleted",
        )

    async def reorder_education_experiences(self, username: str, payload: ReorderRequest, current_user: AuthenticatedUser) -> Dict[str, str]:
        return await self._reorder_section(
            username, payload, current_user,
            self.timeline_repo.lock_education_for_update, self.timeline_repo.bulk_update_education_orders,
            "Education experiences reordered successfully",
        )

    async def list_awards(self, username: str, current_user: Optional[AuthenticatedUser] = None) -> List[Dict[str, Any]]:
        await self._require_visible_profile(username, current_user)
        return await self.timeline_repo.list_awards_by_username(username)

    async def create_award(self, username: str, payload: AwardCertificationCreate, current_user: AuthenticatedUser) -> Dict[str, Any]:
        profile = await self._require_owned_profile(username, current_user)
        loc = payload.issuer if payload.issuer and payload.location_name in (None, "Global") else (payload.location_name or "Global")
        f_year = payload.issued_year if payload.issued_year is not None else payload.from_date_year
        item_id = await self.timeline_repo.create_award(
            profile_id=profile.id, title=payload.title, location_name=loc,
            from_date_month=payload.from_date_month, from_date_year=f_year,
            currently_work_here=payload.currently_work_here, to_date_month=payload.to_date_month,
            to_date_year=payload.to_date_year, description=payload.description, logo_url=payload.logo_url,
        )
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {"id": str(item_id), "message": "Award certification added"}

    async def update_award(self, username: str, item_id: str, payload: AwardUpdate, current_user: AuthenticatedUser) -> Dict[str, Any]:
        profile = await self._require_owned_profile(username, current_user)
        detail = "Award certification not found on this profile"
        target_uuid = self._parse_item_uuid(item_id, detail)
        fields = payload.model_dump(exclude_unset=True)
        if "issuer" in fields:
            fields.setdefault("location_name", fields.pop("issuer"))
        if "issued_year" in fields:
            fields.setdefault("from_date_year", fields.pop("issued_year"))
        updated = await self.timeline_repo.update_award(profile.id, target_uuid, **fields)
        if not updated:
            raise HTTPException(status_code=404, detail=detail)
        await self.db.commit()
        await invalidate_candidate_cache(username)
        return {**updated, "id": str(updated["id"]), "message": "Award certification updated"}

    async def delete_award(self, username: str, item_id: str, current_user: AuthenticatedUser) -> Dict[str, str]:
        return await self._delete_item(
            username, item_id, current_user, self.timeline_repo.delete_award,
            "Award certification not found on this profile", "Award certification deleted",
        )

    async def reorder_awards(self, username: str, payload: AwardOrderList, current_user: AuthenticatedUser) -> Dict[str, str]:
        return await self._reorder_section(
            username, payload, current_user,
            self.timeline_repo.lock_awards_for_update, self.timeline_repo.bulk_update_award_orders,
            "Awards reordered successfully",
        )

    async def get_career_trajectory(self, username: str) -> CareerTrajectoryResponse:
        uname = username.lower().strip()

        async def _compute() -> Dict[str, Any]:
            bundle = await self.profile_facade.get_raw_profile_bundle(uname)
            if bool(bundle.get("is_hidden", False)):
                raise HTTPException(status_code=404, detail="Candidate not found")
            jobs = bundle.get("job_experiences") or []
            edus = bundle.get("education_experiences") or []
            skills = bundle.get("skills") or []
            job_titles = " ".join((j.get("title") or "") for j in jobs)
            text_blob = f"{bundle.get('headline') or ''} {bundle.get('bio') or ''} {job_titles}".lower()
            if any(k in text_blob for k in ("principal", "staff", "architect", "director", "vp", "cto")):
                cur_lvl, nxt_lvl = "Staff / Principal", "Distinguished / VP Engineering"
            elif any(k in text_blob for k in ("senior", "lead", "sr.", "manager")):
                cur_lvl, nxt_lvl = "Senior", "Staff / Principal"
            elif any(k in text_blob for k in ("junior", "intern", "fresher")):
                cur_lvl, nxt_lvl = "Junior", "Mid-Level"
            else:
                cur_lvl, nxt_lvl = "Mid-Level", "Senior"

            exp_count = len(jobs)
            now_dt = datetime.now(timezone.utc)
            total_months = 0
            for j in jobs:
                fy = j.get("from_date_year")
                if not fy:
                    continue
                fm = int(j.get("from_date_month") or 1)
                is_cur = bool(j.get("currently_work_here") or j.get("is_current"))
                ty = now_dt.year if is_cur or not j.get("to_date_year") else int(j["to_date_year"])
                tm = now_dt.month if is_cur or not j.get("to_date_month") else int(j["to_date_month"])
                total_months += max(1, (ty - int(fy)) * 12 + (tm - fm) + 1)
            tenure = (
                round(total_months / 12.0, 1)
                if total_months > 0
                else round(2.0 if "senior" in text_blob or "staff" in text_blob else 1.5, 1)
            )
            readiness = min(96, 58 + exp_count * 8 + (10 if edus else 0) + (12 if bundle.get("video_pitch_url") else 0))
            velocity = "Accelerated Fast-Track" if readiness >= 75 else "Steady Progression"

            gaps: List[str] = []
            has_metrics = any(
                re.search(r"\d+%|\d+x|\b\d+(?:k|m|ms|rps)\b", (j.get("description") or "").lower()) for j in jobs
            )
            if not has_metrics:
                gaps.append(f"Bổ sung chỉ số định lượng (SLA, RPS, Cost Saving) cho cột mốc tiến lên {nxt_lvl}.")
            if not bundle.get("video_pitch_url"):
                gaps.append("Hoàn thiện Video Pitch 60s nêu rõ kiến trúc hệ thống hoặc phạm vi dẫn dắt đội ngũ.")
            if len(skills) < 5:
                gaps.append(f"Mở rộng bộ kỹ năng cốt lõi ({len(skills)}/5 kỹ năng) để nâng cao độ sẵn sàng cho vị trí {nxt_lvl}.")
            if len(gaps) < 2:
                gaps.append(f"Mở rộng phạm vi ảnh hưởng liên phòng ban và dẫn dắt kiến trúc cho cấp bậc {nxt_lvl}.")
            return CareerTrajectoryResponse(
                username=bundle["username"], current_inferred_level=cur_lvl, next_target_level=nxt_lvl,
                promotion_readiness_pct=readiness, total_experience_entries=exp_count,
                estimated_tenure_years=tenure, trajectory_velocity=velocity, key_promotion_gaps=gaps,
            ).model_dump()

        cached = await platform_cache.get_or_set(f"trajectory:{uname}", ttl_seconds=60, loader=_compute)
        return CareerTrajectoryResponse(**cached)
