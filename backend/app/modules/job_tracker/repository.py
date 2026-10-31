"""Repository Layer for Domain 11: Candidate Job Applications Tracker (Kanban) (Vertical Module: job_tracker)."""

import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_tracker import CandidateJobApplicationTracker


class JobTrackerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_jobs(self, candidate_identity_id: uuid.UUID) -> List[CandidateJobApplicationTracker]:
        query = (
            select(CandidateJobApplicationTracker)
            .where(CandidateJobApplicationTracker.candidate_identity_id == candidate_identity_id)
            .order_by(CandidateJobApplicationTracker.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_job_by_id(self, job_id: uuid.UUID) -> Optional[CandidateJobApplicationTracker]:
        query = select(CandidateJobApplicationTracker).where(CandidateJobApplicationTracker.id == job_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_job(
        self,
        company_name: str,
        position_title: str,
        status: str = "TARGETING",
        expected_salary: Optional[str] = None,
        match_score: int = 0,
        interview_date: Optional[object] = None,
        notes: Optional[str] = None,
        candidate_identity_id: Optional[uuid.UUID] = None,
        commit: bool = True,
    ) -> CandidateJobApplicationTracker:
        if candidate_identity_id is None:
            raise ValueError("candidate_identity_id is required")
        job = CandidateJobApplicationTracker(
            company_name=company_name,
            position_title=position_title,
            status=status,
            expected_salary=expected_salary,
            match_score=match_score,
            interview_date=interview_date,
            notes=notes,
            candidate_identity_id=candidate_identity_id,
        )
        self.db.add(job)
        if commit:
            await self.db.commit()
            await self.db.refresh(job)
        else:
            await self.db.flush()
            await self.db.refresh(job)
        return job

    _GOAL_COLS = "target_role, target_salary, preferred_skills, location, updated_at"

    async def get_career_goal(self, candidate_identity_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        res = await self.db.execute(
            text(f"SELECT {self._GOAL_COLS} FROM career_goals WHERE identity_id = :iid"), {"iid": candidate_identity_id}
        )
        row = res.mappings().first()
        return dict(row) if row else None

    async def upsert_career_goal(self, candidate_identity_id: uuid.UUID, goal: Dict[str, Any]) -> Dict[str, Any]:
        res = await self.db.execute(
            text(f"""
                INSERT INTO career_goals (identity_id, target_role, target_salary, preferred_skills, location, updated_at)
                VALUES (:iid, :target_role, :target_salary, :preferred_skills, :location, NOW())
                ON CONFLICT (identity_id) DO UPDATE SET
                    target_role = EXCLUDED.target_role, target_salary = EXCLUDED.target_salary,
                    preferred_skills = EXCLUDED.preferred_skills, location = EXCLUDED.location, updated_at = NOW()
                RETURNING {self._GOAL_COLS}
            """),
            {"iid": candidate_identity_id, **goal},
        )
        await self.db.commit()
        return dict(res.mappings().one())

    @staticmethod
    def _enforce_owner(
        job: CandidateJobApplicationTracker, candidate_identity_id: Optional[uuid.UUID]
    ) -> None:
        if candidate_identity_id is not None and job.candidate_identity_id != candidate_identity_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not own this tracked job.",
            )

    async def update_status(
        self,
        job: CandidateJobApplicationTracker,
        new_status: str,
        candidate_identity_id: Optional[uuid.UUID] = None,
    ) -> CandidateJobApplicationTracker:
        self._enforce_owner(job, candidate_identity_id)
        job.status = new_status
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def update_job(
        self,
        job: CandidateJobApplicationTracker,
        updates: Dict[str, Any],
        candidate_identity_id: Optional[uuid.UUID] = None,
    ) -> CandidateJobApplicationTracker:
        self._enforce_owner(job, candidate_identity_id)
        for field, value in updates.items():
            setattr(job, field, value)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def delete_job(
        self,
        job: CandidateJobApplicationTracker,
        candidate_identity_id: Optional[uuid.UUID] = None,
    ) -> None:
        self._enforce_owner(job, candidate_identity_id)
        await self.db.delete(job)
        await self.db.commit()

    async def list_market_jobs(self) -> List[Dict[str, Any]]:
        res = await self.db.execute(
            text("""
                SELECT CAST(p.id AS text) AS id,
                       COALESCE(m.company_name, 'Belooga') AS company_name,
                       p.title AS position_title,
                       p.location,
                       COALESCE(m.salary_range, 'Negotiable') AS salary_range,
                       COALESCE(m.skills, '{}') AS skills
                FROM career_postings p
                LEFT JOIN career_posting_meta m ON m.career_posting_id = p.id
                WHERE p.is_active = TRUE
                ORDER BY p.created_at DESC
            """)
        )
        out: List[Dict[str, Any]] = []
        for idx, r in enumerate(res.mappings().all()):
            out.append({
                "id": str(r["id"]),
                "company_name": str(r["company_name"]),
                "position_title": str(r["position_title"]),
                "location": str(r["location"]),
                "salary_range": str(r["salary_range"]),
                "match_score": max(82, 95 - idx * 2),
                "skills": list(r["skills"] or []),
            })
        return out
