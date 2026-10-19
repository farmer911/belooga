---
name: belooga-frontend-engineering
description: Technical architecture and engineering guide for Belooga Frontend (Next.js 16.3.8, React 19, App Router, Tailwind CSS v4, Bun, Zustand). Use when modifying frontend layouts, shared UI primitives, styling tokens, custom hooks, or client state. Not for backend endpoints (belooga-backend-engineering) or writing tests (tdd-workflow).
---

# Belooga Frontend Engineering Architecture

> **Architecture:** Next.js 16.3.8 (App Router), React 19, Tailwind CSS v4, Zustand, and Bun runtime.

---

## 1. Directory Structure & Atomic Modularity
- **`src/app/`:** App Router route boundaries (see `CURRENT_STATE.md §3` for active routes). Route pages act as thin orchestrators.
- **`src/components/ui/`:** Headless or styled atomic primitives (`button.tsx`, `input.tsx`, `dialog.tsx`, `card.tsx`, `badge.tsx`).
- **`src/components/common/`:** Reusable multi-element molecules (`form-field.tsx`, `confirm-dialog.tsx`, `skill-badge.tsx`, `theme-toggle.tsx`).
- **`src/components/features/`:** Feature-scoped domain organisms (`profile/`, `media/`, `studio/`, `timeline/`, `expert-review/`, `ats-diagnostics/`, `cv-studio/`, `job-tracker/`, `salary-benchmark/`, `analytics/`, `payments/`).
- **`src/components/layout/`:** Global shell components (`Header.tsx`, `Footer.tsx`, `ecosystem-menu.tsx`).
- **`src/hooks/`:** Custom hooks encapsulating client state, device streams, and side effects (`use-candidate-profile.ts`, `use-webrtc-studio.ts`, `use-timeline-dnd.ts`, `use-expert-review.ts`, `use-ats-diagnostics.ts`, `use-job-tracker.ts`, `use-analytics-dashboard.ts`).
- **`src/lib/`:** Shared utilities, studio configs, and centralized Zod validation schemas (`schemas.ts`) synced 1:1 with Backend Pydantic v2 schemas.
- **`src/services/`:** HTTP networking client (`api-client.ts`).
- **`src/store/`:** In-memory client authentication store (`auth-store.ts`).

---

## 2. State & Data Fetching Conventions
- **Server State (`@tanstack/react-query` Mandatory):** All API queries and cache invalidations MUST use `@tanstack/react-query` (`useQuery`, `useMutation`, `useQueryClient`) wrapped by `QueryProvider` (`src/components/providers/query-provider.tsx`) in `src/app/layout.tsx`. **NEVER call `apiClient` or `fetch` inside `useEffect`.**
- **Form State & Validation (`react-hook-form` + `zod` Mandatory):** Multi-field forms and modal dialogs MUST use `useForm` (`register`, `handleSubmit`, `reset`, `watch`, `formState.errors`) with `zodResolver` from `@hookform/resolvers/zod` backed by centralized schemas in `src/lib/schemas.ts` and paired with `useMutation`. Render inline field errors (`errors.<field>?.message`) instead of manual `useState` checks or `alert()` validation calls.
- **Authentication State:** Access tokens reside exclusively in Zustand memory state.
- **High-Frequency Leaf Isolation:** Audio levels, recording timers, and teleprompter scroll states are isolated inside leaf hooks and canvas components to avoid parent page re-rendering.

---

## 3. Production Design System & Semantic Tokens (`src/app/globals.css`)
- **Zero Arbitrary Hex Invariant (`fe_arbitrary_hex == 0`):** NEVER write raw hex classes (`bg-[#5bbbae]`, `text-[#252525]`, `border-[#d1d6da]`). Always bind to Tailwind v4 `@theme` semantic tokens declared in `src/app/globals.css`:
  - **Brand:** `bg-brand-primary` (`#5bbbae`), `hover:bg-brand-hover` (`#497d76`), `text-brand-accent` (`#3fc6b7`), `text-brand-dark` (`#21655e`), `text-brand-blue` (`#39a0e8`), `bg-brand-overlay` (`#d7ecea`).
  - **Surfaces (Dark-Mode Adaptive):** `bg-surface-page` (`#f8f9fa` / `#0f172a`), `bg-surface-card` (`#ffffff` / `#1e293b`), `bg-surface-subtle` (`#fafafa` / `#1e293b`), `border-surface-border` (`#d1d6da` / `#334155`), `border-surface-divider` (`#f0f2f5` / `#1e293b`).
  - **Typography (Dark-Mode Adaptive):** `text-typography-main` (`#252525` / `#f8fafc`), `text-typography-heading` (`#515151` / `#e2e8f0`), `text-typography-body` (`#666666` / `#cbd5e1`), `text-typography-muted` (`#737475` / `#94a3b8`).
- **Dark-Mode Surface Rule:** Never hardcode `bg-white` on cards, dialogs, inputs, badges, or page shells; use `bg-surface-card` or `bg-surface-page` so `.dark` theme switching works automatically without per-component `dark:*` overrides.
- **Zero Structural Emoji Rule (`fe_structural_emoji == 0`):** Never render Unicode emojis (`🚀`, `🌙`, `🎯`, `💡`) in JSX components. Always use `lucide-react` SVG icons with consistent stroke/sizing (`w-4 h-4`, `aria-hidden="true"`).
- **Zero Global CSS Pollution:** Scoped strictly per `engineering-integrity-and-evidence` §4. Never attach fixed geometry to generic trigger classes (`.modal-trigger`, `.modal-start`).

---

## 4. Responsive Breakpoint Matrix & Accessibility Standards
- **4-Viewport Responsive Contract:** Every page and layout shell must render with zero horizontal overflow across:
  - **Mobile (`375px`):** Single-column stack (`grid-cols-1`), collapsible mobile navigation drawer (`data-testid="mobile-menu-toggle"` & `data-testid="mobile-nav-drawer"`), touch targets `>= 44x44px` (`h-10` / `p-2.5`).
  - **Tablet (`768px` / `md:`):** 2-column grids (`md:grid-cols-2`), condensed header navigation.
  - **Laptop (`1024px` / `lg:`):** 3-column workspace/dashboard splits (`lg:grid-cols-3`, `lg:col-span-2`).
  - **Desktop (`1440px` / `max-w-7xl`):** Centered container (`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`).
- **Interactive States:** Every interactive control must define `hover:`, `focus-visible:ring-2 focus-visible:ring-brand-primary/30`, `disabled:opacity-50`, and `aria-expanded` / `aria-label` attributes on icon-only triggers.

---

## 5. Self-Verification
```bash
cd frontend && bun x tsc --noEmit
python3 scripts/ratchet.py
backend/.venv/bin/pytest backend/tests/test_ui_design_system_parity.py -v
cd qc && bun run test:e2e
python3 scripts/lint-skills.py --quiet
```
