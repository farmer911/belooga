# Active Working Memory (`STATE.md`)

🎯 Đang làm ticket: [BEL-147] (#57) — Candidate Shortlist Bookmark Parity on Expo & Android Native Discover Screen | Role: mobile | Cột: Testing

## Objective & Hypothesis
- **Completed Tickets in Session:**
  1. `[BEL-150]` (#65 — Team Signal Handshake & Listen Onboarding): Transitioned `Todo -> In Progress -> Testing` (`7bd84c2d`).
  2. `[BEL-147]` (#57 — Candidate Shortlist Bookmark Parity on Expo & Android Native Discover Screen):
     - Implemented `mobile/src/hooks/use-mobile-bookmarks.ts` (`GET/POST/DELETE /v1/bookmarks/`) + `mobile/tests/bookmarks.test.ts` (20/20 unit tests pass).
     - Added `filter-saved-shortlist-chip` (`>= 44dp`) and `bookmark-candidate-<username>` (`44x44dp`) on Expo Discover (`mobile/app/(tabs)/index.tsx`) and Android Native (`BeloogaUiKit.java`, `MainActivity.java`).
     - Built clean signed APK (`belooga-mobile-v1.0.0.apk`) and verified UIAutomator2 E2E on `emulator-5554`.
     - Opened PR #66 (`feature/BEL-147-mobile-bookmarks`) and moved #57 (`PVTI_lAHOAeXQP84BoMSnzhCoswg`) to `Testing` (`7bd84c2d`).
