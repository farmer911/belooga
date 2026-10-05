---
trigger: glob: frontend/**
description: Invariants and standards for Belooga Next.js frontend.
---

# Frontend Rules (Next.js 16 App Router + React 19)

1. **Zero Global CSS Pollution:** Scoped strictly per `.agents/skills/engineering-integrity-and-evidence/SKILL.md` §4. Never attach fixed dimensions, layout, or background rules to generic trigger classes (`.modal-trigger`, `.modal-start`).
2. **Component Boundaries:** Use React Server Components (RSC) where possible. Reserve `"use client"` for interactive stateful nodes, modals, and hooks.
3. **No Fake Success Banners:** Never simulate feature completion with hardcoded success toasts if the corresponding backend endpoint does not exist.
4. **Visual & Interactive Gate:** Always inspect the rendered component in the browser before claiming UI tasks are finished. Test responsiveness and click/hover interactions.
5. **Type Safety:** Ensure zero TypeScript errors (`cd frontend && bun x tsc --noEmit`). Ratchet `fe_any` and `fe_arbitrary_hex` metrics must not worsen.
