"""Company directory, reviews and interview questions for CatalogsRepository."""

import json
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class CompanyDirectoryMixin:
    db: AsyncSession

    async def list_companies(self) -> List[Dict[str, Any]]:
        res = await self.db.execute(text(self._COMPANY_SQL + " ORDER BY c.created_at DESC"))
        return [dict(r) for r in res.mappings().all()]

    async def get_company(self, slug: str) -> Optional[Dict[str, Any]]:
        res = await self.db.execute(text(self._COMPANY_SQL + " WHERE c.slug = :slug"), {"slug": slug.strip().lower()})
        row = res.mappings().first()
        return dict(row) if row else None

    COMPANY_WRITABLE = (
        "name", "industry", "company_size", "location", "website", "avg_rating", "review_count", "avg_salary_usd",
        "open_jobs_count", "hiring_now", "description", "tech_stack", "benefits",
    )

    async def insert_company(self, data: Dict[str, Any]) -> bool:
        """Insert a new company; False when the slug is already taken (never overwrites someone else's company)."""
        cols = ("slug", "owner_identity_id", *self.COMPANY_WRITABLE)
        res = await self.db.execute(
            text("""
                INSERT INTO company_profiles (
                    slug, owner_identity_id, name, industry, company_size, location, website,
                    avg_rating, review_count, avg_salary_usd, open_jobs_count, hiring_now,
                    description, tech_stack, benefits, open_jobs
                ) VALUES (
                    :slug, :owner_identity_id, :name, :industry, :company_size, :location, :website,
                    :avg_rating, :review_count, :avg_salary_usd, :open_jobs_count, :hiring_now,
                    :description, :tech_stack, :benefits, CAST(:open_jobs AS jsonb)
                )
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
            """),
            {**{k: data.get(k) for k in cols}, "open_jobs": json.dumps(data.get("open_jobs") or [], ensure_ascii=False)},
        )
        inserted = res.scalar_one_or_none() is not None
        await self.db.commit()
        return inserted

    async def update_company(self, slug: str, updates: Dict[str, Any]) -> None:
        fields = {k: updates.get(k) for k in self.COMPANY_WRITABLE}
        if not any(v is not None for v in fields.values()):
            return
        await self.db.execute(
            text("""
                UPDATE company_profiles
                SET name = COALESCE(:name, name),
                    industry = COALESCE(:industry, industry),
                    company_size = COALESCE(:company_size, company_size),
                    location = COALESCE(:location, location),
                    website = COALESCE(:website, website),
                    avg_rating = COALESCE(:avg_rating, avg_rating),
                    review_count = COALESCE(:review_count, review_count),
                    avg_salary_usd = COALESCE(:avg_salary_usd, avg_salary_usd),
                    open_jobs_count = COALESCE(:open_jobs_count, open_jobs_count),
                    hiring_now = COALESCE(:hiring_now, hiring_now),
                    description = COALESCE(:description, description),
                    tech_stack = COALESCE(:tech_stack, tech_stack),
                    benefits = COALESCE(:benefits, benefits),
                    updated_at = NOW()
                WHERE slug = :slug
            """),
            {**fields, "slug": slug},
        )
        await self.db.commit()

    async def add_company_review(self, company_id: uuid.UUID, author_identity_id: uuid.UUID, review: Dict[str, Any]) -> None:
        """Review insert + review_count bump commit together."""
        await self.db.execute(
            text("""
                INSERT INTO company_reviews (id, company_id, author_identity_id, author_role, rating, title, comment)
                VALUES (:id, :cid, :aid, :author_role, :rating, :title, :comment)
            """),
            {**review, "cid": company_id, "aid": author_identity_id},
        )
        await self.db.execute(
            text("UPDATE company_profiles SET review_count = review_count + 1, updated_at = NOW() WHERE id = :cid"),
            {"cid": company_id},
        )
        await self.db.commit()

    async def list_interview_questions(self, slug: str) -> List[Dict[str, Any]]:
        res = await self.db.execute(
            text("""
                SELECT q.id, q.role_title, q.difficulty, q.question_text, q.question_text AS question, q.sample_answer_hint
                FROM company_interview_questions q JOIN company_profiles c ON c.id = q.company_id
                WHERE c.slug = :slug ORDER BY q.created_at DESC
            """),
            {"slug": slug.strip().lower()},
        )
        return [dict(r) for r in res.mappings().all()]

    async def add_interview_question(self, company_id: uuid.UUID, author_identity_id: uuid.UUID, item: Dict[str, Any]) -> Dict[str, Any]:
        res = await self.db.execute(
            text("""
                INSERT INTO company_interview_questions AS q (id, company_id, author_identity_id, role_title, difficulty, question_text, sample_answer_hint)
                VALUES (:id, :cid, :aid, :role_title, :difficulty, :question_text, :sample_answer_hint)
                RETURNING q.id, q.role_title, q.difficulty, q.question_text, q.question_text AS question, q.sample_answer_hint
            """),
            {**item, "cid": company_id, "aid": author_identity_id},
        )
        await self.db.commit()
        return dict(res.mappings().one())
