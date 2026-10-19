# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task:** 5-Wave High-ROI Full-Stack (FE + BE) Feature Sprint + 5 Iterative Benchmark & Skill Evolution Loops (Continuous Overnight Execution until 06:20 AM).
- **Pushback Guard:** Rejected `999,999,999+` unvalidated features per `PRODUCT_THESIS.md` (80/20 YAGNI) and `ratchet.json` (`<= 300` lines/file). Replaced with 5 high-conversion FE+BE features across all 3 bounded contexts, each backed by TDD, 500k-row benchmark, and skill SSOT sync.

## Pre-Mortem Risks
- **File Bloat & Ratchet Violation:** Keep every BE/FE file `<= 300` lines (`fe_max_page_lines <= 245`), `fe_arbitrary_hex = 0`, `fe_structural_emoji = 0`, `fe_any = 0`.
- **Event-Loop & 500k DB Load:** Cache all new read/compute endpoints via `platform_cache` (`app/core/cache.py`) and bound all SQL queries.

## Target Files
- Wave 1 (Core): `backend/app/api/v1/endpoints/profile.py`, `backend/app/services/profile_service.py`, `frontend/src/app/public/[username]/page.tsx`
- Wave 2 (ATS): `backend/app/api/v1/endpoints/ats_matching.py`, `backend/app/services/ats_matching_service.py`, `frontend/src/components/features/ats-diagnostics/ats-scorecard.tsx`
- Wave 3 (Catalogs): `backend/app/api/v1/endpoints/catalogs.py`, `backend/app/services/catalogs_service.py`, `frontend/src/app/salary-benchmark/page.tsx`
- Wave 4 (Tracker): `backend/app/api/v1/endpoints/job_tracker.py`, `backend/app/services/job_tracker_service.py`, `frontend/src/app/workspace/jobs/page.tsx`
- Wave 5 (Expert): `backend/app/api/v1/endpoints/expert_review.py`, `backend/app/services/expert_review_service.py`, `frontend/src/app/(public)/expert-review/page.tsx`

## Execution Checklist (Continuous until 06:20 AM)
- [x] Wave 0 (`ddd7033`): 500k Dataset + Singleflight Cache + Keyset Pagination + Recruiter Shortlist Radar
- [x] Wave 1 + Skill Sync #1 (`f39415f`): Candidate Profile Trust & Recruiter Readiness Score
- [x] Wave 2 + Skill Sync #2 (`de0a540`): 60s Video Pitch Script & STAR Interview Kit Generator
- [x] Wave 3 + Skill Sync #3 (`76fb618`): Career Upskill ROI & Salary Negotiation Simulator
- [x] Wave 4 + Skill Sync #4 (`0bc5426`): Job Tracker Funnel Velocity & Offer Probability Analytics
- [x] Wave 5 + Skill Sync #5 (`37f9cb1`): Smart Expert Reviewer Matchmaking + 25-Scenario 500k Benchmark
- [x] Wave 6 + Skill Sync #6 (`4dfb143`): Executive Cohort Retention & LTV/CAC Unit Economics Telemetry (`analytics.py` + FE)
- [x] Wave 7 + Skill Sync #7 (`d20c629`): Candidate Career Trajectory & Promotion Readiness Simulator (`timeline.py` + FE)
- [x] Wave 8 + Skill Sync #8: Live Search Trending Skills & Talent Pool Pulse (`search.py` + FE `/search`)
- [ ] Wave 9 (04:00–06:20 AM): Continuous 28-Scenario 500k Benchmark Audit, E2E Verification & Morning CTO Handover Report









