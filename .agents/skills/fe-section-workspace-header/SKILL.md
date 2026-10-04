---
name: fe-section-workspace-header
description: Specialized Section Skill for Candidate Profile Header and Identity Management. Covers avatar uploads, bio updates, visibility toggles, and PDF resume export.
---

# 👤 Section Skill: Profile Header & Identity Management

> [!WARNING] TARGET REFACTORING PATTERN – CURRENTLY INLINED IN APP ROUTER
> **Current Reality:** Inlined in `frontend/src/app/user/[username]/page.tsx` (Profile Header Section)  
> **Target Modular Path:** `frontend/src/components/organisms/workspace/profile-header-section.tsx`  
> **Master Skill:** `fe-page-workspace`  
> **Backend Domain:** Domain 2 (Candidate Profile) & Domain 4 (Media & Uploads)  

---

## 1. Scope Boundary

This section maintains exclusive responsibility for:
1. Candidate avatar rendering, image file picker, and avatar upload mutation.
2. Core identity metadata: Full Name, Professional Headline, Bio, Geographic Location, Phone.
3. Profile visibility toggle: Switching between Public (discoverable by recruiters) and Hidden.
4. Triggering and downloading the dynamic PDF resume (rendered server-side via ReportLab).

❌ **Explicit Non-Responsibilities:** Does NOT render the elevator pitch modal player (handled by `pitch-player`), does NOT record video (handled by `studio`).

---

## 2. API Contracts & Network Mutations

### 2.1. Avatar Upload
* **Endpoint:** `PATCH /v1/profile/{username}/avatar/`
* **Content-Type:** `multipart/form-data`
* **Mutation Handler:**
  ```typescript
  const handleAvatarChange = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.patch(`/v1/profile/${username}/avatar/`, formData);
    queryClient.invalidateQueries({ queryKey: ["candidate-profile", username] });
  };
  ```

### 2.2. Metadata Updates
* **Endpoint:** `PATCH /v1/profile/{username}`
* **Payload:**
  ```json
  {
    "headline": "Senior Full-Stack Engineer",
    "bio": "Passionate about high-performance architecture...",
    "location": "San Francisco, CA",
    "phone": "+1 555-0199",
    "seeking_status": "Actively looking"
  }
  ```

### 2.3. PDF Resume Download
* **Endpoint:** `GET /v1/profile/{username}/pdf/`
* **Response:** Stream binary PDF (`application/pdf`)
* **Client Action:** Triggers native browser download named `{username}_resume.pdf`.

---

## 3. QC Anti-Regression Selectors (Mandatory Preservation)

Playwright E2E tests in `qc/tests/e2e/workspace.spec.ts` target these exact selectors:
* `#avatar-upload-input`: Hidden `<input type="file">` for avatar selection.
* `[data-testid="profile-avatar-img"]`: Rendered `<img>` displaying the candidate avatar.
* `[data-testid="profile-fullname"]`: Heading element with first and last name.
* `[data-testid="profile-headline"]`: Text element displaying job title/headline.
* `[data-testid="profile-location"]`: Text element displaying candidate location.
* `[data-testid="visibility-toggle"]`: Switch/button for public/hidden visibility.
* `[data-testid="download-pdf-btn"]`: Button triggering PDF export.

⚠️ **FORBIDDEN:** Renaming, removing, or replacing these selectors with arbitrary class names is strictly prohibited.
