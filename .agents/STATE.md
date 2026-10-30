# Active State Scratchpad (<= 50 lines)

> Per-task working memory. Overwrite (do not append) when starting a new ticket.

- **Active Ticket:** Production Hardening (P0 Ledger/Analytics, P1 Growth/ATS Persistence, P2 Archify Sync)
- **Branch / Worktree:** `feature/production-hardening`
- **Objective & Hypothesis:**
  1. **P0 (Escrow & Analytics):** Fix `PaymentService.handle_ipn` & `release_escrow_for_order` so MoMo `EXPERT_REVIEW` payments lock escrow in `wallets`, and releasing escrow credits 92% (`EXPERT_PAYOUT`) to the assigned expert's wallet (`order.expert.identity_id`) while retaining 8% platform fee. Remove fabricated `+42` users / `+185` scans padding from `AnalyticsService.get_dashboard`.
  2. **P1 (Growth & ATS Ground-Truth):** Wire `/v1/growth/{claim-reward,stealth-mode,cv-auto-import,skill-assessment,referrals,expert-mock-booking}` to real PostgreSQL tables (`wallets`, `wallet_transactions`, `candidate_profiles`, `skills`, `profile_skills`, `notifications`) and remove fabricated `"45,000+ RPS"` metrics from `ATSMatchingService.tailor_cv`.
  3. **P2 (Archify Sync):** Fix `candidate.json` topology (`mobile_app -> nginx_gateway`, `momo_gateway -> escrow_wallet`, `fastapi_gateway -> redis_cache`, `escrow_wallet -> redis_cache`) and re-run `archify finalize`.
- **Pre-Mortem Risks:**
  - Existing tests (`test_fullstack_seo_gateway.py`, `test_bel211_growth_features.py`, `test_platform_option_b_remediation.py`) must remain 100% green.
  - Lock wallets in deterministic UUID order during escrow payout to prevent deadlocks; keep `claim_reward` idempotent per `(identity_id, reward_id)`.
- **Target Files:**
  - `backend/app/modules/payments/{repository.py,service.py}`
  - `backend/app/modules/analytics/{repository.py,service.py}`
  - `backend/app/modules/bookmarks/{growth_repository.py,growth_service.py}` & `backend/app/api/v1/endpoints/bookmarks.py`
  - `backend/app/modules/ats_matching/service.py`
  - `frontend/src/components/features/growth/recruiter-tracker-wallet-suite.tsx`
  - `.archify/architecture-belooga-platform-20261029-232600/candidate.json`
- **Execution Checklist:**
  - [x] Write RED tests in `backend/tests/test_production_readiness_suite.py` & verify RED
  - [x] Implement P0 + P1 fixes (GREEN) & verify full pytest + tsc
  - [x] Fix P2 Archify `candidate.json` & run `archify finalize`
  - [x] Run `.agents/workflows/definition-of-done.md` gates
