---
name: fe-page-auth
description: Authentication and onboarding pages (/login, /register, /forgot-password, /callback) in frontend/src/app/(auth)/. Use when modifying login forms, registration uniqueness checks, password recovery, or auth token persistence. Not for candidate workspace (fe-page-workspace) or backend auth logic (be-service-auth).
---

# Identity & Authentication (`/(auth)/...`)

## Current Reality (AS-IS)
- App Router auth group located in `frontend/src/app/(auth)/`:
  - `login/page.tsx`: Credential login & redirect.
  - `register/page.tsx`: 300ms debounced username and email availability checks.
  - `forgot-password/page.tsx`: Client-side mock recovery form (stub).
  - `callback/page.tsx`: Static redirect shell.
- State store: `frontend/src/store/auth-store.ts` (Zustand in-memory token and user session).

## Project-Specific Rules
- **Token Security:**
  - JWT access tokens must reside strictly in-memory in Zustand (`auth-store.ts`). Never persist to `localStorage` or `sessionStorage`.
  - Refresh tokens are transported via HttpOnly cookies handled by the browser and backend.
- **QC Selectors:**
  - `[data-testid="login-email-input"]`
  - `[data-testid="login-password-input"]`
  - `[data-testid="login-submit-btn"]`
  - `[data-testid="register-username-input"]`
  - `[data-testid="register-email-input"]`
  - `[data-testid="register-password-input"]`

## Known Traps
- `/forgot-password` and `/callback` are currently architectural stubs. Do not display simulated success states without backend API integration.

## Canonical Example
- `frontend/src/app/(auth)/login/page.tsx`

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
