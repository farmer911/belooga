"""Full-Text Company Search, Multi-Facet Filter & Company Profile CRUD Service (BEL-191)."""

from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalogs.repository import CatalogsRepository
from app.schemas.catalogs import (
    CompanyInterviewQuestionCreateRequest,
    CompanyInterviewQuestionItemDTO,
    CompanyProfileCreateRequest,
    CompanyProfileItemDTO,
    CompanyProfileUpdateRequest,
    CompanyReviewCreateRequest,
)

DEFAULT_COMPANIES: List[Dict[str, Any]] = [
    {
        "slug": "vng-cloud",
        "name": "VNG Cloud & AI Platform",
        "industry": "AI / Cloud",
        "company_size": "500-1000 nhân sự",
        "location": "Ho Chi Minh",
        "website": "https://vngcloud.vn",
        "avg_rating": 4.8,
        "review_count": 42,
        "avg_salary_usd": 2800,
        "open_jobs_count": 6,
        "hiring_now": True,
        "description": "Hạ tầng đám mây và nền tảng AI/GPU quy mô lớn phục vụ hàng chục triệu người dùng Đông Nam Á.",
        "tech_stack": ["Golang", "Kubernetes", "Python", "PostgreSQL", "React"],
        "benefits": ["Lương tháng 13 + Thưởng hiệu suất 3–6 tháng", "Bảo hiểm sức khỏe cao cấp PVI"],
        "open_jobs": [
            {"id": "vng-job-1", "title": "Principal Golang & Distributed Systems Engineer", "salary_range": "$2,800 - $3,800", "work_mode": "Hybrid (HCMC)", "skills": ["Golang", "Kubernetes", "PostgreSQL"]}
        ],
        "reviews": [
            {"id": "rev-1", "author_role": "Senior Backend Engineer", "rating": 5, "title": "Môi trường kỹ thuật chiều sâu, bài toán tải lớn", "comment": "Hệ thống microservices Golang chuẩn mực.", "created_at": "2026-10-15"}
        ],
        "alumni": [
            {"username": "phucnguyen", "full_name": "Nguyễn Minh Phúc", "role": "Principal Architect", "verified_expert": True}
        ],
    },
    {
        "slug": "momo-fintech",
        "name": "M_Service (MoMo Fintech SuperApp)",
        "industry": "Fintech",
        "company_size": "1000+ nhân sự",
        "location": "Ho Chi Minh / Hybrid",
        "website": "https://momo.vn",
        "avg_rating": 4.7,
        "review_count": 68,
        "avg_salary_usd": 3100,
        "open_jobs_count": 9,
        "hiring_now": True,
        "description": "Siêu ứng dụng tài chính số hàng đầu Việt Nam xử lý hàng chục triệu giao dịch thời gian thực mỗi ngày.",
        "tech_stack": ["Golang", "Python", "FastAPI", "React", "Kafka"],
        "benefits": ["ESOP cho vị trí Senior/Lead", "Hybrid làm việc linh hoạt"],
        "open_jobs": [
            {"id": "momo-job-1", "title": "Staff Payment Core & Ledger Architect", "salary_range": "$3,000 - $4,200", "work_mode": "Hybrid", "skills": ["Golang", "PostgreSQL", "Kafka"]}
        ],
        "reviews": [
            {"id": "rev-2", "author_role": "Tech Lead Payment", "rating": 5, "title": "Bài toán Fintech chuẩn ACID & High Availability", "comment": "Lương thưởng cạnh tranh top thị trường.", "created_at": "2026-10-18"}
        ],
        "alumni": [
            {"username": "maivo", "full_name": "Võ Thị Mai", "role": "Staff Full-Stack Lead", "verified_expert": True}
        ],
    },
    {
        "slug": "shopee-vn",
        "name": "Shopee & SeaMoney Engineering VN",
        "industry": "E-commerce",
        "company_size": "1000+ nhân sự",
        "location": "Ho Chi Minh / Ha Noi",
        "website": "https://careers.shopee.vn",
        "avg_rating": 4.6,
        "review_count": 54,
        "avg_salary_usd": 2950,
        "open_jobs_count": 5,
        "hiring_now": True,
        "description": "Trung tâm R&D thương mại điện tử và thanh toán số quy mô khu vực châu Á.",
        "tech_stack": ["Golang", "React", "TypeScript", "Kubernetes", "PostgreSQL"],
        "benefits": ["15 ngày phép năm", "Phụ cấp ăn trưa & thiết bị MacBook Pro M4"],
        "open_jobs": [
            {"id": "shopee-job-1", "title": "Senior High-Concurrency Backend Engineer", "salary_range": "$2,600 - $3,600", "work_mode": "Hybrid", "skills": ["Golang", "Redis", "PostgreSQL"]}
        ],
        "reviews": [
            {"id": "rev-3", "author_role": "Senior Software Engineer", "rating": 5, "title": "Quy trình code review & kiến trúc rất bài bản", "comment": "Học được rất nhiều về distributed caching.", "created_at": "2026-10-12"}
        ],
        "alumni": [
            {"username": "phucnguyen", "full_name": "Nguyễn Minh Phúc", "role": "Ex-Staff Engineer", "verified_expert": True}
        ],
    },
]


class CompaniesService:
    """Service layer for Company Directory search, multi-facet filtering, CRUD, and employee reviews."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CatalogsRepository(db)

    async def _all_companies(self) -> List[Dict[str, Any]]:
        persisted = await self.repo.list_persisted_companies()
        by_slug = {c.get("slug"): c for c in persisted if c.get("slug")}
        default_slugs = {d["slug"] for d in DEFAULT_COMPANIES}
        custom = [c for c in persisted if c.get("slug") not in default_slugs]
        return custom + [by_slug.get(d["slug"], dict(d)) for d in DEFAULT_COMPANIES]

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
        return [CompanyProfileItemDTO(**c) for c in items]

    async def get_company(self, slug: str) -> CompanyProfileItemDTO:
        clean = slug.strip().lower()
        for c in await self._all_companies():
            if str(c.get("slug", "")).lower() == clean:
                return CompanyProfileItemDTO(**c)
        raise HTTPException(status_code=404, detail=f"Company '{slug}' not found.")

    async def create_company(self, payload: CompanyProfileCreateRequest) -> CompanyProfileItemDTO:
        slug = (
            payload.slug
            or re.sub(r"[^a-z0-9]+", "-", payload.name.strip().lower()).strip("-")
            or f"company-{uuid.uuid4().hex[:6]}"
        )
        techs = payload.tech_stack or ["Golang", "React", "PostgreSQL"]
        data: Dict[str, Any] = {
            "slug": slug,
            "name": payload.name.strip(),
            "industry": payload.industry,
            "company_size": payload.company_size,
            "location": payload.location,
            "website": payload.website or f"https://{slug}.vn",
            "avg_rating": payload.avg_rating,
            "review_count": payload.review_count,
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
            "reviews": [],
            "alumni": [],
        }
        await self.repo.upsert_company(slug, data)
        return CompanyProfileItemDTO(**data)

    async def update_company(self, slug: str, payload: CompanyProfileUpdateRequest) -> CompanyProfileItemDTO:
        existing = (await self.get_company(slug)).model_dump()
        for k, v in payload.model_dump(exclude_unset=True).items():
            if v is not None:
                existing[k] = v
        await self.repo.upsert_company(existing["slug"], existing)
        return CompanyProfileItemDTO(**existing)

    async def add_review(self, slug: str, payload: CompanyReviewCreateRequest) -> CompanyProfileItemDTO:
        existing = (await self.get_company(slug)).model_dump()
        reviews = list(existing.get("reviews") or [])
        reviews.insert(
            0,
            {
                "id": f"rev-{uuid.uuid4().hex[:6]}",
                "author_role": payload.author_role,
                "rating": payload.rating,
                "title": payload.title,
                "comment": payload.comment,
                "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            },
        )
        existing["reviews"] = reviews
        existing["review_count"] = len(reviews)
        await self.repo.upsert_company(existing["slug"], existing)
        return CompanyProfileItemDTO(**existing)

    async def list_interview_questions(self, slug: str) -> List[CompanyInterviewQuestionItemDTO]:
        persisted = await self.repo.list_persisted_companies()
        by_slug = {c.get("slug"): c for c in persisted if c.get("slug")}
        comp = by_slug.get(slug.lower()) or {}
        saved = list(comp.get("interview_questions") or [])
        defaults = [
            {
                "id": "iq-1",
                "role_title": "Principal Golang Engineer",
                "difficulty": "Hard",
                "question_text": "Thiết kế cơ chế chống Double-Spend cho ví điện tử ở mức 20,000 TPS?",
                "question": "Thiết kế cơ chế chống Double-Spend cho ví điện tử ở mức 20,000 TPS?",
                "sample_answer_hint": "Sử dụng Idempotency Key + pg_advisory_xact_lock + Outbox Ledger.",
            },
            {
                "id": "iq-2",
                "role_title": "Senior AI Infrastructure",
                "difficulty": "Medium",
                "question_text": "Tối ưu độ trễ RAG hybrid search trên PostgreSQL 16 như thế nào?",
                "question": "Tối ưu độ trễ RAG hybrid search trên PostgreSQL 16 như thế nào?",
                "sample_answer_hint": "Kết hợp GIN TSVECTOR + pg_trgm pre-filter trước khi rerank.",
            },
        ]
        rows = saved + defaults
        return [CompanyInterviewQuestionItemDTO(**r) for r in rows]

    async def add_interview_question(
        self, slug: str, payload: CompanyInterviewQuestionCreateRequest
    ) -> CompanyInterviewQuestionItemDTO:
        q_txt = (payload.question_text or payload.question or "Thiết kế hệ thống phân tán chịu tải cao?").strip()
        item = {
            "id": payload.id or f"iq-{uuid.uuid4().hex[:6]}",
            "role_title": payload.role_title,
            "difficulty": payload.difficulty,
            "question_text": q_txt,
            "question": q_txt,
            "sample_answer_hint": payload.sample_answer_hint,
        }
        persisted = await self.repo.list_persisted_companies()
        by_slug = {c.get("slug"): c for c in persisted if c.get("slug")}
        comp = by_slug.get(slug.lower()) or {"slug": slug.lower(), "name": slug.replace("-", " ").title()}
        questions = list(comp.get("interview_questions") or [])
        questions.insert(0, item)
        comp["interview_questions"] = questions
        await self.repo.upsert_company(comp.get("slug", slug.lower()), comp)
        return CompanyInterviewQuestionItemDTO(**item)

