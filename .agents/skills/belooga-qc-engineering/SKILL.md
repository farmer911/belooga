---
name: belooga-qc-engineering
description: Playwright E2E and visual tests in qc/. Use when writing or fixing specs under qc/tests, page objects in qc/pages, or playwright.config.ts. Not for backend pytest (be-domain-*).
---

# Belooga QC & Automated Testing Engineering Guide

> **Harness:** Playwright (TypeScript) executed via Bun in `qc/`.

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

## 4. Test Authoring & Evidence Rules
1. **Selector Standard:** Target explicit `[data-testid="..."]` attributes. Avoid brittle CSS hierarchies or dynamic classes.
2. **Audio/Video Mocking:** Set `NEXT_PUBLIC_E2E=1` when running tests involving WebRTC or microphone permissions to ensure deterministic mock streams.
3. **Hermetic Test Isolation:** Tests should reset state or target clean seed users rather than mutating shared singletons.
4. **Always-On Visual & Video Evidence (`screenshot: 'on'`, `video: 'on'`):** Configured in `qc/playwright.config.ts` so passing runs emit screenshot (`.png`) and video (`.webm`) artifacts in `qc/test-results/` for PR attachment, never only on failure.
5. **Zero Orphan Child Processes:** Any test or agent session that spawns disposable dev servers or headless browsers must terminate all child processes before exiting (`scripts/pre-push-gate.sh`).

```typescript
test('should verify workspace bio and timeline', async ({ page }) => {
  await page.goto('/user/alexrivera');
  await expect(page.locator('[data-testid="profile-headline"]')).toBeVisible();
  await expect(page.locator('[data-testid="timeline-job-card"]').first()).toBeVisible();
});
```

---

## 5. Execution Commands
```bash
cd qc && bun run test:e2e
cd qc && bun run test:visual
cd mobile && bun test
bash mobile/scripts/build-apk.sh
bash mobile/scripts/e2e-mobile-adb.sh
python3 scripts/lint-skills.py --quiet
```

---

## 6. Mobile App Automation Testing Pyramid & Clean APK Protocol (`mobile/`)

1. **Tier 1 — In-Process Store, Schema & Singleflight Hook Suite (`cd mobile && bun test`):**
   - Verifies `SecureStore` keychain hydration, singleflight 401 refresh rotation (`/v1/auth/refresh/`), ConnectRPC `/v1/rpc/*` profile multiplexing, and offline Kanban outbox queueing in <50ms without emulator boot overhead.
2. **Tier 2 — Clean-First Native APK Build & Cryptographic Signature Gate (`bash mobile/scripts/build-apk.sh`):**
   - **Mandatory Old-APK Purge:** Always deletes all prior `*.apk` and `*.idsig` files across `mobile/dist/` and `mobile/android/app/build/` (`find ... -name "*.apk" -delete`) before compiling so stale builds can never be installed by mistake.
   - Bundles the React Native `0.88.0` TypeScript app into `assets/index.android.bundle`, compiles native Android SDK 36 resources (`aapt2`) and Java bytecode (`javac --release 11` -> `d8` `classes.dex`), aligns with `zipalign -p 4`, signs with `apksigner`, and verifies v2/v3 signatures (`apksigner verify --verbose`).
3. **Tier 3 — Live Android Emulator UIAutomator2 & Maestro E2E (`bash mobile/scripts/e2e-mobile-adb.sh` & `mobile/e2e/maestro-flow.yaml`):**
   - **Why ADB UIAutomator2 + Maestro over Appium:** Appium requires a heavy WebDriver HTTP daemon and Java bootstrap prone to socket flakiness. **ADB UIAutomator2 (`adb shell uiautomator dump`)** and **Maestro declarative YAML flows** inspect native Android `content-desc` / `resource-id` (`testID`) directly over ADB, compute exact view bounds `[x1,y1][x2,y2]`, dispatch native hardware taps (`adb shell input tap`), capture `.png` visual proof (`adb exec-out screencap -p`), and audit `adb logcat -d` for zero `FATAL EXCEPTION` crashes.
   - **Emulator Loopback Invariant:** Android Emulators isolate `127.0.0.1` to the guest OS; always configure `adb reverse tcp:8080 tcp:8080`, `adb reverse tcp:8000 tcp:8000`, and `adb reverse tcp:8081 tcp:8081` before launching `com.belooga.mobile/.MainActivity`.
