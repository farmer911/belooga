"""Repository Layer for Domain 12: Executive Analytics & Unit Economics (Vertical Module: analytics)."""

from typing import Any, Dict, List
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

    async def get_paid_orders_ledger(self) -> tuple[float, List[Dict[str, Any]]]:
        """Aggregate paid CV review GMV (cents -> VND equivalent) and fetch latest settled DB orders."""
        res = await self.db.execute(
            text("""
                SELECT
                    COALESCE((
                        SELECT SUM(amount_paid_cents)
                        FROM cv_review_orders
                        WHERE order_status IN ('paid', 'in_review', 'completed')
                    ), 0) AS paid_cents,
                    COALESCE((
                        SELECT json_agg(t) FROM (
                            SELECT
                                CAST(o.id AS text) AS id,
                                COALESCE(p.first_name || ' ' || p.last_name, 'Candidate') AS user_name,
                                COALESCE(pkg.name, o.target_role) AS package_name,
                                o.amount_paid_cents AS amount_cents,
                                o.order_status AS status,
                                to_char(o.created_at, 'HH24:MI DD/MM') AS created_at
                            FROM cv_review_orders o
                            LEFT JOIN candidate_profiles p ON p.identity_id = o.candidate_identity_id
                            LEFT JOIN cv_review_packages pkg ON pkg.id = o.package_id
                            ORDER BY o.created_at DESC
                            LIMIT 4
                        ) t
                    ), '[]'::json) AS recent_orders
            """)
        )
        row = res.mappings().first()
        if not row:
            return 0.0, []
        # 1 USD cent ~= 250 VND for unified executive VND ledger
        db_gmv_vnd = float(row["paid_cents"] or 0) * 250.0
        return db_gmv_vnd, list(row["recent_orders"] or [])
