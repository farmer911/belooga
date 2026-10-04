---
name: fe-page-workspace
description: Candidate Workspace page (/user/[username]) in frontend/src/app/user/[username]/page.tsx. Use when modifying workspace layout, bio header, video pitch player, WebRTC studio modal, career timeline, or skills badges. Not for public profile view (fe-page-public-profile) or settings (fe-page-user-management).
---

# Candidate Workspace (`/user/[username]`)

## Current Reality (AS-IS)
- Unified client component in `frontend/src/app/user/[username]/page.tsx` (`"use client"`).
- State coordination: Managed via React hooks (`useState`, `useEffect`, `useCallback`) and `apiClient`.
- Sub-section guides are maintained under `references/`:
  - Bio & Identity: [`references/header-and-bio.md`](references/header-and-bio.md)
  - 30s Pitch Player: [`references/pitch-player.md`](references/pitch-player.md)
  - WebRTC Video Studio: [`references/webrtc-studio.md`](references/webrtc-studio.md)
  - Timeline Drag-and-Drop: [`references/timeline-dnd.md`](references/timeline-dnd.md)
  - Skills Badges: [`references/skills-badges.md`](references/skills-badges.md)

## Project-Specific Rules
- **Data Fetching:** Load candidate profile using `/v1/profile/{username}` via `apiClient`. After any child mutation (bio save, video complete, timeline reorder), re-invoke `loadProfileData()` to ensure fresh state.
- **WebRTC Studio:** The video recording studio is gated by `NEXT_PUBLIC_E2E` in test mode to allow hermetic mock stream injection during automated Playwright runs.
- **QC Test IDs:** Required selectors:
  - `[data-testid="workspace-container"]`
  - `[data-testid="workspace-loading-spinner"]`
  - `[data-testid="workspace-error-banner"]`

## Known Traps
- Sub-components are currently inlined within `page.tsx` (over 3,000 lines). Do not import non-existent components from `src/components/organisms/workspace/`.
- Ensure MediaStream tracks are stopped (`track.stop()`) when closing the WebRTC recording modal to prevent device lock.

## Canonical Example
- State refresh callback in `frontend/src/app/user/[username]/page.tsx`

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
