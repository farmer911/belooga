---
name: fe-page-public-profile
description: Public candidate profile page (/public/[username]) in frontend/src/app/public/[username]/page.tsx. Use when modifying recruiter-facing view, read-only career timeline, report candidate modal, or public PDF resume download. Not for candidate workspace (fe-page-workspace).
---

# Public Candidate Profile (`/public/[username]`)

## Current Reality (AS-IS)
- Unified public page in `frontend/src/app/public/[username]/page.tsx` (`"use client"`).
- Read-only candidate presentation: avatar, name, headline, location, 30s video pitch, work history, education, skills.
- Fetches data via `GET /v1/profile/{username}` (anonymously accessible).
- Report modal submits moderation tickets to `POST /v1/profile/{user_id}/report/`.

## Project-Specific Rules
- **Strict Read-Only:** Zero edit controls, drag handles, or file upload triggers may appear on this page.
- **Privacy & 404 Guard:** Hidden candidates (`is_hidden = true`) return 404 from the backend; the page renders the not-found state without leaking candidate existence.
- **QC Selectors:**
  - `[data-testid="public-profile-container"]`
  - `[data-testid="public-candidate-name"]`
  - `[data-testid="public-pitch-player-btn"]`
  - `[data-testid="public-timeline-section"]`
  - `[data-testid="report-profile-btn"]`

## Known Traps
- Do not import non-existent section components from `src/components/organisms/public/`.
- Ensure public profile works completely without any auth token (guest visitor scenario).

## Canonical Example
- `frontend/src/app/public/[username]/page.tsx`

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
