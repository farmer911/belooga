# Section Reference: Profile Header & Identity Management

- **Component:** `frontend/src/components/features/profile/profile-header-card.tsx`
- **Hook:** `frontend/src/hooks/use-candidate-profile.ts`
- **Master Skill:** `fe-page-workspace`
- **Backend Domain:** Domain 2 (Candidate Profile) & Domain 4 (Media & Uploads)

---

## 1. Scope Boundary
This section maintains responsibility for:
1. Candidate avatar rendering, image file picker, and avatar upload mutation.
2. Core identity metadata: Full Name, Professional Headline, Bio, Geographic Location, Phone.
3. Profile visibility toggle: Switching between Public (discoverable) and Hidden (`is_hidden`).
4. Triggering and downloading the dynamic PDF resume (rendered via ReportLab).

---

## 2. API Contracts & Network Mutations
- **Avatar Upload:** `PATCH /v1/profile/{username}/avatar/` (`multipart/form-data`)
- **Metadata Updates:** `PATCH /v1/profile/{username}`
- **PDF Resume Download:** `GET /v1/profile/{username}/pdf/` (stream `application/pdf`)

---

## 3. QC Anti-Regression Selectors
Playwright E2E tests target these exact test IDs:
- `#avatar-upload-input`: Hidden file input for avatar selection.
- `[data-testid="profile-avatar-img"]`: Rendered avatar `<img>`.
- `[data-testid="profile-fullname"]`: Heading element with first and last name.
- `[data-testid="profile-headline"]`: Job title / professional headline.
- `[data-testid="profile-location"]`: Candidate location text.
- `[data-testid="visibility-toggle"]`: Public / hidden toggle button.
- `[data-testid="download-pdf-btn"]`: PDF resume download button.
