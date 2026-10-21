"""Repository Layer for Domain 12: Executive Analytics, OLAP CTEs & BI Star-Schema Export (Vertical Module: analytics)."""

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

    async def get_bi_star_schema_export(self, limit: int = 100) -> Dict[str, List[Dict[str, Any]]]:
        """Single-roundtrip PostgreSQL 16 OLAP CTE assembling Star-Schema facts and skill supply/demand dimensions."""
        bounded_limit = max(5, min(limit, 500))
        res = await self.db.execute(
            text("""
                WITH scan_facts AS (
                    SELECT
                        CAST(m.id AS text) AS scan_id,
                        COALESCE(jd.job_title, 'Target Role') AS job_title,
                        COALESCE(jd.company_name, 'Enterprise Partner') AS company_name,
                        COALESCE(m.ats_score, 0) AS ats_score,
                        COALESCE(jsonb_array_length(m.matched_skills), 0) AS matched_skills_count,
                        COALESCE(jsonb_array_length(m.missing_skills), 0) AS missing_skills_count,
                        to_char(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS scanned_at
                    FROM resume_jd_matches m
                    JOIN job_descriptions jd ON jd.id = m.job_description_id
                    ORDER BY m.created_at DESC
                    LIMIT :lim
                ),
                order_facts AS (
                    SELECT
                        CAST(o.id AS text) AS order_id,
                        COALESCE(o.target_role, 'Senior Engineer') AS target_role,
                        COALESCE(o.order_status, 'pending_payment') AS order_status,
                        ROUND(CAST(COALESCE(o.amount_paid_cents, 0) * 250.0 AS numeric), 0) AS amount_vnd,
                        ROUND(CAST(COALESCE(o.amount_paid_cents, 0) * 250.0 * 0.08 AS numeric), 0) AS platform_fee_vnd,
                        to_char(o.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
                    FROM cv_review_orders o
                    ORDER BY o.created_at DESC
                    LIMIT :lim
                ),
                pipeline_stages AS (
                    SELECT unnest(ARRAY['TARGETING', 'TAILORED', 'APPLIED', 'INTERVIEW', 'OFFER']) AS stage_name
                ),
                pipeline_facts AS (
                    SELECT
                        ps.stage_name AS status,
                        COUNT(t.id)::int AS job_count,
                        ROUND(CAST(COALESCE(AVG(t.match_score), 75.0) AS numeric), 1)::float AS avg_match_score
                    FROM pipeline_stages ps
                    LEFT JOIN candidate_job_applications_tracker t ON UPPER(t.status) = ps.stage_name
                    GROUP BY ps.stage_name
                    ORDER BY ARRAY_POSITION(ARRAY['TARGETING', 'TAILORED', 'APPLIED', 'INTERVIEW', 'OFFER'], ps.stage_name)
                ),
                jd_skills AS (
                    SELECT
                        jsonb_array_elements_text(jd.skills_extracted) AS skill_name,
                        COUNT(*)::int AS demand_cnt
                    FROM job_descriptions jd
                    WHERE jsonb_typeof(jd.skills_extracted) = 'array'
                    GROUP BY 1
                ),
                cand_skills AS (
                    SELECT
                        s.name AS skill_name,
                        COUNT(ps.profile_id)::int AS supply_cnt
                    FROM skills s
                    LEFT JOIN profile_skills ps ON ps.skill_id = s.id
                    GROUP BY s.name
                ),
                skill_dim AS (
                    SELECT
                        COALESCE(j.skill_name, c.skill_name) AS skill_name,
                        COALESCE(j.demand_cnt, 1)::int AS jd_demand_count,
                        COALESCE(c.supply_cnt, 0)::int AS candidate_supply_count,
                        ROUND(
                            CAST(
                                (COALESCE(j.demand_cnt, 1)::numeric * 10.0)
                                / GREATEST(COALESCE(c.supply_cnt, 0) + 1, 1)
                            AS numeric),
                            2
                        )::float AS demand_gap_index
                    FROM jd_skills j
                    FULL OUTER JOIN cand_skills c ON LOWER(j.skill_name) = LOWER(c.skill_name)
                    ORDER BY jd_demand_count DESC, demand_gap_index DESC
                    LIMIT 25
                )
                SELECT
                    COALESCE((SELECT json_agg(sf) FROM scan_facts sf), '[]'::json) AS fact_ats_scans,
                    COALESCE((SELECT json_agg(ofc) FROM order_facts ofc), '[]'::json) AS fact_review_orders,
                    COALESCE((SELECT json_agg(pf) FROM pipeline_facts pf), '[]'::json) AS fact_job_pipeline,
                    COALESCE((SELECT json_agg(sd) FROM skill_dim sd), '[]'::json) AS dim_skills_demand
            """),
            {"lim": bounded_limit},
        )
        row = res.mappings().first()
        if not row:
            return {
                "fact_ats_scans": [],
                "fact_review_orders": [],
                "fact_job_pipeline": [],
                "dim_skills_demand": [],
            }
        return {
            "fact_ats_scans": list(row["fact_ats_scans"] or []),
            "fact_review_orders": list(row["fact_review_orders"] or []),
            "fact_job_pipeline": list(row["fact_job_pipeline"] or []),
            "dim_skills_demand": list(row["dim_skills_demand"] or []),
        }
