"""Full-Text Company Search, Multi-Facet Filter & Company Profile CRUD Service (BEL-191)."""

import re
from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, is_owner_or_admin
from app.modules.catalogs.repository import CatalogsRepository
from app.schemas.catalogs import (
    CompanyInterviewQuestionCreateRequest,
    CompanyInterviewQuestionItemDTO,
    CompanyProfileCreateRequest,
    CompanyProfileItemDTO,
    CompanyProfileUpdateRequest,
    CompanyReviewCreateRequest,
)

class CompaniesService:
    """Service layer for Company Directory search, multi-facet filtering, CRUD, and employee reviews."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CatalogsRepository(db)

    @staticmethod
    def _dto(row: Dict[str, Any]) -> CompanyProfileItemDTO:
        return CompanyProfileItemDTO(**{k: v for k, v in row.items() if k not in ("id", "owner_identity_id")})

    async def _all_companies(self) -> List[Dict[str, Any]]:
        return await self.repo.list_companies()

    async def _require_company(self, slug: str) -> Dict[str, Any]:
        row = await self.repo.get_company(slug)
        if not row:
            raise HTTPException(status_code=404, detail=f"Company '{slug}' not found.")
        return row

    async def search_companies(
        self,
        q: Optional[str] = None,
        tech_stack: Optional[str] = None,
        industry: Optional[str] = None,
        location: Optional[str] = None,
        company_size: Optional[str] = None,
        min_rating: float = 0.0,
        hiring_only: bool = False,
        sort_by: str = "rating",
    ) -> List[CompanyProfileItemDTO]:
        items = await self._all_companies()
        if hiring_only:
            items = [c for c in items if c.get("hiring_now", True)]
        if min_rating > 0:
            items = [c for c in items if float(c.get("avg_rating", 0)) >= min_rating]
        if industry and industry.strip().upper() != "ALL":
            ind_low = industry.strip().lower()
            items = [c for c in items if ind_low in str(c.get("industry", "")).lower()]
        if location and location.strip():
            loc_low = location.strip().lower()
            items = [c for c in items if loc_low in str(c.get("location", "")).lower()]
        if company_size and company_size.strip():
            sz_low = company_size.strip().lower()
            items = [c for c in items if sz_low in str(c.get("company_size", "")).lower()]
        if tech_stack and tech_stack.strip().lower() != "all":
            req_techs = [t.strip().lower() for t in tech_stack.split(",") if t.strip()]
            items = [
                c for c in items
                if any(rt in " ".join(c.get("tech_stack") or []).lower() for rt in req_techs)
            ]
        if q and q.strip():
            ql = q.strip().lower()
            items = [
                c for c in items
                if ql in str(c.get("name", "")).lower()
                or ql in str(c.get("industry", "")).lower()
                or ql in str(c.get("description", "")).lower()
                or any(ql in str(t).lower() for t in (c.get("tech_stack") or []))
            ]
        if sort_by == "open_jobs":
            items.sort(key=lambda x: int(x.get("open_jobs_count", 0)), reverse=True)
        elif sort_by == "salary":
            items.sort(key=lambda x: int(x.get("avg_salary_usd", 0)), reverse=True)
        else:
            items.sort(key=lambda x: float(x.get("avg_rating", 0)), reverse=True)
        return [self._dto(c) for c in items]

    async def get_company(self, slug: str) -> CompanyProfileItemDTO:
        return self._dto(await self._require_company(slug))

    async def create_company(self, payload: CompanyProfileCreateRequest, current_user: AuthenticatedUser) -> CompanyProfileItemDTO:
        slug = re.sub(r"[^a-z0-9]+", "-", (payload.slug or payload.name).strip().lower()).strip("-") or f"company-{uuid.uuid4().hex[:6]}"
        techs = payload.tech_stack or ["Golang", "React", "PostgreSQL"]
        data: Dict[str, Any] = {
            "slug": slug,
            "owner_identity_id": current_user.id,
            "name": payload.name.strip(),
            "industry": payload.industry,
            "company_size": payload.company_size,
            "location": payload.location,
            "website": payload.website or f"https://{slug}.vn",
            # Reputation fields are earned through reviews, not self-declared by the creator.
            "avg_rating": payload.avg_rating if current_user.role == "admin" else 0,
            "review_count": payload.review_count if current_user.role == "admin" else 0,
            "avg_salary_usd": payload.avg_salary_usd,
            "open_jobs_count": payload.open_jobs_count,
            "hiring_now": payload.hiring_now,
            "description": payload.description,
            "tech_stack": techs,
            "benefits": payload.benefits or ["Lương thưởng hấp dẫn", "Hybrid / Remote linh hoạt"],
            "open_jobs": [
                {
                    "id": f"{slug}-job-1",
                    "title": f"Senior Engineer @ {payload.name.strip()}",
                    "salary_range": "$2,600 - $3,600",
                    "work_mode": "Hybrid",
                    "skills": techs[:3],
                }
            ],
        }
        if not await self.repo.insert_company(data):
            raise HTTPException(status_code=409, detail=f"Company slug '{slug}' already exists.")
        return await self.get_company(slug)

    async def update_company(
        self, slug: str, payload: CompanyProfileUpdateRequest, current_user: AuthenticatedUser
    ) -> CompanyProfileItemDTO:
        existing = await self._require_company(slug)
        if not is_owner_or_admin(current_user, existing["owner_identity_id"]):
            raise HTTPException(status_code=403, detail="Forbidden: only the company owner or an admin can edit this company.")
        updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        await self.repo.update_company(existing["slug"], updates)
        return await self.get_company(existing["slug"])

    async def add_review(
        self, slug: str, payload: CompanyReviewCreateRequest, current_user: AuthenticatedUser
    ) -> CompanyProfileItemDTO:
        existing = await self._require_company(slug)
        if not 1 <= payload.rating <= 5:
            raise HTTPException(status_code=422, detail="rating must be between 1 and 5.")
        await self.repo.add_company_review(
            existing["id"],
            current_user.id,
            {
                "id": f"rev-{uuid.uuid4().hex[:10]}",
                "author_role": payload.author_role,
                "rating": payload.rating,
                "title": payload.title,
                "comment": payload.comment,
            },
        )
        return await self.get_company(existing["slug"])

    async def list_interview_questions(self, slug: str) -> List[CompanyInterviewQuestionItemDTO]:
        rows = await self.repo.list_interview_questions(slug)
        return [CompanyInterviewQuestionItemDTO(**r) for r in rows]

    async def add_interview_question(
        self, slug: str, payload: CompanyInterviewQuestionCreateRequest, current_user: AuthenticatedUser
    ) -> CompanyInterviewQuestionItemDTO:
        existing = await self._require_company(slug)
        q_txt = (payload.question_text or payload.question or "").strip()
        if not q_txt:
            raise HTTPException(status_code=422, detail="question_text is required.")
        row = await self.repo.add_interview_question(
            existing["id"],
            current_user.id,
            {
                "id": f"iq-{uuid.uuid4().hex[:10]}",
                "role_title": payload.role_title,
                "difficulty": payload.difficulty,
                "question_text": q_txt,
                "sample_answer_hint": payload.sample_answer_hint,
            },
        )
        return CompanyInterviewQuestionItemDTO(**row)
