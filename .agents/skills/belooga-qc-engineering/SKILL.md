---
name: belooga-qc-engineering
description: Playwright E2E and visual tests in qc/. Use when writing or fixing specs under qc/tests, page objects in qc/pages, or playwright.config.ts. Not for backend pytest (be-domain-*).
---

# Belooga QC & Automated Testing Engineering Guide (System & Design Primer Gatekeeper)

> **Harness:** Playwright (TypeScript) executed via Bun in `qc/`, Jest + Maestro E2E in `mobile/`, and AST/Primer gates in `scripts/`.

---

## 1. Test Architecture & Directory Layout

```
qc/
├── pages/
│   └── base.page.ts                    # Base Page Object Model
├── tests/
│   ├── visual/
│   │   ├── play-button.spec.ts         # Video play button geometry & hover states
│   │   └── asset-integrity.spec.ts     # Literal asset resolution & zero broken images
│   └── e2e/
│       ├── analytics-dashboard.spec.ts # Executive analytics KPIs & charts
│       ├── ats-diagnostics.spec.ts     # ATS scanner, presets & MoMo QR checkout
│       ├── auth-flow.spec.ts           # Login, registration, password recovery
│       ├── cv-studio.spec.ts           # Interactive CV Studio & print layout
│       ├── expert-review.spec.ts       # Expert CV Review pricing & booking dialog
│       ├── job-tracker-kanban.spec.ts  # Candidate Kanban job tracker
│       ├── navigation-and-theme.spec.ts# Header ecosystem menu & theme toggle
│       ├── public-routes.spec.ts       # Homepage, public profile, blog, careers, CMS
│       ├── salary-benchmark.spec.ts    # Salary percentiles & skill premium radar
│       ├── search.spec.ts              # Search filtering and pagination
│       └── workspace.spec.ts           # Workspace, bio, WebRTC studio, timeline DnD
├── playwright.config.ts
└── package.json
```

---

## 2. Browser & Viewport Matrix
Configured in `qc/playwright.config.ts`:
- **Desktop Chromium:** 1440 × 900
- **Desktop WebKit:** 1440 × 900 (Safari compatibility)
- **Tablet iPad:** 768 × 1024
- **Mobile Phone:** Pixel 5 (393 × 851) & Mobile Safari

---

## 3. Seeded Test Credentials
From `scripts/seed-data.py`:
- Primary Candidate: `alex@belooga.com` / `password123` (Username: `alexrivera`)
- Alternative Candidate: `elena@belooga.com` / `password123` (Username: `elenarostova`)

---

## 4. Test Authoring, Primer Verification & Evidence Rules
1. **Selector Standard:** Target explicit `[data-testid="..."]` attributes. Avoid brittle CSS hierarchies or dynamic classes.
2. **Audio/Video Mocking:** Set `NEXT_PUBLIC_E2E=1` when running tests involving WebRTC or microphone permissions to ensure deterministic mock streams.
3. **Hermetic Test Isolation:** Tests should reset state or target clean seed users from `scripts/seed-data.py` rather than mutating shared singletons.
4. **Always-On Visual & Video Evidence (`screenshot: 'on'`, `video: 'on'`):** Configured in `qc/playwright.config.ts` so passing runs emit screenshot (`.png`) and video (`.webm`) artifacts in `qc/test-results/` for PR attachment, never only on failure.
5. **Zero Orphan Child Processes:** Any test or agent session that spawns disposable dev servers or headless browsers must terminate all child processes before exiting (`scripts/pre-push-gate.sh`).
6. **Zero-Mockup, System Design Primer & Primer Token Verification Gate:**
   - **BE System Design Primer Gate:** Verify read-replica routing (`get_read_db` in `backend/app/core/database.py`), cross-pod L1 Pub/Sub cache invalidation (`apply_remote_invalidation` in `backend/app/core/cache.py`), and Half-Open Circuit Breaker (`circuit_state == "CLOSED"` in `backend/app/core/cache.py` & `backend/app/core/gateway.py`) via `backend/tests/test_bel246_primer_system_and_design_tokens.py`.
   - **FE/Mobile Primer 3-Tier Design Token SSOT Gate:** Verify `tokens/design-tokens.json` (`base -> semantic -> component`) is 100% synchronized with `frontend/src/app/globals.css`, `frontend/src/lib/design-tokens.ts`, and `mobile/src/theme/tokens.ts` by running `python3 scripts/sync-design-tokens.py --check`.
   - **Zero Hardcode & Reward-Hacking Gate:** Verify `backend/tests/test_bel241_245_zero_hardcodes_and_ast_gates.py`, `mobile_unused_hooks: 0` in `.agents/ratchet.json`, and `cd frontend && bun run lint` (`eslint --max-warnings=0`). Never merge a PR containing `*-partN` filenames, runtime seed arrays, or synthetic `catch` fallbacks.

## 5. Rationalization Prevention Table & Red Flags

| QC Agent Excuse / Rationalization | Why It Is Wrong (Reality) | Mandatory QC Action |
|---|---|---|
| "E2E test passed on screen, so I don't need to check if data came from a `catch` fallback or hardcoded schema default." | Passing UI with synthetic fallback (`VIOLATION-013` / `VIOLATION-016`) hides broken APIs. | **REJECT** — Run `trust-benchmark.py` and verify real `200`/`201` responses from FastAPI + PostgreSQL. |
| "Visual colors look close enough; `sync-design-tokens.py` failure is minor." | Any drift between `tokens/design-tokens.json`, `globals.css`, and `mobile/src/theme/tokens.ts` breaks cross-platform Primer parity. | **REJECT** — Require `python3 scripts/sync-design-tokens.py --check` exit `0`. |
| "ESLint only emitted warnings, not errors." | Warnings accumulate technical debt (e.g., React Compiler incompatible `watch()`). `package.json` enforces `--max-warnings=0`. | **REJECT** — Require `0` warnings. |

---

## 6. Execution Commands
```bash
python3 scripts/sync-design-tokens.py --check
python3 scripts/ratchet.py && python3 scripts/trust-benchmark.py
backend/.venv/bin/pytest backend/tests/test_bel241_245_zero_hardcodes_and_ast_gates.py backend/tests/test_bel246_primer_system_and_design_tokens.py -q
cd frontend && bun x tsc --noEmit && bun run lint && bun test
cd mobile && bun x tsc --noEmit && bun test
cd qc && bun run test:e2e
cd qc && bun run test:visual
bash mobile/scripts/build-apk.sh
bash mobile/scripts/e2e-mobile-adb.sh
python3 scripts/lint-skills.py --quiet
```

---

## 7. Mobile App Automation Testing Pyramid & Clean APK Protocol (`mobile/`)

1. **Tier 1 — Behavioural unit/component suite (`cd mobile && bun run typecheck && bun run lint && bun run test --ci`):**
   - `jest-expo` + `@testing-library/react-native`: API client refresh/401 handling, zod schemas, login form validation, discovery list rendering, wallet top-up opens the MoMo `pay_url` and never credits locally, and `mobile_unused_hooks == 0`.
2. **Tier 2 — Clean-first APK build (`bash mobile/scripts/build-apk.sh`):**
   - Purges old `*.apk`/`*.idsig`, runs `bunx expo prebuild --platform android`, builds with Gradle, verifies the signature with `apksigner verify`. EAS profiles live in `mobile/eas.json`.
3. **Tier 3 — Maestro E2E on an emulator/device (`bash mobile/scripts/e2e-mobile-adb.sh` & `mobile/e2e/maestro-flow.yaml`):**
   - Flows select elements by `testID`; always configure `adb reverse tcp:8080 tcp:8080`, `adb reverse tcp:8000 tcp:8000`, and `adb reverse tcp:8081 tcp:8081` before launching `com.belooga.mobile`.
