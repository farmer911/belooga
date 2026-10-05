"""Repository Layer for Domain 10: ATS Diagnostics & JD Matching Engine."""

import uuid
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ats_matching import JobDescription, ResumeJDMatch


class ATSMatchingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_job_description(
        self,
        job_title: str,
        raw_text: str,
        company_name: Optional[str] = None,
        skills_extracted: Optional[List[str]] = None,
    ) -> JobDescription:
        jd = JobDescription(
            company_name=company_name,
            job_title=job_title,
            raw_text=raw_text,
            skills_extracted=skills_extracted or [],
        )
        self.db.add(jd)
        await self.db.commit()
        await self.db.refresh(jd)
        return jd

    async def create_match_record(
        self,
        job_description_id: uuid.UUID,
        ats_score: int,
        matched_skills: List[str],
        missing_skills: List[str],
        star_analysis: List[dict],
        parse_warnings: List[str],
        candidate_identity_id: Optional[uuid.UUID] = None,
    ) -> ResumeJDMatch:
        match = ResumeJDMatch(
            candidate_identity_id=candidate_identity_id,
            job_description_id=job_description_id,
            ats_score=ats_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            star_analysis=star_analysis,
            parse_warnings=parse_warnings,
        )
        self.db.add(match)
        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def get_match_by_id(self, match_id: uuid.UUID) -> Optional[ResumeJDMatch]:
        query = select(ResumeJDMatch).where(ResumeJDMatch.id == match_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
