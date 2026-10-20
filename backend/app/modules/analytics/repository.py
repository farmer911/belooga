"""Repository Layer for Domain 12: Executive Analytics & Unit Economics (Vertical Module: analytics)."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AnalyticsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_platform_counts(self) -> tuple[int, int, int]:
        """Single-roundtrip scalar subquery counting identities, ATS scans, and job trackers in 1 DB hop."""
        res = await self.db.execute(
            text("""
                SELECT
                    (SELECT COUNT(*) FROM identities) AS total_users,
                    (SELECT COUNT(*) FROM resume_jd_matches) AS total_scans,
                    (SELECT COUNT(*) FROM candidate_job_applications_tracker) AS active_jobs
            """)
        )
        row = res.mappings().first()
        if not row:
            return 0, 0, 0
        return int(row["total_users"] or 0), int(row["total_scans"] or 0), int(row["active_jobs"] or 0)
