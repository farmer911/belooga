"""Repository Layer for Domain 11: Candidate Job Applications Tracker (Kanban) (Vertical Module: job_tracker)."""

from datetime import datetime, timezone
import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_tracker import CandidateJobApplicationTracker


class JobTrackerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def resolve_demo_identity_id(self) -> Optional[uuid.UUID]:
        res = await self.db.execute(
            text("SELECT id FROM identities WHERE email = 'alex@belooga.com' LIMIT 1")
        )
        return res.scalar_one_or_none()

    async def list_jobs(self, candidate_identity_id: Optional[uuid.UUID] = None) -> List[CandidateJobApplicationTracker]:
        target_id = candidate_identity_id or await self.resolve_demo_identity_id()
        query = select(CandidateJobApplicationTracker)
        if target_id:
            query = query.where(CandidateJobApplicationTracker.candidate_identity_id == target_id)
        else:
            query = query.where(CandidateJobApplicationTracker.candidate_identity_id.is_(None))
        query = query.order_by(CandidateJobApplicationTracker.created_at.desc())
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
    ) -> CandidateJobApplicationTracker:
        target_id = candidate_identity_id or await self.resolve_demo_identity_id()
        job = CandidateJobApplicationTracker(
            company_name=company_name,
            position_title=position_title,
            status=status,
            expected_salary=expected_salary,
            match_score=match_score,
            interview_date=interview_date,
            notes=notes,
            candidate_identity_id=target_id,
        )
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def get_career_goal(self, candidate_identity_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        target_id = candidate_identity_id or await self.resolve_demo_identity_id()
        key_tag = f"CAREER_GOAL:{target_id or 'anon'}"
        res = await self.db.execute(text("SELECT id, message FROM contact_inquiries WHERE name = :k LIMIT 1"), {"k": key_tag})
        row = res.fetchone()
        if row and row.message:
            return json.loads(row.message)
        return {
            "id": f"goal-{str(target_id or 'default')[:8]}",
            "target_role": "Senior Backend / Golang Engineer",
            "target_salary": "55.000.000 VNĐ",
            "preferred_skills": "Golang, PostgreSQL, Kubernetes, System Design",
            "location": "Ho Chi Minh / Remote",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def upsert_career_goal(self, payload: Dict[str, Any], candidate_identity_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        target_id = candidate_identity_id or await self.resolve_demo_identity_id()
        key_tag = f"CAREER_GOAL:{target_id or 'anon'}"
        goal_data = {
            "id": f"goal-{str(target_id or 'default')[:8]}",
            "target_role": payload.get("target_role") or "Senior Backend Engineer",
            "target_salary": payload.get("target_salary") or "55.000.000 VNĐ",
            "preferred_skills": payload.get("preferred_skills") or "Golang, PostgreSQL, Kubernetes",
            "location": payload.get("location") or "Ho Chi Minh / Remote",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        msg = json.dumps(goal_data, ensure_ascii=False)
        existing = (await self.db.execute(text("SELECT id FROM contact_inquiries WHERE name = :k LIMIT 1"), {"k": key_tag})).fetchone()
        if existing:
            await self.db.execute(text("UPDATE contact_inquiries SET message = :m WHERE id = :id"), {"m": msg, "id": existing.id})
        else:
            await self.db.execute(
                text("INSERT INTO contact_inquiries (id, name, email, message) VALUES (:id, :k, 'goal@belooga.internal', :m)"),
                {"id": uuid.uuid4(), "k": key_tag, "m": msg},
            )
        await self.db.commit()
        return goal_data

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
