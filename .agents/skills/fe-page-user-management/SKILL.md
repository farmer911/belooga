---
name: fe-page-user-management
description: Authoritative Department Skill for Candidate Profile Update (/user/[username]/update) and Account Settings (/user/[username]/settings). Covers full profile form editing, credential changes, and account lifecycle management.
---

# ⚙️ Department Skill: Candidate User Management & Settings

> **Department:** Frontend Product Engineering — Candidate Lifecycle & Settings Division  
> **Routes:** `frontend/src/app/user/[username]/update/`, `frontend/src/app/user/[username]/settings/`  
> **Type:** Protected Candidate Configuration Interfaces  

---

## 1. Department Role & Mission

This department equips candidates with comprehensive self-service management:
1. **Profile Editor (`/update`):** Deep editing of biographical info, headline, phone number, location, and employment status.
2. **Account Settings (`/settings`):** Password changes, notification preferences, email address updates, and account termination/deletion.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-profile` | `PATCH /v1/profile/{username}` for biographical updates |
| **Upstream (Depends on)** | `be-service-auth` | `POST /v1/users/change-password/`, `DELETE /v1/users/account/` |
| **Downstream (Outputs to)** | `fe-page-workspace` | On form submit, candidate is redirected back to `/user/[username]` with refreshed cache |

---

## 3. Form Validation & Mutation Standards

1. **Schema Validation:**
   - Forms use `react-hook-form` coupled with `zod` schemas ensuring strict matching with backend Pydantic DTOs.
2. **Dirty Form Guards:**
   - If a candidate modifies input fields and attempts navigation without saving, trigger a confirmation warning to prevent accidental data loss.

---

## 4. QC Selectors & Automated Test Assertions

Playwright test suites verify:
* `[data-testid="update-profile-form"]`: Container form in `/update`.
* `[data-testid="update-headline-input"]`: Headline text input.
* `[data-testid="update-bio-textarea"]`: Bio narrative textarea.
* `[data-testid="update-submit-btn"]`: Profile update submit button.
* `[data-testid="settings-password-form"]`: Password change form in `/settings`.
* `[data-testid="settings-delete-account-btn"]`: Account deletion danger button.
