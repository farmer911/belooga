# Active Stateful Working Memory (.agents/STATE.md)

## Active Task: Cross-Platform Design System Re-Check & Primer Best-Practice Remediation (Web, Mobile, Backend PDF, Token Sync Gate)
- **Hypothesis:** Eliminating the remaining raw `#hex` in `backend/app/services/pdf_generator.py` (11 occurrences) and `mobile/app/(tabs)/studio.tsx` (`#000`), replacing dark-mode-breaking Tailwind palette classes (`text-red-950`, `bg-red-50`, `disabled:bg-slate-100`) in `frontend/src/components/{ui,common}/*` with Primer semantic tokens (`status-*`, `surface-divider`), adding Tier 3 `COMPONENT_TOKENS` + `prefers-reduced-motion` across Web CSS & Mobile UI, and locking `scripts/sync-design-tokens.py --check` achieves 100% cross-platform Design System compliance.
- **Risks:**
  1. Verified `backend/app/services/pdf_generator.py` loads `tokens/design-tokens.json` once at module import (zero sync I/O inside async functions).
  2. Verified Web (`56 pass`), Mobile (`25 passed`), and Backend (`12 passed`) suites stay 100% green.

## Execution Checklist (TDD: RED -> Verify RED -> GREEN -> Verify GREEN -> REFACTOR)
- [x] 1. **RED Phase:** Added `test_cross_platform_primer_design_system_best_practices` to `backend/tests/test_ui_design_system_parity.py` and verified failure (`pytest`).
- [x] 2. **GREEN — Web CSS & UI Primitives (`frontend/`):** Added Tier 3 component CSS vars + `@media (prefers-reduced-motion: reduce)` in `globals.css`; bound `button.tsx`, `input.tsx`, `textarea.tsx`, `badge.tsx`, `form-field.tsx`, `confirm-dialog.tsx`, `error-fallback.tsx`, `theme-toggle.tsx` to `status-*` / `surface-*` tokens.
- [x] 3. **GREEN — Mobile (`mobile/`) & Backend PDF (`backend/`):** Exported `COMPONENT_TOKENS` in `mobile/src/theme/tokens.ts`, consumed in `mobile/src/lib/ui.tsx` & `mobile/app/(tabs)/studio.tsx` (removing `#000`), and bound `backend/app/services/pdf_generator.py` to `tokens/design-tokens.json`.
- [x] 4. **GREEN — Cross-Platform Sync Script (`scripts/sync-design-tokens.py`):** Enforced Tier 3 component tokens, zero raw `#hex` in `mobile/app/**` & `backend/app/services/pdf_generator.py`.
- [x] 5. **Verify GREEN:** Verified `sync-design-tokens.py --check`, `frontend` & `mobile` `tsc` + tests, `pytest`, `lint-skills.py`, and `trust-benchmark.py`.
