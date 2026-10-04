---
trigger: glob: qc/**
description: Quality Control & Playwright test automation rules for Belooga.
---

# QC & Test Automation Rules (Playwright + Bun)

1. **Proper Command Invocations:**
   - Execute Playwright via `bun run test:e2e` or `bunx playwright test tests/e2e`.
   - Never use `bun test` in `qc/` (runs Bun's unit runner instead of Playwright).
2. **Deterministic Selectors:**
   - Always target elements using explicit `data-testid` attributes.
   - Do not rely on dynamic class names, XPath, or arbitrary text strings that can change with translations.
3. **Auto-Waiting Over Sleep:**
   - Never use arbitrary sleeps (`page.waitForTimeout`). Use Playwright web-first assertions (`expect(locator).toBeVisible()`).
   - Exception: Specific hardware/audio pauses (e.g. 400ms teleprompter silence) must be explicitly commented.
4. **Hermetic Test Data:**
   - Tests must create their own temporary entities or use deterministic fixtures in `backend/tests/conftest.py`. Never rely on pre-existing mutable state.
