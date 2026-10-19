# Active Working Memory & Execution State (`.agents/STATE.md`)

> **Cap:** Strictly <= 50 lines (`scripts/lint-skills.py`). Overwrite per task; tick `[x]` as steps finish.

## 1. Objective & Hypothesis
- **Task:** Option B — Standardize Frontend Form Validation with `zod` + `@hookform/resolvers/zod`.
- **Hypothesis:** Centralizing Zod schemas in `frontend/src/lib/schemas.ts` (1:1 with Backend Pydantic v2 schemas) and binding `zodResolver` + `formState.errors` across all 10 forms provides deterministic inline validation while keeping page line counts within `.agents/ratchet.json`.

## 2. Pre-Mortem Risks & Blast Radius
- **Zod v3/v4 Compatibility with `@hookform/resolvers`:** Verify `bun x tsc --noEmit` passes with zero type errors between `zod` and `@hookform/resolvers/zod`.
- **Playwright E2E Selectors:** Keep `auth-error-banner` and all existing `data-testid` attributes intact when validation or server errors occur.
- **Zero-Sum Caps:** `.agents/STATE.md` <= 50L, `.agents/PRODUCT_THESIS.md` <= 120L, `SKILL.md` <= 200L.

## 3. Target Files
- **Schemas & Config:** `frontend/package.json`, `frontend/src/lib/schemas.ts`, `GEMINI.md`, `.agents/skills/belooga-frontend-engineering/SKILL.md`.
- **Feature Modals:** `public-contact-modal.tsx`, `report-profile-modal.tsx`, `add-job-dialog.tsx`, `review-booking-dialog.tsx`.
- **Pages:** `contact-us/page.tsx`, `update/page.tsx`, `settings/page.tsx`, `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`.

## 4. Execution Checklist
- [x] Step 1: Install `zod` + `@hookform/resolvers` and record stateful plan in `.agents/STATE.md`.
- [x] Step 2: Create `frontend/src/lib/schemas.ts` with 1:1 Zod schemas & inferred types.
- [x] Step 3: Bind `zodResolver` and inline `errors` across all 4 feature modals and 6 route pages.
- [x] Step 4: Sync `GEMINI.md`, `belooga-frontend-engineering/SKILL.md`, `CURRENT_STATE.md`, `ratchet.json`, and verify `audit-truth.sh`.
