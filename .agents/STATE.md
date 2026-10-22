# Active Working Memory (`STATE.md`)

## Objective & Hypothesis
- **Task (BEL-140 — Mobile App Full Feature Re-Update & Executive UI/UX Re-Skin):**
  1. **Root Cause of Ugly Mobile UI:** `MainActivity.java` rendered raw Android 1.0 rectangular `LinearLayout`/`Button`/`EditText` without `GradientDrawable` border-radius, borders, pill badges, active bottom-tab indicators, or KPI/media cards, leaving 65% of the screen blank black.
  2. **Root Cause of Feature Drift:** `mobile/src/` and `mobile/app/` lacked BEL-139 Backend endpoints (`PATCH /v1/tracker/jobs/{id}`, `GET /v1/tracker/jobs/analytics`, `POST /v1/match/ats-scan`, `GET /v1/match/history`, `GET /v1/profile/search/suggest/`, `PATCH /v1/profile/{username}`, `GET /v1/notifications/`).

## Pre-Mortem Risks
- Enforce `fe_files_over_300_lines = 0`, `fe_arbitrary_hex = 0`, `fe_structural_emoji = 0`, `fe_any = 0`.
- Keep all E2E `content-desc` targets (`mobile-discovery-heading`, `mobile-studio-upload-chunks`, `mobile-tracker-move-job_101-INTERVIEW`, `mobile-workspace-heading`) visible above the fold for `UIAutomator2` and `Maestro`.

## Execution Checklist
- [x] **Step 1 (TDD Red):** Add failing unit & contract tests in `mobile/tests/` for new BEL-139 mobile APIs & UI design system primitives
- [x] **Step 2 (Mobile Data & Hooks Re-Update):** Upgrade `schemas.ts`, `use-mobile-discovery.ts`, `use-mobile-studio.ts`, `use-mobile-tracker.ts`, `use-mobile-auth.ts`
- [x] **Step 3 (React Native UI Re-Skin):** Upgrade `tokens.ts`, `native-runtime.ts`, and all screens in `mobile/app/`
- [x] **Step 4 (Android Native UI Re-Skin):** Build `BeloogaUiKit.java` + re-skin `MainActivity.java` (`GradientDrawable` cards, pills, waveforms, KPIs, active bottom dock)
- [x] **Step 5 (Live Emulator E2E & DoD):** Run `bun test`, `bash mobile/scripts/e2e-mobile-adb.sh`, inspect screenshots, run `trust-benchmark.py`, and merge PR
