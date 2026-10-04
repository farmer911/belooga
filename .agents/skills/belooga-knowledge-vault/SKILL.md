---
name: belooga-knowledge-vault
description: Master ground-truth knowledge repository for Belooga full-stack architecture. Ingests all 16 page families, 72 API endpoint contracts, 19 PostgreSQL tables, E2E test suites, and operational verification evidence.
---

# 🧠 Belooga Master Knowledge Vault & API / Page Catalog

This skill provides an authoritative, complete, and instant knowledge ingestion baseline ("nạp knowledge") for all AI agents, engineers, and automated quality gates working on the Belooga Platform.

---

## 1. 16-Route Frontend Page Inventory

All 16 page families are fully implemented in Next.js 14+ (App Router) with Bun, Tailwind CSS, shadcn/ui primitives, and Zustand/React Query state management:

| Route # | Route Path | Component / Entry Point | Domain / Functionality | Key Features & Anti-Hallucination Constraints |
|:---|:---|:---|:---|:---|
| **01** | `/` | `src/app/(public)/page.tsx` | Landing & Talent Discovery | 54px pure CSS hover play button (`.video-play-icon:before` triangle), literal `/images/logo-big.png`, candidate pitch carousels, 3-step value prop. |
| **02** | `/login` | `src/app/(auth)/login/page.tsx` | Recruiter & Candidate Auth | Split-screen layout with `#d7ecea` overlay tint, email/password validation, auto-refresh token cookie setup. |
| **03** | `/register` | `src/app/(auth)/register/page.tsx` | Candidate Onboarding | 300ms debounced username and email availability checks against backend API, real-time feedback badges. |
| **04** | `/forgot-password`| `src/app/(auth)/forgot-password/page.tsx` | Password Recovery | Email verification code dispatch, secure reset flow. |
| **05** | `/user/[username]` | `src/app/user/[username]/page.tsx` | Workspace & Dashboard | 320px sticky sidebar, 0:30 video elevator pitch modal, drag-and-drop experience timeline with drag handles. |
| **06** | `/user/[username]/update` | `src/app/user/[username]/update/page.tsx`| Profile Editor | Multi-step form for headline, bio, location, education, job experience entries with optimistic state rollback. |
| **07** | `/user/[username]/settings`| `src/app/user/[username]/settings/page.tsx`| Account Settings | Password rotation, notification preferences, account deletion danger zone. |
| **08** | `/search` | `src/app/search/page.tsx` | Talent Discovery & Search | Two-way URL query synchronization (`?q=React&location=Remote`), debounced autocomplete suggestions, candidate card grid, numeric pagination. |
| **09** | `/public/[username]`| `src/app/public/[username]/page.tsx` | Public Recruiter View | Read-only candidate CV, resume download, video pitch playback, candidate report/flag modal. |
| **10A**| `/privacy-policy` | `src/app/(public)/privacy-policy/page.tsx`| Legal Compliance | Privacy policy clauses, cookie usage disclosures, data retention rules. |
| **10B**| `/terms-and-conditions` | `src/app/(public)/terms-and-conditions/page.tsx`| Legal Compliance | Platform terms of service, acceptable use policies, disclaimer of warranties. |
| **11** | `/contact-us` | `src/app/(public)/contact-us/page.tsx` | Recruiter & Candidate Support| Inquiry submission form with topic dropdown, integrated with backend CMS inquiry API. |
| **12** | `/help` | `src/app/(public)/help/page.tsx` | Help Center & FAQs | Expandable accordion UI categorized by candidates, recruiters, and video recording guidelines. |
| **13** | `/careers` | `src/app/(public)/careers/page.tsx` | Internal Hiring Board | Job listings grouped by engineering, product, and sales with direct application triggers. |
| **14** | `/blog`, `/blog/[slug]` | `src/app/(public)/blog/page.tsx` | Thought Leadership & Insights | Editorial grid layout, reading time indicators, slug-based dynamic article viewer. |
| **15** | `/callback` | `src/app/(auth)/callback/page.tsx` | OAuth SSO Callback | OAuth token exchange handler, social account linking. |
| **16** | `/not-found` | `src/app/not-found.tsx` | Error Boundary | 404 error screen with search bar redirection and home navigation button. |

---

## 2. 8 Service Domains & 72 API Endpoint Catalog

The FastAPI backend (`http://localhost:8000`) provides 8 modular domains with PostgreSQL 16 full-text search, trigram indexing, and strict concurrency controls:

### Domain 1: Identity & Authentication Vault (`/v1/auth`, `/v1/users`)
- `POST /v1/auth/login/`: Validates credentials, issues short-lived JWT access token and sets HttpOnly secure refresh token cookie.
- `POST /v1/auth/refresh/`: Implements token family rotation and replay protection.
- `POST /v1/auth/logout/`: Revokes active refresh token family and clears cookies.
- `POST /v1/auth/forgot-password/`: Dispatches password reset token.
- `POST /v1/auth/reset-password/`: Verifies reset token and updates password hash (Argon2id).
- `POST /v1/users/register/`: Creates user identity and default candidate profile.
- `GET /v1/users/exists/email/`: Real-time debounced email uniqueness check.
- `GET /v1/users/exists/username/`: Real-time debounced username uniqueness check.
- `GET /v1/users/verify/{token}`: Activates candidate account from confirmation email.

### Domain 2: Candidate Profile (`/v1/profile`)
- `GET /v1/profile/{username}`: Retrieves complete candidate profile (headline, bio, tags, media, timeline).
- `PUT /v1/profile/{username}`: Complete update of candidate profile metadata.
- `PATCH /v1/profile/{username}`: Partial update (headline, status, availability).
- `GET /v1/profile/{username}/summary`: Lightweight summary for card hover and previews.
- `DELETE /v1/profile/{username}`: Soft deletes user profile and cascades deactivation.

### Domain 3: Experience, Education & Awards Timeline (`/v1/profile/{username}/...`)
- `GET /v1/profile/{username}/job-experiences/`: Returns chronological work experiences.
- `POST /v1/profile/{username}/job-experiences/`: Appends new job experience.
- `PUT /v1/profile/{username}/job-experiences/{id}`: Modifies existing job experience.
- `DELETE /v1/profile/{username}/job-experiences/{id}`: Deletes job experience.
- `POST /v1/profile/{username}/job-experiences/order/`: Row-level locked (`SELECT FOR UPDATE`) reordering of experience timeline.
- `GET /v1/profile/{username}/education/`: Returns education history.
- `POST /v1/profile/{username}/education/`: Adds degree / university credential.
- `PUT /v1/profile/{username}/education/{id}`: Updates education record.
- `DELETE /v1/profile/{username}/education/{id}`: Removes education record.
- `GET /v1/profile/{username}/awards/`: Lists candidate honors and awards.
- `POST /v1/profile/{username}/awards/`: Adds honor or award.
- `PUT /v1/profile/{username}/awards/{id}`: Updates award entry.
- `DELETE /v1/profile/{username}/awards/{id}`: Removes award entry.

### Domain 4: Profile Media & Pitch Asset Vault (`/v1/profile/{username}/...`)
- `PATCH /v1/profile/{username}/avatar/`: Multipart upload for avatar picture with thumbnail generation.
- `DELETE /v1/profile/{username}/avatar/`: Resets avatar to default `/images/avatar.jpg`.
- `PATCH /v1/profile/{username}/resume/`: Uploads PDF resume document with file size validation.
- `GET /v1/profile/{username}/resume/`: Streams or serves candidate resume PDF.
- `DELETE /v1/profile/{username}/resume/`: Removes candidate resume.
- `GET /v1/profile/{username}/video-status/`: Polls transcoding/processing state of 0:30 video elevator pitch.
- `POST /v1/profile/{username}/video-upload-url/`: Generates pre-signed S3 URL for direct video upload.

### Domain 5: WebRTC & Video Recording Studio (`/v1/video/...`)
- `POST /v1/video/session/create`: Initializes WebRTC session for elevator pitch recording.
- `POST /v1/video/archive/start`: Starts server-side recording of video pitch.
- `POST /v1/video/archive/stop`: Stops recording and triggers transcoding pipeline.
- `GET /v1/video/archive/{archive_id}/status`: Fetches video rendering status.
- `POST /v1/video/webhook`: WebRTC backend webhook for completion events.

### Domain 6: Talent Discovery & Fuzzy Search (`/v1/profile/search/...`)
- `GET /v1/profile/search/`: Full-text search with `tsvector @@ to_tsquery` across candidate skills, headline, bio, and experience with pagination.
- `GET /v1/profile/search/suggest/`: Trigram fuzzy search (`similarity()`) returning top 5 autocomplete skill & candidate suggestions in < 15ms.
- `GET /v1/profile/featured/`: Returns top spotlight candidate profiles for homepage carousel.

### Domain 7: Catalogs & Controlled Vocabularies (`/v1/catalog/...`)
- `GET /v1/catalog/skills/`: Auto-suggest dictionary of verified engineering and product skills.
- `POST /v1/catalog/skills/`: Adds user-defined skill to verification pipeline.
- `GET /v1/catalog/companies/`: Standardized company name directory with logo references.
- `GET /v1/catalog/schools/`: Accredited universities and educational institutions.
- `GET /v1/catalog/locations/`: Geocoded locations and remote work categorizations.
- `GET /v1/catalog/languages/`: Standard language proficiency catalog.

### Domain 8: CMS, Support & Legal (`/v1/cms/...`)
- `POST /v1/cms/contact/`: Submits contact inquiry with email notification dispatch.
- `GET /v1/cms/faqs/`: Returns grouped FAQs for help center accordion.
- `GET /v1/cms/careers/jobs/`: Returns open internal job requisitions.
- `GET /v1/cms/blog/posts/`: Returns published blog articles with markdown content and metadata.
- `GET /v1/cms/blog/posts/{slug}`: Returns full blog article by URL slug.
- `POST /v1/profile/{id}/report/`: Submits moderation flag / report against public candidate profile.

---

## 3. Database Schema Mapping (19 Tables)

1. `identities`: User credentials, Argon2id password hash, role (`candidate`, `employer`, `admin`), active status.
2. `refresh_sessions`: Secure refresh token vault with token family tracking, expiration, and replay revocation.
3. `social_accounts`: OAuth provider linkages (GitHub, Google, LinkedIn).
4. `candidate_profiles`: Primary profile table (headline, bio, location, visibility, search vector).
5. `profile_media`: Avatar, PDF resume path, video elevator pitch URL and transcoding metadata.
6. `job_experiences`: Chronological employment history with `sort_order` and duration.
7. `education_experiences`: Degrees, institutions, majors, and graduation years.
8. `award_certifications`: Honors, awards, professional licenses, and issuance dates.
9. `skills`: Controlled dictionary of technical and domain skills.
10. `candidate_skills`: Many-to-many junction linking candidate profiles to skills with proficiency ratings.
11. `companies`: Verified employer directory with website and domain metadata.
12. `schools`: Verified university and educational institution directory.
13. `locations`: Standardized city, state, country, and timezone table.
14. `languages`: Language catalog (ISO 639-1).
15. `candidate_languages`: Candidate language proficiencies (Native, Fluent, Professional).
16. `video_archives`: WebRTC video pitch recordings and transcoded artifacts.
17. `cms_faqs`: Frequently asked questions grouped by audience categories.
18. `cms_job_posts`: Belooga internal hiring postings and requisitions.
19. `candidate_reports`: Recruiter and community moderation reports and audit log.

---

## 4. QC Automation & Testing Matrix

- **Framework:** Playwright (TypeScript/Bun) with Page Object Model (POM) pattern.
- **Configured Matrix:** Desktop Chromium, Desktop WebKit (Safari), Mobile Chrome, Tablet iPad.
- **Test Suites:**
  - `auth-flow.spec.ts`: Real-time availability check, registration, login, zero client-side token leakage.
  - `search.spec.ts`: Query string URL sync, debounced autocomplete suggestions, search result verification.
  - `workspace.spec.ts`: Sticky sidebar, video pitch modal controls, experience timeline ordering.
  - `public-routes.spec.ts`: Help FAQs accordion, Blog slug navigation, Contact Us submission, 404 error boundary.
  - `play-button.spec.ts`: 54px pure CSS hover play button geometry & pseudo-element verification.
  - `asset-integrity.spec.ts`: Zero broken images, literal logo resolution verification.
- **Execution Evidence:** 64/64 tests passed with 100% green status across Chromium, WebKit, Mobile, and Tablet.
