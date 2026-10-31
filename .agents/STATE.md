# Active Stateful Working Memory (.agents/STATE.md)

## Active Ticket: `#259 [BEL-248]` — Remediate 5 Platform-Wide Primer & Token Audit Gaps + Lock Anti-Recurrence Gates
- **Hypothesis:** Applying the newly injected System Design Primer (BE), Primer 3-Tier Design Token SSOT (FE/Mobile), and QC Anti-Reward-Hacking rules across the entire platform revealed 5 concrete gaps that have been closed and locked into `scripts/trust-benchmark.py`.
- **Risks:**
  1. Verified all read-only `GET` endpoints route via `get_read_db` (`notifications/service.py:get_preferences` refactored to pure read-only).
  2. Verified static parameterized SQL replaces all 25 `text(f"...")` occurrences while preserving GIN `search_vector @@ to_tsquery` index usage.

## Execution Checklist (TDD: RED -> Verify RED -> GREEN -> Verify GREEN -> REFACTOR)
- [x] 1. **RED Phase:** Added `test_bel248_platform_wide_primer_and_token_compliance` to `backend/tests/test_bel246_primer_system_and_design_tokens.py` and verified failure (`pytest`).
- [x] 2. **GREEN — BE Read-Replica Routing (`get_read_db`):** Wired read-only `GET` endpoints across all 14 routers in `backend/app/api/v1/endpoints/` to `get_read_db`.
- [x] 3. **GREEN — BE Cross-Pod Cache Invalidation (`HotPathCache`):** Expanded `invalidate_candidate_cache` in `backend/app/core/cache.py` to purge `shortlist:`, `market:pulse`, `cms:seo_sitemap`, and `analytics:`.
- [x] 4. **GREEN — BE Zero `text(f"...")` SQL Interpolation:** Refactored all 25 `text(f"...")` queries across 9 repositories into static parameterized SQL.
- [x] 5. **GREEN — FE/Mobile 3-Tier Design Token SSOT:** Synced `mobile/src/theme/tokens.ts` header and replaced raw `#hex` in `audio-visualizer-meter.tsx` & `studio-preview.ts` with `DESIGN_TOKENS`.
- [x] 6. **GREEN — QC Zero `waitForTimeout` & Benchmark Gate:** Removed `waitForTimeout` from `qc/tests/e2e/workspace.spec.ts` and `qc/scripts/capture-evidence.ts`, and locked all 5 invariants into `scripts/trust-benchmark.py`.
- [x] 7. **Verify & Deliver:** Run `trust-benchmark.py`, `pytest`, `tsc --noEmit`, push PR closing `#259`, watch CI, merge to `main`, and move `#259` to `Done`.
