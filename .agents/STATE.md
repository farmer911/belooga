# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (Build Native Mobile Platform `mobile/` from Scratch via 3 Incremental Feature PRs):**
  1. **PR 1 (`feature/BEL-132-mobile-foundation-auth`):** Dual-mode Refresh Token transport in `backend/app/api/v1/endpoints/auth.py` (cookie + JSON body / `X-Refresh-Token` header for `SecureStore`) + Expo Router / React Native TypeScript scaffold (`mobile/`), Zod schemas, API client with auto-refresh, and Auth screens (`login.tsx`, `register.tsx`).
  2. **PR 2 (`feature/BEL-133-mobile-discovery-profile`):** Recruiter Talent Discovery & 60s Video Pitch Feed (`mobile/app/(tabs)/index.tsx`), ConnectRPC multiplexed Candidate Profile viewer (`mobile/app/candidate/[username].tsx`), and `@tanstack/react-query` hooks (`use-mobile-discovery.ts`).
  3. **PR 3 (`feature/BEL-134-mobile-studio-tracker`):** Native Video Pitch Studio with AI Teleprompter & chunked upload (`mobile/app/(tabs)/studio.tsx`), Job Application Kanban Tracker with offline outbox (`mobile/app/(tabs)/tracker.tsx`), Candidate Settings (`mobile/app/(tabs)/profile.tsx`), and SSOT/Skill guard integration.

## Pre-Mortem Risks
- Keep `backend/app/modules/auth/service.py` strictly <= 300 lines (`be_files_over_300_lines = 0`).
- Preserve 15s grace window & `FOR UPDATE` family rotation for both Cookie and Mobile `X-Refresh-Token` / body refresh tokens.
- Enforce zero raw hex (`fe_arbitrary_hex = 0`), zero `any`, and zero `apiClient` inside `useEffect` across `mobile/src/`.

## Execution Checklist
- [x] **PR 1 (BEL-132):** TDD `backend/tests/test_auth_family_rotation.py` + `mobile/` foundation & auth (`bun test` + `tsc --noEmit`) -> PR & Merge
- [x] **PR 2 (BEL-133):** TDD `mobile/tests/discovery.test.ts` + Talent Feed & Candidate Profile screens -> PR & Merge
- [x] **PR 3 (BEL-134):** TDD `mobile/tests/studio-tracker.test.ts` + Video Pitch Studio & Job Kanban Tracker + SSOT sync -> PR & Merge
