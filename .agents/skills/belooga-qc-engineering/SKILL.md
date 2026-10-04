---
name: belooga-qc-engineering
description: Authoritative quality control and test automation engineering guide for Belooga using Playwright (TypeScript/Bun). Contains test case matrices, Page Object Models, visual regression thresholds, anti-hallucination assertions, and anti-regression protocols.
---

# 🛡️ Belooga QC & Automation Testing Engineering Guide

This skill serves as the single source of truth for the **QC / Automation Sub-Agent**. It establishes the Playwright test automation harness, Page Object Model (POM) standards, visual regression gates, and strict anti-hallucination verification protocols.

---

## 1. Technical Stack & Test Environment

- **Test Runner:** `@playwright/test` running under **Bun / Node.js**.
- **Language:** TypeScript with strict typing.
- **Browsers Covered:** Chromium, Firefox, WebKit (Safari).
- **Viewports Matrix:**
  - Desktop: `1440 × 900`
  - Tablet: `768 × 1024`
  - Mobile: `375 × 667` (iPhone SE)
- **Visual Regression Engine:** Playwright screenshot comparison (`expect(page).toHaveScreenshot()` with `maxDiffPixelRatio: 0.01`).

---

## 2. Test Architecture & Directory Layout

```
qc/
├── fixtures/                     # Test data & mock payloads
│   ├── auth.fixture.ts           # Logged-in / Logged-out storage states
│   ├── candidate.fixture.ts      # Hydrated candidate profile mock
│   └── search.fixture.ts         # Mock search results
├── pages/                        # Page Object Models (POMs)
│   ├── base.page.ts              # Base POM with common navigation & assertions
│   ├── home.page.ts              # Route 01: Home page interactions
│   ├── auth.page.ts              # Route 02-04: Login, Register, Forgot Password
│   ├── workspace.page.ts         # Route 05-07: Profile, Update, Settings
│   ├── search.page.ts            # Route 08: Search & autocomplete
│   └── public-cv.page.ts         # Route 09: Public candidate view
├── tests/
│   ├── visual/                   # Visual parity & anti-hallucination tests
│   │   ├── play-button.spec.ts   # TC-VIS-001: 54px play button geometry
│   │   ├── asset-integrity.spec.ts# TC-VIS-002: Zero broken images & no fake SVGs
│   │   ├── css-pollution.spec.ts # TC-VIS-003: Zero dimension pollution
│   │   └── snapshots.spec.ts     # TC-VIS-004: Multi-viewport visual baselines
│   ├── e2e/                      # End-to-end user journeys
│   │   ├── auth-flow.spec.ts     # TC-AUTH-001..003
│   │   ├── workspace.spec.ts     # TC-WORK-001..004
│   │   └── talent-search.spec.ts # TC-SRCH-001..003
│   └── api/                      # Contract & schema integration tests
│       └── contracts.spec.ts     # OpenAPI schema validation
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Strict Quality Gates & Anti-Regression Assertions

### Gate 1: TC-VIS-001 — 54px Play Button & Pure CSS Triangle
```typescript
test('TC-VIS-001: Play button geometry and hover reveal', async ({ page }) => {
  await page.goto('/');
  const videoCard = page.locator('.start-content-video').first();
  const overlay = videoCard.locator('.modal-start');
  const playIcon = videoCard.locator('.video-play-icon');

  // 1. Initial State: Must be hidden
  await expect(overlay).toBeHidden();

  // 2. Hover State: Must be revealed
  await videoCard.hover();
  await expect(overlay).toBeVisible();

  // 3. Geometry: Exactly 54px circle with pure CSS triangle
  const box = await playIcon.boundingBox();
  expect(box?.width).toBe(54);
  expect(box?.height).toBe(54);

  // Check border-radius and background
  const borderRadius = await playIcon.evaluate(el => window.getComputedStyle(el).borderRadius);
  expect(borderRadius).toBe('50%');

  // Verify pure CSS triangle (:before pseudo-element)
  const triangleColor = await playIcon.evaluate(el => {
    return window.getComputedStyle(el, ':before').borderLeftColor;
  });
  expect(triangleColor).toMatch(/(rgb\(91, 187, 174\)|#5bbbae)/);
});
```

### Gate 2: TC-VIS-002 — Literal Asset Resolution & Zero Synthetic SVGs
```typescript
test('TC-VIS-002: Logo resolves to literal logo-big.png and zero broken images', async ({ page }) => {
  const failedRequests: string[] = [];
  page.on('response', response => {
    if (response.status() >= 400 && response.request().resourceType() === 'image') {
      failedRequests.push(response.url());
    }
  });

  await page.goto('/');
  expect(failedRequests).toEqual([]);

  const logoImg = page.locator('header img[alt="Belooga"]').first();
  const src = await logoImg.getAttribute('src');
  expect(src).toContain('logo-big.png');
});
```

### Gate 3: TC-AUTH-002 — Zero Token Leakage in Client Storage
```typescript
test('TC-AUTH-002: Auth tokens must never leak to localStorage or sessionStorage', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@belooga.com');
  await page.fill('input[type="password"]', 'CorrectPassword123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/user/**');

  // Assert localStorage has ZERO auth tokens
  const localToken = await page.evaluate(() => localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('oauth_token'));
  expect(localToken).toBeNull();
});
```

### Gate 4: TC-WORK-003 — Timeline Drag-and-Drop Reorder Persistence
```typescript
test('TC-WORK-003: Reordering timeline sends batch order update to backend', async ({ page }) => {
  await page.goto('/user/testuser');
  
  // Intercept reorder API
  const reorderPromise = page.waitForRequest(req => 
    req.url().includes('/job-experiences/order/') && req.method() === 'POST'
  );

  const firstCard = page.locator('[data-testid="timeline-job-card"]').first();
  const secondCard = page.locator('[data-testid="timeline-job-card"]').nth(1);

  await firstCard.dragTo(secondCard);
  const request = await reorderPromise;
  const postData = JSON.parse(request.postData() || '{}');
  expect(Array.isArray(postData.orders)).toBeTruthy();
});
```

---

## 4. Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'Tablet Safari',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 667 } },
    },
  ],
});
```
