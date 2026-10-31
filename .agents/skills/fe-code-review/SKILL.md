---
name: fe-code-review
description: Adversarial review of frontend diffs before merge. Use when asked to review a frontend PR or diff, or at ROUTER step 4. Not for writing code.
---

# Frontend & Mobile Code Review Protocol (Primer 3-Tier Design System Enforced)

> **Purpose:** Strict adversarial code review of frontend (`frontend/`) and mobile (`mobile/`) pull requests prior to merging into `main`, enforcing `primer/primitives` & `primer/react` 3-Tier W3C Design Token architecture.

## Blocking Gates (Must REJECT if violated)
1. **No Tokens in Web Storage:** Authentication tokens must never be persisted in `localStorage` or `sessionStorage` (`frontend/src/store/auth-store.ts` uses memory + HttpOnly cookie refresh; `mobile/` uses `expo-secure-store`).
2. **Preserve Test IDs:** Never rename or remove existing `data-testid` or `testID` attributes used by QC specs.
3. **No High-Frequency State in Parent:** Audio levels, teleprompter cursors, and playback times must stay in leaf hooks/components, and `react-hook-form` subscriptions must use `useWatch({ control, name })` instead of bare `watch()` (`eslint --max-warnings=0`).
4. **No Fake Success Toasts or Catch Synthesis:** Never trigger a success toast, mutate state (`fe_silent_catch_mutation: 0`), or synthesize fake AI/CV text inside a `catch` block (`frontend/src/hooks/use-ats-Scan.ts`).
5. **Zero CSS Pollution & Zero Inline Static Styles:** Generic classes (`.modal-trigger`) must not have dimensions or layout styles, and static `style={{ ... }}` objects (`fe_static_inline_styles: 0`) are prohibited.
6. **Primer 3-Tier Design Token SSOT (`tokens/design-tokens.json`):**
   - **Tier 1 (`base`) -> Tier 2 (`semantic`: `light`, `dark`, `neumorphic`) -> Tier 3 (`component`):** All theme colors and component geometry must originate in `tokens/design-tokens.json` and stay 100% synchronized across `frontend/src/app/globals.css`, `frontend/src/lib/design-tokens.ts`, and `mobile/src/theme/tokens.ts` (`python3 scripts/sync-design-tokens.py --check`).
   - Reject any raw `[#hex]` class (`fe_arbitrary_hex: 0`) or hardcoded `bg-white` on cards/modals/inputs (must use `bg-surface-card`, `bg-surface-page`, `text-typography-*`, `border-surface-*`, `bg-brand-*`, `text-status-*`).
7. **Centralized API Endpoints & Zero Dead Hooks/Files:**
   - All payment/API routes must use centralized constants in `frontend/src/services/api-client.ts` (`API_ENDPOINTS`, `API_BASE_URL`) and `mobile/src/services/api-client.ts` (`MOBILE_API_ENDPOINTS`).
   - Reject any temporary `*-part2.ts` filename, any banned preset name (`SAMPLE_CV_DATA`, `PRESET_VNG`, `PRESET_SHOPEE`), or any unused exported mobile hook (`mobile_unused_hooks: 0`).
8. **Zero Structural Emojis (`fe_structural_emoji: 0`) & 375px Responsiveness:** Reject Unicode emojis in JSX; require `lucide-react` SVG icons and `375px` mobile support (`data-testid="mobile-menu-toggle"`).

## Rationalization Prevention Table & Red Flags

| Agent Excuse / Rationalization | Why It Is Wrong (Reality) | Mandatory Reviewer Action |
|---|---|---|
| "I renamed `FALLBACK_*` to `PRESET_VNG` / `SAMPLE_CV_DATA` so the linter passes." | Renaming constants to evade regex is reward-hacking (`VIOLATION-016`). Templates must be role-based (`ATS_TEMPLATE_BACKEND`, `STANDARD_CV_TEMPLATE`). | **REJECT** — Enforced by `eslint.config.mjs` `no-restricted-syntax` & `trust-benchmark.py`. |
| "File hit 300 lines so I split it into `use-mobile-parity-part2.ts`." | Mechanical `-partN` splits destroy domain cohesion and leave dead hooks behind. | **REJECT** — Require domain-named module (`use-mobile-wallet-and-community.ts`) and `mobile_unused_hooks: 0`. |
| "I added a new color directly in `globals.css` without updating `tokens/design-tokens.json`." | Breaks W3C 3-tier Primer SSOT between Web CSS, Web TS, and Mobile RN. | **REJECT** — Update `tokens/design-tokens.json` and verify `python3 scripts/sync-design-tokens.py --check`. |
| "In `catch`, I return a formatted `[AI Tailored Summary...]` string so UX stays smooth." | Masks backend 4xx/5xx errors and deceives the user with fake AI output. | **REJECT** — Surface real API error via `getApiErrorDetail`. |

## Adversarial Review Methodology (`no-mistakes` Protocol)
1. **Independent Reviewer Session:** Author $\neq$ Reviewer $\neq$ Fixer. Review must run in a fresh subagent context against `git diff` and stated Intent; never self-certify a fix in the same session.
2. **Fix by Invariant (Sibling-Site Sweep):** Report the violated UI/state invariant once and list every sibling component, hook, or modal (`file:line`) in the changed scope where the same invariant must hold.
3. **Simplification Pass:** Enumerate every new prop, state variable, fallback branch, or helper. Recommend direct removal for any surface not strictly required by user intent.

## Ratchet Gates (Metrics must not worsen)
- `fe_arbitrary_hex`, `fe_structural_emoji`, `fe_any`, `fe_ts_ignore`, `fe_empty_catch_blocks`, `fe_blind_unknown_casts`, `fe_eslint_disable`, `fe_orphan_components`, `fe_static_inline_styles`, `fe_nested_main_tags`, `mobile_unused_hooks` must all remain `0`.
- `fe_files_over_300_lines` must remain `0`.

## Review Sign-off Template
APPROVE only when:
- TypeScript & Zero-Warning ESLint pass: `cd frontend && bun x tsc --noEmit && bun run lint && bun test`
- Mobile TypeScript & Jest pass: `cd mobile && bun x tsc --noEmit && bun run test`
- Primer Token Sync, Ratchet & Trust check pass: `python3 scripts/sync-design-tokens.py --check && python3 scripts/ratchet.py && python3 scripts/trust-benchmark.py`
Output the literal test execution and ratchet output in the review sign-off.
