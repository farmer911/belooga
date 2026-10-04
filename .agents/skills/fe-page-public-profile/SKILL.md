---
name: fe-page-public-profile
description: Authoritative Department Skill for the Public Candidate Profile Page (/public/[username]). Covers view-only profile presentation, shared 30s video pitch player, recruiter contact actions, and candidate reporting modal.
---

# 👤 Department Skill: Public Candidate Profile (`/public/[username]`)

> **Department:** Frontend Product Engineering — Public Profiles & Recruiter Division  
> **Route:** `frontend/src/app/public/[username]/page.tsx`  
> **Type:** Public Showcase & Recruiter Discovery Interface (Read-Only)  

---

## 1. Department Role & Mission

The Public Profile Department renders the recruiter-facing view of a candidate. It exhibits the candidate's authentic elevator pitch, career credentials, and skills without exposing private edit controls or settings.

### Component Hierarchy & Section Decomposition:
```
frontend/src/app/public/[username]/page.tsx (Page Shell & Query Provider)
│
├── 1. PublicHeaderSection (`src/components/organisms/public/public-header-section.tsx`)
│      └── Avatar, full name, headline, location, contact inquiry button, and report modal trigger
│
├── 2. VideoPitchPlayerSection (`src/components/organisms/workspace/video-pitch-section.tsx`)
│      └── Shared 30-second pitch preview card and custom modal video player (DRY reuse)
│
├── 3. PublicTimelineSection (`src/components/organisms/public/public-timeline-section.tsx`)
│      └── Read-only Work Experience & Education list (no drag-and-drop handles, no edit buttons)
│
├── 4. PublicSkillsSection (`src/components/organisms/public/public-skills-section.tsx`)
│      └── Read-only skill badges displaying candidate superpowers
│
└── 5. ReportCandidateModal (`src/components/organisms/public/report-candidate-modal.tsx`)
       └── Compliance modal allowing recruiters/visitors to report spam or inappropriate content
```

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-profile` | `GET /v1/profile/{username}` returning candidate details |
| **Upstream (Depends on)** | `be-service-media` | Streams public video pitch and dynamic PDF resume |
| **Upstream (Depends on)** | `be-service-cms` | `POST /v1/report/` to submit candidate moderation tickets |
| **Shared Component** | `fe-section-workspace-pitch-player` | Reuses exact same modal player logic across public and private views |

---

## 3. Security & Read-Only Invariant Rules

1. **Zero Mutation Leakage:**
   - Under no circumstances should edit buttons (`icon-edit.png`), drag handles (`grip-vertical`), or upload file inputs appear on `/public/[username]`.
2. **Hidden Profile Enforcement:**
   - If a candidate sets `is_hidden = true`, backend returns HTTP 404, and the page renders a polite "Candidate is currently private" banner.

---

## 4. QC Selectors & Automated Test Assertions

Playwright test suite `qc/tests/e2e/public-routes.spec.ts` verifies:
* `[data-testid="public-profile-container"]`: Main page wrapper.
* `[data-testid="public-candidate-name"]`: Heading with candidate name.
* `[data-testid="public-pitch-player-btn"]`: Elevator pitch play trigger.
* `[data-testid="public-timeline-section"]`: Read-only timeline list.
* `[data-testid="report-profile-btn"]`: Modal opener for reporting candidate.
* `[data-testid="report-modal-submit"]`: Submit report form action.

---

## 5. Post-Feature Self-Updating Protocol

Whenever modifying the Public Profile:
1. Ensure visual parity matches the Candidate Workspace without leaking private actions.
2. Verify Report Candidate modal submits successfully to `/v1/report/`.
