# 🚀 Belooga Frontend Sub-Agent Execution Plan
> **Target:** Convert Legacy CRA/Redux/Stack-Theme to Next.js 14+ (App Router)  
> **Tech Stack:** Next.js 14+, Bun 1.4+, Tailwind CSS v3.4+, shadcn/ui, TanStack Query v5, Zustand, Zod  
> **Authority Skill:** [`belooga-frontend-engineering`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/belooga-frontend-engineering/SKILL.md) & [`legacy-ground-truth-enforcement`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/legacy-ground-truth-enforcement/SKILL.md)

---

## 1. Sub-Agent Mission & Anti-Hallucination Boundaries
- **Mission:** Build the modern Next.js client covering all 16 route families with 100% visual parity, accessible component architecture, and type-safe data fetching.
- **Strict Anti-Hallucination Mandates:**
  - **Asset Ground-Truth:** All logos, icons, and avatars must come from verified literal files in `/images/`. Never hand-draw approximate SVG logos or use generic icon replacements.
  - **Play Button Geometry:** Exactly 54px circle (`#ffffff`) with pure CSS triangle (`:before` border trick).
  - **Hover Discipline:** Video play overlay (`.modal-start`) must default to `display: none` and reveal ONLY on card `:hover`.
  - **Zero Dimension Pollution:** Never inject width/height/background into generic interactive classes like `.modal-trigger`.

---

## 2. Parallel Synchronization Milestones
| Milestone | Frontend Focus | Backend Dependency | QC Validation Gate |
|---|---|---|---|
| **M1: Foundation** | Next.js setup, tokens, common UI components | Docker & DB initialization | Test runner setup & baseline checks |
| **M2: Auth & Marketing** | Public pages, Header/Footer, Login/Register forms | Domain 1 (Auth & Session APIs) | TC-VIS-001..004, TC-AUTH-001..002 |
| **M3: Workspace Core** | Candidate profile, 0:30 video player, timeline | Domain 2, 3, 4 (Profile, Media, Timeline) | TC-WORK-001..004 |
| **M4: Search & Discovery** | Candidate search, autocomplete dropdown, pagination | Domain 6 (Talent Search & Suggest) | TC-SRCH-001..003 |
| **M5: Full Regression** | Final route polish, PDF export, error boundaries | Domain 7 & 8 (Catalogs, CMS, Legal) | TC-PUB-001..002, Full E2E Run |

---

## 3. Phase-by-Phase Implementation Checklist

### Phase 1: Foundation, Asset Pipeline & Design Tokens
- [ ] Initialize Next.js 14+ project in `frontend/` using Bun:
  ```bash
  bun create next-app frontend --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --use-bun
  ```
- [ ] Ingest literal assets: Copy all files from `/images/` into `frontend/public/images/`.
- [ ] Configure `frontend/tailwind.config.ts` with exact Belooga color tokens (`brand.primary: #5bbbae`, `brand.hover: #497d76`, etc.).
- [ ] Configure `src/app/globals.css` with legacy fallback CSS variables and typography styles.
- [ ] Install dependencies with Bun:
  ```bash
  bun add @tanstack/react-query zustand axios react-hook-form @hookform/resolvers zod lucide-react clsx tailwind-merge
  bun add -d tailwindcss-animate
  ```

### Phase 2: Common UI Primitives (`src/components/ui/`)
- [ ] **Button Component (`src/components/ui/button.tsx`)**:
  - [ ] Implement variants: `default` (Seafoam teal #5bbbae), `secondary` (Blue #39a0e8), `outline`, `ghost`, `destructive`.
  - [ ] Implement sizes: `sm`, `default`, `lg`, `icon`.
- [ ] **Input Component (`src/components/ui/input.tsx`)**:
  - [ ] Support icon prefix/suffix slots (search icon, password reveal eye).
- [ ] **Modal / Dialog Component (`src/components/ui/dialog.tsx`)**:
  - [ ] Backdrop blur, accessible keyboard dismissal (`Escape`), smooth scale transition.
- [ ] **Card Component (`src/components/ui/card.tsx`)**:
  - [ ] Clean white card surface with border `#d1d6da` and subtle shadow.
- [ ] **Badge Component (`src/components/ui/badge.tsx`)**:
  - [ ] Status pills (Active, Seeking, Verified, Draft).
- [ ] **Avatar Component (`src/components/ui/avatar.tsx`)**:
  - [ ] Circular container with fallback to `/images/avatar.jpg`.
- [ ] **Toast Notification Provider (`src/components/ui/toast.tsx`)**.

### Phase 3: Services & State Architecture
- [ ] Build API Client (`src/services/api-client.ts`):
  - [ ] Axios instance with `baseURL` and `withCredentials: true`.
  - [ ] Request interceptor: Inject Bearer JWT from `auth-store`.
  - [ ] Response interceptor: Handle 401 automatic refresh rotation via `/v1/auth/refresh/`.
- [ ] Setup Zustand Stores (`src/store/`):
  - [ ] `auth-store.ts`: JWT token, user info, login/logout actions.
  - [ ] `draft-profile-store.ts`: Storing unsaved profile mutations.
  - [ ] `video-modal-store.ts`: Video playback URL and modal open state.
- [ ] Setup TanStack Query Provider (`src/components/providers/query-provider.tsx`).

### Phase 4: Application Shell (Header & Footer)
- [ ] **Header Component (`src/components/layout/Header.tsx`)**:
  - [ ] Exact brand logo: `/images/logo-big.png` (height: 38px) linking to `/`.
  - [ ] Unauthenticated State: "Login" link (`/login`), "Register" button (`/register`).
  - [ ] Authenticated State: User avatar chip + Dropdown ("My Profile", "Settings", "Public CV", "Logout").
  - [ ] Responsive mobile drawer menu.
- [ ] **Footer Component (`src/components/layout/Footer.tsx`)**:
  - [ ] Company description, copyright notice, social links.
  - [ ] Navigation columns: About, Careers, Blog, Help Center, Contact Us.
  - [ ] Legal links: Privacy Policy, Terms & Conditions.

### Phase 5: Public & Marketing Routes (Batch 1)
- [ ] **Route 01: Home (`src/app/(public)/page.tsx`)**:
  - [ ] Hero headline & CTA buttons ("Find Talent", "Create Profile").
  - [ ] Video walkthrough cards (Ava & Inspire) with modal popup.
  - [ ] Candidate pitch cards (Jazmin, Jeremy, Rileigh) with verified `:hover` play button overlay.
  - [ ] 4-step hiring process layout.
- [ ] **Route 14: Blog (`src/app/(public)/blog/page.tsx`, `[slug]/page.tsx`)**:
  - [ ] Hero editorial banner (`/images/blog/banner-blog.png`).
  - [ ] 3-column article card grid (`/images/blog/blog-1.jpg`).
- [ ] **Route 13: Careers (`src/app/(public)/careers/page.tsx`)**:
  - [ ] Open positions cards with department badges and application modal.
- [ ] **Route 12: Help Center (`src/app/(public)/help/page.tsx`)**:
  - [ ] Topic category cards & accordion FAQ list.
- [ ] **Route 11: Contact Us (`src/app/(public)/contact-us/page.tsx`)**:
  - [ ] Inquiry form inside boxed container with feedback banner.
- [ ] **Route 10: Legal Pages** (`/privacy-policy`, `/terms-and-conditions`).

### Phase 6: Authentication & Onboarding Routes (Batch 2)
- [ ] **Route 02: Login (`src/app/(auth)/login/page.tsx`)**:
  - [ ] Split-screen visual layout with `#d7ecea` overlay tint.
  - [ ] Social OAuth buttons (Facebook, Google, LinkedIn).
  - [ ] Login form with Zod validation and HttpOnly cookie exchange.
- [ ] **Route 03: Register (`src/app/(auth)/register/page.tsx`)**:
  - [ ] Debounced (300ms) username & email availability check.
  - [ ] First/Last Name, Password, Terms consent checkbox.
- [ ] **Route 04: Forgot Password (`src/app/(auth)/forgot-password/page.tsx`)**:
  - [ ] Recovery email form & confirmation state.
- [ ] **Route 15: OAuth Handshake (`src/app/(auth)/callback/page.tsx`)**.

### Phase 7: Candidate Workspace Core (Batch 3)
- [ ] **Route 05: Workspace Profile (`src/app/user/[username]/page.tsx`)**:
  - [ ] 320px Sticky Left Sidebar: Avatar, Full Name, Headline, Contact, Skills tags, Languages, Interests.
  - [ ] 0:30 Video Pitch Player: Custom video container with poster image, duration badge (`0:30`), and upload modal trigger.
  - [ ] Experience Timeline: Chronological cards with company logo and drag-and-drop handles.
  - [ ] Education History: Chronological cards with school logo, degree, GPA.
  - [ ] Certifications & Awards: Chronological accreditation cards.
  - [ ] PDF Resume Attachment Card with download trigger.
- [ ] **Route 06: Profile Editor (`src/app/user/[username]/update/page.tsx`)**:
  - [ ] Avatar file picker with instant preview.
  - [ ] Personal info form (First/Last name, Headline, Location, Bio markdown).
  - [ ] Autocomplete selectors for School, Company, Location.
- [ ] **Route 07: Account Settings (`src/app/user/[username]/settings/page.tsx`)**:
  - [ ] Email update form.
  - [ ] Password rotation form (Old, New, Confirm).
  - [ ] Danger Zone: Delete account modal.
- [ ] **Route 09: Public Candidate View (`src/app/public/[username]/page.tsx`)**:
  - [ ] Recruiter-facing read-only Web CV.
  - [ ] Action buttons: "Export PDF Resume", "Report User".

### Phase 8: Talent Discovery & Search (Batch 4)
- [ ] **Route 08: Candidate Search (`src/app/search/page.tsx`)**:
  - [ ] Search input with instant query string sync in URL (`/search?key=...&page=...`).
  - [ ] Autocomplete suggestion dropdown (top 5 results).
  - [ ] Candidate card grid with "0:30 Pitch" badge & avatar.
  - [ ] Numeric pagination controls (`« 1 2 3 »`).
- [ ] **Route 16: Not Found (`src/app/not-found.tsx`)**:
  - [ ] Branded dark error boundary (`#1e293b`).

---

## 4. Definition of Done (DoD)
- [ ] All 16 routes render cleanly with zero TypeScript errors (`bun run build`).
- [ ] Verified against static HTML mockups with pixel parity.
- [ ] Video card play button strictly matches 54px CSS circle and reveals only on hover.
- [ ] All forms validated with Zod schemas matching backend API contracts.
- [ ] Zero auth tokens stored in `localStorage` (HttpOnly cookies + memory store only).
