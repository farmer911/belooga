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
- [x] Wave 1 + Skill Sync #1: Candidate Profile Trust & Recruiter Readiness Score (BE + FE + Benchmark + Skill Update)
- [x] Wave 2 + Skill Sync #2: 60s Video Pitch Script & STAR Interview Kit Generator (BE + FE + Benchmark + Skill Update)
- [x] Wave 3 + Skill Sync #3: Career Upskill ROI & Salary Negotiation Simulator (BE + FE + Benchmark + Skill Update)
- [x] Wave 4 + Skill Sync #4: Job Tracker Funnel Velocity & Offer Probability Analytics (BE + FE + Benchmark + Skill Update)
- [ ] Wave 5 + Skill Sync #5: Smart Expert Reviewer Matchmaking + Full 25-Scenario Benchmark & Continuous 06:20 AM Guard




