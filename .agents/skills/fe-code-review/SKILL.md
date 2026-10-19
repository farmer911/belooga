---
name: fe-code-review
description: Adversarial review of frontend diffs before merge. Use when asked to review a frontend PR or diff, or at ROUTER step 4. Not for writing code.
---

# Frontend Code Review Protocol

> **Purpose:** Strict adversarial code review of frontend pull requests and diffs prior to merging into main.

## Blocking Gates (Must REJECT if violated)
1. **No Tokens in Storage:** Authentication tokens must never be persisted in `localStorage` or `sessionStorage`.
2. **Preserve Test IDs:** Never rename or remove existing `data-testid` attributes used by QC specs.
3. **No High-Frequency State in Parent:** Audio levels, teleprompter cursors, and playback times must stay in leaf hooks/components.
4. **No Fake Success Toasts:** Never trigger a success toast or banner for an interactive action lacking real backend support.
5. **Zero CSS Pollution:** Generic classes (`.modal-trigger`) must not have dimensions or layout styles.
6. **Semantic Design Tokens Only:** Reject any raw `[#hex]` class (`fe_arbitrary_hex: 0`) or hardcoded `bg-white` on cards/modals/inputs (must use `bg-surface-card`, `bg-surface-page`, `text-typography-*`, `border-surface-*`, `bg-brand-*`).
7. **Zero Structural Emojis (`fe_structural_emoji: 0`):** Reject Unicode emojis in JSX; require `lucide-react` SVG icons.
8. **Mobile-First 375px Responsiveness:** Header and multi-column layouts must support `375px` mobile viewports (`data-testid="mobile-menu-toggle"`).

## Adversarial Review Methodology (`no-mistakes` Protocol)
1. **Independent Reviewer Session:** Author $\neq$ Reviewer $\neq$ Fixer. Review must run in a fresh subagent context against `git diff` and stated Intent; never self-certify a fix in the same session.
2. **Fix by Invariant (Sibling-Site Sweep):** Report the violated UI/state invariant once and list every sibling component, hook, or modal (`file:line`) in the changed scope where the same invariant must hold.
3. **Simplification Pass:** Enumerate every new prop, state variable, fallback branch, or helper. Recommend direct removal for any surface not strictly required by user intent.

## Ratchet Gates (Metrics must not worsen)
- `fe_arbitrary_hex` must remain `0` (strictly locked).
- `fe_structural_emoji` must remain `0` (strictly locked).
- `fe_any` must not increase.
- `fe_ts_ignore` must not increase (baseline: 0).
- `fe_max_page_lines` must remain under baseline limit.
- `fe_files_over_300_lines` must not increase.

## Review Sign-off Template
APPROVE only when:
- TypeScript check passes: `cd frontend && bun x tsc --noEmit`
- Ratchet & Trust check passes: `python3 scripts/ratchet.py && python3 scripts/trust-benchmark.py`
- Design System parity passes: `backend/.venv/bin/pytest backend/tests/test_ui_design_system_parity.py`
Output the literal test execution and ratchet output in the review sign-off.
