# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (`BEL-520` + Protected Route & Session Guard):** Enforce Frontend Protected Route Guard + HttpOnly Cookie Session Hydration across `/user/[username]/*`:
  1. **Session Hydration (`auth-store.ts`, `auth-guard.tsx`):** Hydrate in-memory Zustand auth state via React Query (`POST /v1/auth/refresh/` with `withCredentials: true`) without storing tokens in `localStorage`/`sessionStorage`.
  2. **Protected Route & Client-Side IDOR Guard (`ProtectedRoute`, `user/[username]/layout.tsx`):** Redirect unauthenticated visitors on `/user/[username]`, `/user/[username]/update`, `/user/[username]/settings` to `/login?next=...`, and redirect cross-user access (`user.username !== username`) to `/public/${username}`.
  3. **Login `?next=` Redirect & Server Logout (`login/page.tsx`, `Header.tsx`):** Honor safe `?next=` post-login redirect and revoke `belooga_refresh_token` cookie on `POST /v1/auth/logout/`.
  4. **Unit & E2E Verification (`auth-flow.spec.ts`, `workspace.spec.ts`):** Add `TC-AUTH-005` testing unauthenticated redirect & cross-user IDOR guard, and authenticate `workspace.spec.ts` via `beforeEach`.

## Pre-Mortem Risks
- Never call `apiClient` inside `useEffect` (use `@tanstack/react-query`). Keep all files <= 300 lines and zero tokens in `localStorage`/`sessionStorage`.

## Execution Checklist
- [x] Update `frontend/src/store/auth-store.ts` with `isHydrated` & `setHydrated`
- [x] Create `frontend/src/components/providers/auth-guard.tsx` & `frontend/src/app/user/[username]/layout.tsx`
- [x] Wire `AuthSessionBootstrap` in `Header.tsx` and `?next=` redirect in `login/page.tsx`
- [x] Add `TC-AUTH-005` in `qc/tests/e2e/auth-flow.spec.ts`, update `workspace.spec.ts`, and verify 51/51 Playwright + `audit-truth.sh`
