---
name: fe-page-user-management
description: Candidate Profile Update (/user/[username]/update) and Account Settings (/user/[username]/settings) in frontend/src/app/user/[username]/. Use when modifying candidate biographical edit forms, credential updates, or account lifecycle management. Not for workspace view (fe-page-workspace).
---

# Candidate User Management & Settings (`/user/[username]/update`, `/settings`)

## Current Reality (AS-IS)
- `frontend/src/app/user/[username]/update/page.tsx`: Full biographical profile edit form submitting to `PATCH /v1/profile/{username}`.
- `frontend/src/app/user/[username]/settings/page.tsx`: UI stub for password rotation and account deletion (see `CURRENT_STATE.md §6`).

## Project-Specific Rules
- **Stub Handling:** Password update and account deletion in `/settings` do not have backend endpoints yet. Never simulate fake success notifications without backend API integration.
- **QC Selectors:**
  - `[data-testid="update-profile-form"]`
  - `[data-testid="update-headline-input"]`
  - `[data-testid="update-bio-textarea"]`
  - `[data-testid="update-submit-btn"]`
  - `[data-testid="settings-password-form"]`
  - `[data-testid="settings-delete-account-btn"]`

## Known Traps
- When editing username or profile fields, always ensure the active JWT token belongs to that username (IDOR protection).

## Canonical Example
- `frontend/src/app/user/[username]/update/page.tsx`

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
