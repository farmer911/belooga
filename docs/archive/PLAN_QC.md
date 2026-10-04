# 🛡️ Belooga QC & Automation Testing Sub-Agent Execution Plan
> **Target:** End-to-End Automation & Visual Regression Test Suite using Playwright  
> **Tech Stack:** Playwright (TypeScript / Bun 1.4+), Chromium, Firefox, WebKit  
> **Authority Standards:** [`belooga-qc-engineering`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/belooga-qc-engineering/SKILL.md), [`legacy-ground-truth-enforcement`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/legacy-ground-truth-enforcement/SKILL.md) & [`VIOLATIONS_REGISTER.md`](file:///Users/phucnguyen/Dev/Beloga/VIOLATIONS_REGISTER.md)

---

## 1. Sub-Agent Mission & Quality Gates
- **Mission:** Act as the uncompromising quality gatekeeper. Execute automated visual regression, end-to-end user journeys, and API contract assertions across all 16 routes.
- **Strict Quality Rule:** No feature or route is considered "Done" without an automated Playwright test proving:
  1. **Visual Parity:** Layout matches legacy design without geometric distortion.
  2. **Interactive States:** Hover, active, focus, and modal states render properly.
  3. **Zero Regression:** Violations V-001 through V-004 never recur.

---

## 2. Parallel Synchronization Milestones
| Milestone | QC Focus | Target Under Test | Pass Criteria |
|---|---|---|---|
| **M1: Harness Setup** | Playwright config, multi-browser projects, fixtures, Base POM | Environment readiness | `bunx playwright test` executes clean empty run |
| **M2: Visual & Anti-Hallucination** | TC-VIS-001..004, brand logo asset tests, CSS pollution check | Frontend Phase 1-5 | 0 broken assets, 54px play button exact geometry |
| **M3: Auth & Security Flows** | TC-AUTH-001..003, token leakage test in localStorage | Frontend Phase 6 + Backend Phase 2 | 0 tokens in localStorage, HttpOnly cookie verified |
| **M4: Workspace & Reorder** | TC-WORK-001..004, drag-and-drop reorder network assertion | Frontend Phase 7 + Backend Phase 3-4 | Reorder array sent with 200 OK |
| **M5: Search & Full Regression** | TC-SRCH-001..003, TC-PUB-001..002, multi-viewport snapshots | Full integrated system | 100% green test suite, HTML report published |

---

## 3. Phase-by-Phase Implementation Checklist

### Phase 1: Test Harness & Environment Setup
- [ ] Initialize QC project in `qc/` using Bun:
  ```bash
  mkdir -p qc && cd qc
  bun init -y
  bun add -d @playwright/test typescript @types/node
  bunx playwright install --with-deps chromium firefox webkit
  ```
- [ ] Create `qc/playwright.config.ts`:
  - [ ] Configure projects: Desktop Chrome (1440x900), Tablet Safari (768x1024), Mobile Chrome (375x667).
  - [ ] Configure `baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'`.
  - [ ] Set `maxDiffPixelRatio: 0.01` for screenshot visual comparisons.
  - [ ] Configure HTML reporter (`qc/playwright-report/`).

### Phase 2: Page Object Models (POMs) Development (`qc/pages/`)
- [ ] `BasePage` (`qc/pages/base.page.ts`):
  - [ ] Header navigation, brand logo assertion, auth state indicators.
  - [ ] Footer links verification helper.
- [ ] `HomePage` (`qc/pages/home.page.ts`):
  - [ ] Hero CTA buttons, video cards locator, hover triggers.
- [ ] `AuthPage` (`qc/pages/auth.page.ts`):
  - [ ] Login form, Register form, Forgot password form interactions.
- [ ] `WorkspacePage` (`qc/pages/workspace.page.ts`):
  - [ ] Left sidebar elements, 0:30 video pitch card, timeline cards, drag-and-drop handles.
- [ ] `SearchPage` (`qc/pages/search.page.ts`):
  - [ ] Search input, suggestion dropdown, result cards, pagination buttons.
- [ ] `PublicCvPage` (`qc/pages/public-cv.page.ts`):
  - [ ] Read-only view checks, PDF export download trigger.

### Phase 3: Suite 1 — Anti-Hallucination & Visual Regression Gate
- [ ] **TC-VIS-001: Video Play Button Geometry & Hover State (`tests/visual/play-button.spec.ts`)**:
  - [ ] Assert `.modal-start` is hidden (`display: none`) before hover.
  - [ ] Assert `.modal-start` becomes visible (`display: flex`) upon card `:hover`.
  - [ ] Assert `.video-play-icon` computed dimensions are exactly `54px × 54px`.
  - [ ] Assert `border-radius: 50%` and `background-color: rgb(255, 255, 255)`.
  - [ ] Assert pseudo-element `:before` renders pure CSS triangle (`border-left-color: rgb(91, 187, 174)` or `#5bbbae`).
- [ ] **TC-VIS-002: Literal Asset Resolution & Zero Synthetic SVGs (`tests/visual/asset-integrity.spec.ts`)**:
  - [ ] Intercept network requests across all 16 routes: assert 0 HTTP 404/500 errors on images.
  - [ ] Assert header logo `src` points to literal `/images/logo-big.png` (height 38px).
- [ ] **TC-VIS-003: Zero Global CSS Pollution on Trigger Classes (`tests/visual/css-pollution.spec.ts`)**:
  - [ ] Verify that generic classes (like `.modal-trigger`) have zero computed width/height/background.
- [ ] **TC-VIS-004: Multi-Viewport Visual Snapshot Regression (`tests/visual/snapshots.spec.ts`)**:
  - [ ] Desktop baseline snapshot (1440x900).
  - [ ] Tablet baseline snapshot (768x1024).
  - [ ] Mobile baseline snapshot (375x667).

### Phase 4: Suite 2 — Authentication & Security E2E (`tests/e2e/auth-flow.spec.ts`)
- [ ] **TC-AUTH-001: Real-time Availability & Registration**:
  - [ ] Type existing username -> Assert error hint appears without page reload.
  - [ ] Fill registration form with valid data -> Assert redirect to onboarding or workspace.
- [ ] **TC-AUTH-002: Login & Client Storage Security**:
  - [ ] Submit valid login credentials -> Assert HTTP 200 OK.
  - [ ] Assert HttpOnly cookie is set for session refresh.
  - [ ] Assert `localStorage.getItem('token')` and `sessionStorage.getItem('token')` are strictly `null`.
- [ ] **TC-AUTH-003: Password Reset Lifecycle**:
  - [ ] Request reset link at `/forgot-password` -> Assert confirmation banner.

### Phase 5: Suite 3 — Candidate Workspace Core (`tests/e2e/workspace.spec.ts`)
- [ ] **TC-WORK-001: Two-Column Responsive Layout**:
  - [ ] Assert desktop sidebar is exactly 320px wide and sticky.
  - [ ] Assert sidebar stacks above main content on mobile (< 768px).
- [ ] **TC-WORK-002: 0:30 Video Pitch Player & Modal**:
  - [ ] Click video play icon -> Assert video playback modal opens.
  - [ ] Press `Escape` key -> Assert modal closes.
- [ ] **TC-WORK-003: Timeline Drag-and-Drop Reorder Persistence**:
  - [ ] Drag item 1 below item 2 -> Assert reorder network mutation is dispatched.
  - [ ] Reload page -> Assert new order persists.
- [ ] **TC-WORK-004: Profile Mutation Persistence**:
  - [ ] Update headline and bio in `/user/[username]/update` -> Save form.
  - [ ] Visit workspace `/user/[username]` -> Assert updated text renders.

### Phase 6: Suite 4 & 5 — Search & Public CV (`tests/e2e/search-and-public.spec.ts`)
- [ ] **TC-SRCH-001: Query String Synchronization**:
  - [ ] Type query in search bar -> Assert URL updates with query params without page reload.
- [ ] **TC-SRCH-002: Autocomplete Debounce**:
  - [ ] Type query -> Assert network request waits 300ms debounce before firing.
  - [ ] Assert top 5 suggestions appear in dropdown.
- [ ] **TC-PUB-001: Public Read-Only View Security**:
  - [ ] Access public candidate profile without auth session -> Assert edit buttons are hidden.
- [ ] **TC-PUB-002: PDF Resume Download**:
  - [ ] Click "Export PDF Resume" -> Assert download event fires with valid PDF MIME type.

---

## 4. Definition of Done (DoD)
- [ ] Full Playwright test suite passes with 100% green status across Chromium, Firefox, WebKit.
- [ ] Visual regression test suite passes with 0 unexpected layout changes.
- [ ] Zero auth tokens detected in client-side storage (`localStorage` / `sessionStorage`).
- [ ] HTML test report generated and published to `qc/playwright-report/index.html`.
