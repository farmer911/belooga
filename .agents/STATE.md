# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (BEL-135 — PostgreSQL 16 OLAP CTEs & Power BI / DuckDB Star-Schema Export API):**
  1. Upgrade `AnalyticsRepository` (`backend/app/modules/analytics/repository.py`) with single-roundtrip PostgreSQL 16 OLAP CTEs (`get_bi_star_schema_export`) querying real DB facts across `resume_jd_matches`, `job_descriptions`, `cv_review_orders`, `candidate_job_applications_tracker`, and `profile_skills`.
  2. Expose `GET /v1/analytics/bi-export` (`BIStarSchemaExportResponse`) returning Star-Schema fact/dimension tables (`fact_ats_scans`, `fact_review_orders`, `fact_job_pipeline`, `dim_skills_demand`) + PowerQuery M snippet for zero-lock Power BI Web Connector & DuckDB ingestion, cached via `platform_cache`.
  3. Surface the Power BI / DuckDB Star-Schema Web Connector panel (`data-testid="bi-star-schema-panel"`) in `frontend/src/app/admin/analytics/page.tsx` via `useAnalyticsDashboard`.

## Pre-Mortem Risks
- Keep all `backend/app/` files <= 300 lines (`be_files_over_300_lines = 0`) and `frontend/src/` under `.agents/ratchet.json` limits.
- Coalesce all SQL `SUM`/`COUNT`/`AVG`/`json_agg` aggregations to safe non-null defaults so cold DBs never return `None` or divide by zero.
- Enforce zero raw hex (`fe_arbitrary_hex = 0`), zero emoji (`fe_structural_emoji = 0`), and `@tanstack/react-query` hooks.

## Execution Checklist
- [x] **Phase 1 (TDD RED):** Add failing tests in `backend/tests/test_analytics.py` for `/v1/analytics/bi-export` & real OLAP funnel/skills telemetry
- [x] **Phase 2 (TDD GREEN Backend):** Implement `BIStarSchemaExportResponse` & SQL OLAP CTEs in `analytics/{repository,service}.py` and `/v1/analytics/bi-export`
- [x] **Phase 3 (Frontend + E2E):** Update `use-analytics-dashboard.ts`, `admin/analytics/page.tsx`, and `qc/tests/e2e/analytics-dashboard.spec.ts`
- [x] **Phase 4 (SSOT Sync & PR):** Run `generate-current-state.py`, `render-skill-facts.py`, `trust-benchmark.py`, `audit-truth.sh`, and merge PR
