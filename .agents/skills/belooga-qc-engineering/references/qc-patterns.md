# 🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS

> **Role Authority:** Lead QC Automation Engineer (10+ Years Experience)  
> **Status:** MANDATORY & ENFORCED FOR ALL TEST SUITES & VERIFICATION HARNESSES  
> **Core Principle:** ZERO-COMPROMISE PRODUCTION STANDARD. No flaky tests, no arbitrary sleeps, no brittle CSS selectors, and 100% deterministic test execution.

---

## 1. COMPONENT-SCOPED PAGE OBJECT MODEL (POM) ARCHITECTURE

Every test suite must encapsulate DOM interactions inside dedicated Page Object classes. Writing raw Playwright locators inside test specifications (`*.spec.ts`) is strictly prohibited.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TEST SPECIFICATION (`tests/e2e/*.spec.ts`)               │
│ • Reads purely like an executable business user story       │
│ • Invokes semantic POM methods (e.g. workspace.addSkill())  │
│ • ZERO RAW SELECTORS, ZERO HARDCODED DOM QUERIES            │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PAGE OBJECT MODEL (`pages/*.page.ts`)                    │
│ • Encapsulates all page-level locators and user workflows   │
│ • Returns child Component POMs for sub-sections / modals    │
│ • Coordinates actions: fill, click, drag-and-drop           │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. COMPONENT POM (`pages/components/*.component.ts`)        │
│ • Scoped strictly to specific UI Organisms (Modal, Canvas)  │
│ • Manages isolated locators within the component boundary   │
└─────────────────────────────────────────────────────────────┘
```

### Best Practice Blueprint:
```typescript
// /qc/pages/workspace.page.ts
import { type Page, type Locator } from "@playwright/test";
import { TimelineModal } from "./components/timeline-modal.component";

export class WorkspacePage {
  readonly page: Page;
  readonly profileName: Locator;
  readonly addExperienceBtn: Locator;
  readonly timelineCard: Locator;

  constructor(page: Page) {
    this.page = page;
    // Strictly utilize dedicated data-testid attributes
    this.profileName = page.getByTestId("profile-display-name");
    this.addExperienceBtn = page.getByTestId("add-experience-button");
    this.timelineCard = page.getByTestId("timeline-card-0");
  }

  async goto(username: string): Promise<void> {
    await this.page.goto(`/user/${username}`);
    await this.profileName.waitFor({ state: "visible" });
  }

  async openAddExperience(): Promise<TimelineModal> {
    await this.addExperienceBtn.click();
    const modal = new TimelineModal(this.page);
    await modal.waitForOpen();
    return modal;
  }
}
```

---

## 2. DETERMINISTIC LOCATOR HIERARCHY

To guarantee tests never break when CSS styles, Tailwind classes, or DOM nesting changes, locators must strictly follow this priority hierarchy:

```
Priority 1 (Mandatory Primary) ──> page.getByTestId("workspace-header")
Priority 2 (Semantic Fallback) ──> page.getByRole("button", { name: "Save" })
Priority 3 (Accessible Form)   ──> page.getByLabel("Job Title")
```

### STRICTLY PROHIBITED LOCATORS (Immediate Rejection):
* ❌ **Brittle CSS Traversal:** `page.locator("div > div.flex > div:nth-child(2) > span")`
* ❌ **Tailwind Class Locators:** `page.locator(".bg-blue-600.text-white")`
* ❌ **Raw XPath:** `page.locator("//div[@class='modal']//button[2]")`

---

## 3. ZERO-SLEEP & ANTI-FLAKINESS INVARIANTS

* **The Absolute Rule:** Calling `page.waitForTimeout()`, `time.sleep()`, or arbitrary thread pauses is **STRICTLY FORBIDDEN**.
* **Why:** Hardcoded sleeps cause false test passes on fast local machines while failing on congested CI runners, or waste dozens of minutes of compute time.
* **Mandatory Replacement:** Playwright Web-First Assertions with automatic polling:
  ```typescript
  // CORRECT: Automatically retries with built-in auto-waiting up to timeout
  await expect(page.getByTestId("timeline-item-0")).toContainText("Software Engineer", { timeout: 5000 });
  await expect(page.getByTestId("confirm-delete-modal")).toBeHidden();
  await expect(page.getByTestId("skills-badge-list")).toHaveCount(5);

  // REJECT: Anti-pattern
  await page.waitForTimeout(3000);
  const text = await page.getByTestId("timeline-item-0").innerText();
  expect(text).toBe("Software Engineer");
  ```

---

## 4. HERMETIC TEST FIXTURES & DATA ISOLATION

* **The Invariant:** Every test must run in a hermetically sealed environment. Tests must NEVER depend on data created by previous tests.
* **Standards:**
  1. **Dynamic Test Tenants:** Generate isolated usernames/emails using UUIDs:
     ```typescript
     const testUsername = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
     ```
  2. **Automated Teardown:** Every test suite mutating database state must implement `afterEach` or database transaction rollbacks to purge test records.
  3. **Network Interception for Error Simulation:** Use `page.route()` to simulate 500 Server Errors, 429 Rate Limits, or offline networks without mutating production infrastructure.

---

## 5. VISUAL REGRESSION & CANVAS STABILIZATION

When testing canvas components (e.g., `<AudioVUMeter />` or video players):
1. **Disable CSS Animations & Carets:** Pass `--disable-animations` or use `animations: "disabled"` in Playwright config.
2. **Deterministic Time Freeze:** Freeze browser clock via `await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"))`.
3. **Pixel Thresholds:** Snapshot diffs must configure maximum allowed pixel ratios ($\le 0.2\%$):
   ```typescript
   await expect(page.getByTestId("vu-meter-canvas")).toHaveScreenshot("vu-meter-idle.png", {
     maxDiffPixelRatio: 0.002,
   });
   ```

---

## 6. REJECTION CHECKLIST FOR SENIOR QC CODE

Before approving any test suite, verify:
- [ ] 100% of test cases interact exclusively through Page Object Model methods.
- [ ] Exactly 0 occurrences of `page.waitForTimeout()` exist in the test codebase.
- [ ] All selectors use `getByTestId` or semantic accessibility roles; zero Tailwind CSS classes are used as locators.
- [ ] Tests execute independently without ordering dependencies.
- [ ] Playwright test suite passes cleanly with exit code `0`: `cd qc && bun run test`.
