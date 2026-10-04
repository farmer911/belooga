---
name: belooga-frontend-engineering
description: Technical architecture and engineering guide for Belooga Frontend (Next.js 16.3.8, React 19, App Router, Tailwind CSS v4, Bun, Zustand). Use when modifying frontend layouts, shared UI primitives, styling tokens, or client state.
---

# Belooga Frontend Engineering Guide

## Current Reality (AS-IS)
- **Framework:** Next.js 16.3.8 + React 19 (App Router) on Bun runtime.
- **Styling:** Tailwind CSS v4 configured via `@theme` in `src/app/globals.css`. Zero `tailwind.config.ts`.
- **Directory Layout:**
  - `src/app/`: 18 routes/boundaries (see `CURRENT_STATE.md §3`).
    - `(public)/`: Marketing and CMS routes (`blog/`, `careers/`, `help/`, `contact-us/`, `privacy-policy/`, `terms-and-conditions/`).
    - `(auth)/`: Authentication routes (`login/`, `register/`, `forgot-password/`, `callback/`).
    - `user/[username]/`: Candidate workspace, profile update, and account settings.
    - `public/[username]/`: Public candidate profile view.
    - `search/`: Candidate search and autocomplete page.
  - `src/components/ui/`: Reusable Tailwind primitives (`button.tsx`).
  - `src/components/layout/`: Global layout components (`header.tsx`, `footer.tsx`).
  - `src/services/`: HTTP client (`api-client.ts`) and media uploads (`media-upload.service.ts`).
  - `src/store/`: Client authentication store (`auth-store.ts`).
- **State Pattern:** Direct React state (`useState`, `useEffect`, `useCallback`) and `apiClient` Axios calls. No global hook abstractions.

## Core Design Tokens (`src/app/globals.css`)
- **Brand Colors:**
  - Primary: `#5bbbae` (Seafoam Teal)
  - Hover: `#497d76`
  - Accent: `#3fc6b7`
  - Dark Contrast: `#21655e`
  - Auth Overlay Tint: `#d7ecea`
- **Surface & Text:**
  - Page Background: `#f8f9fa`
  - Headline Text: `#252525`
  - Body Text: `#666666`

## Architectural Invariants
1. **Zero Global CSS Pollution:** Never attach fixed widths, heights, or layout rules to generic behavioral classes (`.modal-trigger`, `.modal-start`). Scope custom styles strictly using Tailwind utility classes.
2. **Server vs. Client Components:** Default to React Server Components (RSC) for public content. Place `"use client"` only at leaf interactive boundaries (forms, modals, canvas, WebRTC recording).
3. **No Fake Success Banners:** Never simulate a feature completion with hardcoded success toasts if the backend API does not exist. Clearly indicate stub status until backend integration is complete.

## Known Traps
- There is no `src/hooks/` directory in current production. Do not hallucinate imports from `@/hooks/...`.
- `user/[username]/page.tsx` inlines its sections. Do not import non-existent section components from `src/components/organisms/`.

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
