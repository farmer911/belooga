---
trigger: glob: frontend/**
description: Invariants and standards for Belooga Next.js frontend.
---

# Frontend Rules (Next.js 16 App Router + React 19)

1. **Zero Global CSS Pollution:** Never attach fixed dimensions (`height`, `width`), layout, or background rules to generic behavior/trigger classes (e.g. `.modal-trigger`, `.modal-start`). Scope custom styles cleanly with Tailwind CSS v4 utility classes.
2. **Component Boundaries:** Use React Server Components (RSC) by default for public pages (`app/(public)/`). Reserve `"use client"` for leaf interactive nodes (forms, modals, canvas VU meter, teleprompter).
3. **No Fake Success Banners:** Never simulate a feature completion with hardcoded success toasts if the corresponding backend endpoint does not exist. Clearly show stub or error state until backend integration is complete.
4. **Visual & Interactive Gate:** Always inspect the rendered component in the browser before claiming UI tasks are finished. Test responsiveness and click/hover interactions.
5. **Type Safety:** Ensure zero TypeScript errors (`cd frontend && bun x tsc --noEmit`). Do not use `any` types.
