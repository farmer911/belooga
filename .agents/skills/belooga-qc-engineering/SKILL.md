---
name: belooga-qc-engineering
description: Playwright E2E and visual tests in qc/. Use when writing or fixing specs under qc/tests, page objects in qc/pages, or playwright.config.ts. Not for backend pytest (be-service-*).
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
python3 scripts/lint-skills.py --quiet
```
