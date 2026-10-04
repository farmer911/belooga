---
name: belooga-knowledge-vault
description: Master ground-truth knowledge repository for Belooga full-stack architecture. Ingests all 16 page families, 36 active FastAPI endpoints across 8 service domains, 24 PostgreSQL tables, E2E test suites, and operational verification evidence.
---

# 🧠 Belooga Master Knowledge Vault & API / Page Catalog

This skill provides an authoritative, complete, and instant knowledge ingestion baseline ("nạp knowledge") for all AI agents, engineers, and automated quality gates working on the Belooga Platform.

> [!IMPORTANT]
> Code is the Single Source of Truth. If any documentation contradicts running code, the code is right and the documentation must be updated. This skill documents the **AS-IS (Current Runtime Reality)**. For architectural evolution, see `docs/adr/`.

---

## 1. 16-Route Frontend Page Inventory

All 16 page families are implemented in Next.js 16.3.8 + React 19 (App Router) with Bun, Tailwind CSS v4 (`@theme` architecture in `frontend/src/app/globals.css`), custom UI primitives in `frontend/src/components/ui/`, and Zustand client state management (with TanStack Query installed for planned state migration):

| Route # | Route Path | Component / Entry Point | Domain / Functionality | Key Features & Anti-Hallucination Constraints |
|:---|:---|:---|:---|:---|
| **01** | `/` | `src/app/page.tsx` | Landing & Talent Discovery | 54px pure CSS hover play button (`.video-play-icon:before` triangle), literal `/images/logo-big.png`, candidate pitch carousels, 3-step value prop. |
| **02** | `/login` | `src/app/(auth)/login/page.tsx` | Recruiter & Candidate Auth | Split-screen layout with `#d7ecea` overlay tint, email/password validation, auto-refresh token cookie setup. |
| **03** | `/register` | `src/app/(auth)/register/page.tsx` | Candidate Onboarding | 300ms debounced username and email availability checks against backend API, real-time feedback badges. |
| **04** | `/forgot-password`| `src/app/(auth)/forgot-password/page.tsx` | Password Recovery | Client-side mock flow (API integration pending). |
| **05** | `/user/[username]` | `src/app/user/[username]/page.tsx` | Workspace & Dashboard | 320px sticky sidebar, 0:30 video elevator pitch modal, drag-and-drop experience timeline with drag handles. |
| **06** | `/user/[username]/update` | `src/app/user/[username]/update/page.tsx`| Profile Editor | Multi-step form for headline, bio, location, education, job experience entries with optimistic state rollback. |
| **07** | `/user/[username]/settings`| `src/app/user/[username]/settings/page.tsx`| Account Settings | Client-side mock UI for password rotation and account deletion danger zone. |
| **08** | `/search` | `src/app/search/page.tsx` | Talent Discovery & Search | Two-way URL query synchronization (`?q=React&location=Remote`), debounced autocomplete suggestions, candidate card grid, numeric pagination. |
| **09** | `/public/[username]`| `src/app/public/[username]/page.tsx` | Public Recruiter View | Read-only candidate CV, resume download, video pitch playback, candidate report/flag modal. |
| **10A**| `/privacy-policy` | `src/app/(public)/privacy-policy/page.tsx`| Legal Compliance | Privacy policy clauses, cookie usage disclosures, data retention rules. |
| **10B**| `/terms-and-conditions` | `src/app/(public)/terms-and-conditions/page.tsx`| Legal Compliance | Platform terms of service, acceptable use policies, disclaimer of warranties. |
| **11** | `/contact-us` | `src/app/(public)/contact-us/page.tsx` | Recruiter & Candidate Support| Inquiry submission form with topic dropdown, integrated with backend CMS inquiry API. |
| **12** | `/help` | `src/app/(public)/help/page.tsx` | Help Center & FAQs | Expandable accordion UI categorized by candidates, recruiters, and video recording guidelines. |
| **13** | `/careers` | `src/app/(public)/careers/page.tsx` | Internal Hiring Board | Job listings grouped by engineering, product, and sales with direct application triggers (client-side modal). |
| **14** | `/blog`, `/blog/[slug]` | `src/app/(public)/blog/page.tsx`, `[slug]/page.tsx` | Thought Leadership & Insights | Editorial grid layout, reading time indicators, slug-based dynamic article viewer. |
| **15** | `/callback` | `src/app/(auth)/callback/page.tsx` | OAuth SSO Callback | OAuth token exchange handler stub. |
| **16** | `/not-found` | `src/app/not-found.tsx` | Error Boundary | 404 error screen with search bar redirection and home navigation button. |

---

## 2. 8 Service Domains & Verified API Catalog (36 Active Endpoints)

The FastAPI async monolith (`http://localhost:8000`) provides 36 active endpoints across 8 service domains with PostgreSQL 16 TSVECTOR search, token family rotation, and IDOR protection:

### Domain 1: Identity & Authentication Vault — 7 Endpoints
- `GET /v1/users/exists/email/`: Debounced check for email registration availability.
- `GET /v1/users/exists/username/`: Debounced check for candidate username availability.
- `POST /v1/users/register/`: Registers new candidate identity and profile, issues token pair.
- `POST /v1/auth/login/`: Validates credentials, issues JWT access token and HttpOnly refresh cookie.
- `POST /v1/auth/refresh/`: Rotates refresh token within family, detects replay attacks.
- `GET /v1/auth/me/`: Returns authenticated user profile and identity details.
- `POST /v1/auth/logout/`: Revokes active refresh token session and clears cookie.

### Domain 2: Candidate Profiles — 4 Endpoints
- `GET /v1/profile/{username}`: Candidate profile with timeline & skills (respects `is_hidden` privacy guard and conceals PII for anonymous callers).
- `PATCH /v1/profile/{username}`: Updates biographical headline, bio, location, phone, status, and visibility (IDOR protected).
- `POST /v1/profile/{username}/skills/`: Links a skill to candidate profile (IDOR protected).
- `DELETE /v1/profile/{username}/skills/{skill_name}/`: Unlinks a skill from candidate profile (IDOR protected).

### Domain 3: Career Timeline & Reordering — 8 Endpoints
- `GET /v1/profile/{username}/job-experiences/`: Chronological list of work experiences.
- `POST /v1/profile/{username}/job-experiences/`: Creates job experience item (IDOR protected).
- `DELETE /v1/profile/{username}/job-experiences/{item_id}/`: Deletes job experience by ID (IDOR protected).
- `POST /v1/profile/{username}/job-experiences/order/`: Pessimistic lock (`FOR UPDATE`) reordering of jobs.
- `GET /v1/profile/{username}/education/`: Chronological list of educational credentials.
- `POST /v1/profile/{username}/education/`: Creates education credential (IDOR protected).
- `DELETE /v1/profile/{username}/education/{item_id}/`: Deletes education by ID (IDOR protected).
- `POST /v1/profile/{username}/education/order/`: Pessimistic lock (`FOR UPDATE`) reordering of education.

### Domain 4: Media, Video Uploads & PDF Generation — 7 Endpoints
- `PATCH /v1/profile/{username}/avatar/`: Uploads avatar image via non-blocking disk I/O (IDOR protected).
- `PATCH /v1/profile/{username}/resume/`: Uploads PDF resume via non-blocking disk I/O (IDOR protected).
- `DELETE /v1/profile/{username}/resume/`: Removes PDF resume (IDOR protected).
- `GET /v1/profile/{username}/pdf/`: Generates dynamic ReportLab PDF resume stream (respects `is_hidden`).
- `POST /v1/media/upload/chunk`: Uploads binary video chunk non-blockingly (IDOR protected).
- `POST /v1/media/upload/complete`: Reassembles chunks, triggers FFmpeg H.264 transcoding (IDOR protected).
- `GET /v1/profile/{username}/video-status/`: Polls video transcoding and thumbnail status.

### Domain 5: WebRTC Video Studio
- Client-side WebRTC MediaRecorder engine with MediaStream capture, real-time VU meter canvas, speech-following teleprompter, and chunked upload streaming.

### Domain 6: Talent Discovery & Search Engine — 2 Endpoints
- `GET /v1/profile/search/`: Full-text search ranked via PostgreSQL `ts_rank` on `search_vector`.
- `GET /v1/profile/search/suggest/`: Fast autocomplete suggestions querying candidate profiles via `ILIKE` on `is_hidden = FALSE`.

### Domain 7: Master Catalogs & Taxonomies — 4 Endpoints
> [!NOTE] CURRENT STATE: Catalogs currently serve standardized in-memory suggestion dictionaries for company, school, location; skills is queried from database.
- `GET /v1/profile/skills/`: Suggestions across standardized skills taxonomy.
- `GET /v1/profile/company/`: Suggestions across verified company directories.
- `GET /v1/profile/school/`: Suggestions across accredited universities.
- `GET /v1/profile/location/`: Suggestions across geographic locations.

### Domain 8: Public CMS & Moderation — 4 Endpoints
- `POST /v1/contact/`: Submits contact inquiry ticket.
- `GET /v1/faqs`: Retrieves platform FAQs grouped by category.
- `GET /v1/career/jobs/`: Returns open internal careers job requisitions.
- `POST /v1/profile/{user_id}/report/`: Submits candidate moderation / trust & safety report.

### Root Health & Metadata Probes — 2 Endpoints
- `GET /health`: Liveness and health probe returning `{"status": "healthy"}`.
- `GET /v1`: API root discovery metadata returning domain directory.

---

## 3. Database Schema Mapping (24 Tables in `backend/initdb.sql`)

The PostgreSQL 16 database consists of exactly 24 tables defined in `backend/initdb.sql`:

1. `identities`: Core authentication vault (UUID, email, Argon2id password_hash, role, status).
2. `refresh_sessions`: Secure refresh token vault with token family tracking, expiration, and replay protection.
3. `social_accounts`: OAuth provider linkages (GitHub, Google, LinkedIn).
4. `password_reset_tokens`: Time-limited password reset tokens with SHA-256 hash.
5. `email_verification_tokens`: Verification tokens for newly registered candidate emails.
6. `candidate_profiles`: Candidate identity profile (username, first_name, last_name, headline, bio, location, phone, employment_status, seeking_status, avatar_url, video_pitch_url, resume_url, is_hidden, is_fresh, submitted, TSVECTOR `search_vector`).
7. `profile_media`: Media assets (category, file_url, mime_type, file_size_bytes).
8. `job_experiences`: Chronological work history with `display_order` index.
9. `education_experiences`: Degrees, institutions, GPA, and `display_order` index.
10. `award_certifications`: Honors, awards, professional licenses, and `display_order` index.
11. `skills`: Controlled dictionary of skills with GIN trigram index (`name gin_trgm_ops`).
12. `profile_skills`: Many-to-many junction table between `candidate_profiles` and `skills`.
13. `languages`: Controlled dictionary of spoken languages.
14. `profile_languages`: Many-to-many junction table with language proficiency levels.
15. `interests`: Controlled dictionary of candidate hobbies and interests.
16. `profile_interests`: Many-to-many junction table between candidate profiles and interests.
17. `catalog_companies`: Master directory of verified employers and branding logos.
18. `catalog_schools`: Master directory of accredited colleges and universities.
19. `catalog_locations`: Geographic dictionary of cities, states, and countries.
20. `video_archives`: Assembled video elevator pitch archives.
21. `contact_inquiries`: Contact form submissions and recruiter outreach tickets.
22. `profile_reports`: Candidate moderation reports with UUID target and reason.
23. `career_postings`: Open internal Belooga job postings.
24. `career_applications`: Candidate job applications and resume attachments.

---

## 4. QC Automation & Testing Matrix

- **Framework:** Playwright (TypeScript/Bun) with web-first assertions.
- **Configured Matrix:** Desktop Chromium, Desktop WebKit (Safari), Mobile Chrome, Tablet iPad.
- **Test Suites:**
  - `auth-flow.spec.ts`: Real-time availability check, registration, login, zero client-side token leakage.
  - `search.spec.ts`: Query string URL sync, debounced autocomplete suggestions, search result verification.
  - `workspace.spec.ts`: Sticky sidebar, video pitch modal controls, experience timeline ordering (with 400ms teleprompter silence auto-pause threshold).
  - `public-routes.spec.ts`: Help FAQs accordion, Blog slug navigation, Contact Us submission, 404 error boundary.
  - `play-button.spec.ts`: 54px pure CSS hover play button geometry & pseudo-element verification (`#ffffff` circle with 13px `#5bbbae` triangle).
  - `asset-integrity.spec.ts`: Zero broken images, literal logo resolution verification.
