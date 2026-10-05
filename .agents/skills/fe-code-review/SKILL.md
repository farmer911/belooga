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

## Ratchet Gates (Metrics must not worsen)
- `fe_arbitrary_hex` must not increase beyond recorded baseline.
- `fe_any` must not increase.
- `fe_ts_ignore` must not increase (baseline: 0).
- `fe_max_page_lines` must remain under baseline limit.
- `fe_files_over_300_lines` must not increase.

## Review Sign-off Template
APPROVE only when:
- TypeScript check passes: `cd frontend && bun x tsc --noEmit`
- Ratchet check passes: `python3 scripts/ratchet.py`
Output the literal test execution and ratchet output in the review sign-off.
