# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (`BEL-518`):** Full Backend Flow Standardization (`Gateway -> Router -> Service -> Repository -> EventStream/Cache`) & PostgreSQL 16 SQL / Index Optimization:
  1. **Add Missing Composite B-Tree Indexes (`backend/alembic/versions/0004_optimize_indexes_and_sql.py` + `database.py`):**
     - Index `notifications (identity_id, is_read, created_at DESC)`, `cv_review_orders (candidate_identity_id, created_at DESC)`, `cv_review_orders (order_status, created_at DESC)`, `candidate_job_applications_tracker (candidate_identity_id, created_at DESC)`, `resume_jd_matches (candidate_identity_id, created_at DESC)`.
  2. **Consolidate Multi-Roundtrip SQL Queries into Single-Roundtrip PostgreSQL 16 Queries:**
     - `ProfileRepository.get_full_profile_bundle`: **7 sequential SQL queries -> 1 single `json_agg`/`ARRAY` SQL query**.
     - `ProfileRepository.add_skill` / `remove_skill`: **3/2 queries -> 1 atomic CTE / `DELETE USING` query**.
     - `TimelineRepository.bulk_update_job_orders` / `bulk_update_education_orders`: **`N` loop `UPDATE` queries -> 1 bulk `CASE` `UPDATE` query**.
     - `AnalyticsRepository.get_dashboard_aggregates`: **4 separate queries + service-layer raw SQL -> 1 single scalar query in repository**.
     - `ATSMatchingRepository.find_shortlist_candidates`: **2 GIN index scans -> 1 scan with `COUNT(*) OVER()` window function**.
     - `NotificationRepository.mark_read`: **2 queries (`SELECT` + `UPDATE`) -> 1 `UPDATE ... RETURNING`**.
  3. **Empirical SQL Benchmark (`scripts/benchmark-sql-optimization.py`) & TDD (`backend/tests/test_sql_and_flow_optimization.py`).**

## Pre-Mortem Risks
- Keep all `backend/app/**/*.py` <= 300 lines.

## Execution Checklist
- [x] Create Alembic migration `0004_optimize_indexes_and_sql.py` & apply composite indexes to PostgreSQL
- [x] Upgrade `profile/repository.py`, `timeline/repository.py`, `analytics/repository.py`, `ats_matching/repository.py`, `notifications/repository.py`
- [x] Standardize service flow (`profile/service.py`, `timeline/service.py`, `analytics/service.py`, `ats_matching/service.py`, `gateway.py`)
- [x] Run empirical SQL benchmark (`scripts/benchmark-sql-optimization.py`) & TDD test suite (`backend/tests/test_sql_and_flow_optimization.py`)
- [x] Verify `trust-benchmark.py`, `audit-truth.sh`, open PR #26, and merge into `main`
