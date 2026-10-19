from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ats_matching import ResumeJDMatch
from app.models.identity import Identity
from app.models.job_tracker import CandidateJobApplicationTracker


class AnalyticsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_platform_counts(self) -> tuple[int, int, int]:
        total_users = (await self.db.execute(select(func.count(Identity.id)))).scalar_one_or_none() or 0
        total_scans = (await self.db.execute(select(func.count(ResumeJDMatch.id)))).scalar_one_or_none() or 0
        active_jobs = (
            await self.db.execute(select(func.count(CandidateJobApplicationTracker.id)))
        ).scalar_one_or_none() or 0
        return total_users, total_scans, active_jobs
