# Active Working Memory (`STATE.md`)

## Objective & Hypothesis
- **Task (BEL-141 — Mobile Vector Bottom Navbar Re-Skin & Full-Platform Feature Parity):**
  1. **Bottom Navbar Overhaul:** Replace bordered rectangular buttons in `BeloogaUiKit.java` with custom anti-aliased `Canvas` vector icons (`NavIconView`), glowing top active indicator bar, translucent teal pill container, and 5-tab dock (`Discover`, `Studio`, `Tracker`, `Career Pro`, `Workspace`).
  2. **Full-Platform Mobile Parity:** Add `MobileCareerScreens.java`, `use-mobile-career-tools.ts`, and `app/(tabs)/career.tsx` covering ATS Diagnostics & 1-Click AI Tailor, Expert CV Review & MoMo HMAC-SHA256 QR Checkout, IT Salary Benchmark & Upskill ROI, Pro CV Studio Builder, Recruiter AI Shortlist, and Executive BI.
  3. **Live Desktop Simulator Proof:** Verify all 5 tabs via `mobile/scripts/e2e-mobile-adb.sh` on visible `Pixel_5` (`emulator-5554`).

## Pre-Mortem Risks
- Enforce `fe_files_over_300_lines = 0`, `fe_arbitrary_hex = 0`, `fe_structural_emoji = 0`, `fe_any = 0`, `trust-benchmark.py = 100%`.

## Execution Checklist
- [x] **Step 1 (TDD Hooks & Schemas):** Added `use-mobile-career-tools.ts`, `schemas.ts` contracts, and 16/16 unit tests (`bun test`).
- [x] **Step 2 (Vector Bottom Dock & Segmented UI Kit):** Built `NavIconView`, `createModernNavTab`, `createSegmentedBar`, and `MobileCareerScreens.java`.
- [x] **Step 3 (APK Build & Visible Simulator E2E):** Built `belooga-mobile-v1.0.0.apk` and passed 5-tab `e2e-mobile-adb.sh` on `emulator-5554`.
- [x] **Step 4 (Self-Learn & PR Gate):** Recorded V-020 in `docs/VIOLATIONS_REGISTER.md` and promoted guard to `scripts/trust-benchmark.py`.
