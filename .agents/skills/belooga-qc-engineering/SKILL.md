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
│   └── base.page.ts              # Base Page Object Model
├── tests/
│   ├── visual/
│   │   ├── play-button.spec.ts   # Video play button geometry & hover states
│   │   └── asset-integrity.spec.ts# Literal asset resolution & zero broken images
│   └── e2e/
│       ├── auth-flow.spec.ts     # Login, registration, password recovery
│       ├── workspace.spec.ts     # Workspace, bio, WebRTC studio, timeline DnD
│       ├── search.spec.ts        # Search filtering and pagination
│       ├── expert-review.spec.ts # Expert CV Review pricing and booking dialog
│       └── public-routes.spec.ts # Public profile, blog, careers, CMS pages
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

## 4. Test Authoring Rules
1. **Selector Standard:** Target explicit `[data-testid="..."]` attributes. Avoid brittle CSS hierarchies or dynamic classes.
2. **Audio/Video Mocking:** Set `NEXT_PUBLIC_E2E=1` when running tests involving WebRTC or microphone permissions to ensure deterministic mock streams.
3. **Hermetic Test Isolation:** Tests should reset state or target clean seed users rather than mutating shared singletons.

```typescript
test('should verify workspace bio and timeline', async ({ page }) => {
  await page.goto('/user/alexrivera');
  await expect(page.locator('[data-testid="profile-headline"]')).toBeVisible();
  await expect(page.locator('[data-testid="experience-timeline"]')).toBeVisible();
});
```

---

## 5. Execution Commands
```bash
cd qc && bun run test:e2e
cd qc && bun run test:visual
python3 scripts/lint-skills.py --quiet
```
