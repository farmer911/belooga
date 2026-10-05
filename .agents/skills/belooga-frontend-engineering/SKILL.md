---
name: belooga-frontend-engineering
description: Technical architecture and engineering guide for Belooga Frontend (Next.js 16.3.8, React 19, App Router, Tailwind CSS v4, Bun, Zustand). Use when modifying frontend layouts, shared UI primitives, styling tokens, custom hooks, or client state. Not for backend endpoints (belooga-backend-engineering) or writing tests (tdd-workflow).
---

# Belooga Frontend Engineering Architecture

> **Architecture:** Next.js 16.3.8 (App Router), React 19, Tailwind CSS v4, Zustand, and Bun runtime.

---

## 1. Directory Structure & Atomic Modularity
- **`src/app/`:** App Router route boundaries (see `CURRENT_STATE.md §3` for active routes). Route pages act as thin orchestrators.
- **`src/components/ui/`:** Headless or styled atomic primitives (`button.tsx`, `input.tsx`, `dialog.tsx`).
- **`src/components/common/`:** Reusable multi-element molecules (`search-input.tsx`).
- **`src/components/features/`:** Feature-scoped domain organisms (`profile/`, `media/`, `studio/`, `timeline/`, `expert-review/`).
- **`src/components/layout/`:** Global shell components (`Header.tsx`, `Footer.tsx`).
- **`src/hooks/`:** Custom hooks encapsulating client state, device streams, and side effects (`use-candidate-profile.ts`, `use-webrtc-studio.ts`, `use-timeline-dnd.ts`, `use-expert-review.ts`).
- **`src/services/`:** HTTP networking client (`api-client.ts`).
- **`src/store/`:** In-memory client authentication store (`auth-store.ts`).

---

## 2. State & Data Fetching Conventions
- **Server State:** Handled via hooks in `src/hooks/` invoking `apiClient`. TanStack Query is installed but currently unused; adopting it across components requires an ADR.
- **Authentication State:** Access tokens reside exclusively in Zustand memory state.
- **High-Frequency Leaf Isolation:** Audio levels, recording timers, and teleprompter scroll states are isolated inside leaf hooks and canvas components to avoid parent page re-rendering.

---

## 3. Styling & Design Tokens (`src/app/globals.css`)
- Tailwind CSS v4 configured via `@theme` tokens in `src/app/globals.css` (`--color-brand-primary`, etc.).
- **Arbitrary Hex Invariant:** Do not introduce new arbitrary hex class notations (e.g. `[#123456]`). The ratchet metric `fe_arbitrary_hex` recorded in `.agents/ratchet.json` must not increase.
- **Zero Global CSS Pollution:** Scoped strictly per `engineering-integrity-and-evidence` §4. Never attach fixed geometry to generic trigger classes (`.modal-trigger`, `.modal-start`).

---

## 4. Self-Verification
```bash
cd frontend && bun x tsc --noEmit
cd qc && bun run test:e2e
python3 scripts/lint-skills.py --quiet
```
