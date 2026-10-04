---
name: fe-page-home
description: Authoritative Department Skill for the Belooga Homepage (/). Covers the Hero showcase, Walkthrough video modal, Testimonials, CTA, and strict legacy visual assets.
---

# 🏠 Department Skill: Homepage & Candidate Showcase (`/`)

> **Department:** Frontend Product Engineering — Marketing & Showcase Division  
> **Route:** `frontend/src/app/page.tsx`  
> **Type:** Public Marketing Landing Page & Talent Showcase  

---

## 1. Department Role & Mission

The Homepage serves as the primary storefront and conversion engine for Belooga. It introduces the core value proposition: pairing conventional candidate profiles with authentic **30-second video elevator pitches**.

### Target Component Hierarchy & Section Decomposition:
> [!WARNING] TARGET REFACTORING PATTERN – CURRENTLY INLINED IN APP ROUTER PAGE SHELL
> The tree below represents the planned Atomic Design decomposition. In the current production codebase, the homepage sections are consolidated inside `frontend/src/app/page.tsx`.

```
frontend/src/app/page.tsx (Page Shell & Current Unified Implementation)
│
├── 1. HeroSection (`src/components/organisms/home/hero-section.tsx`)
│      └── Value proposition, background poster overlay, search quick-launcher
│
├── 2. WorkflowWalkthroughSection (`src/components/organisms/home/workflow-section.tsx`)
│      └── 3-step candidate walkthrough cards (Rileigh, Matt, Jazmin) with video triggers
│
├── 3. CandidateShowcaseSection (`src/components/organisms/home/candidate-showcase-section.tsx`)
│      └── Grid of verified candidates with hover play buttons and career tags
│
├── 4. TestimonialsSection (`src/components/organisms/home/testimonials-section.tsx`)
│      └── Recruiter quotes, enterprise logos, social proof metrics
│
├── 5. CtaSection (`src/components/organisms/home/cta-section.tsx`)
│      └── Candidate registration & Recruiter discovery conversion buttons
│
└── 6. WalkthroughModal (`src/components/organisms/home/walkthrough-modal.tsx`)
       └── Reusable modal video player displaying guided platform walkthroughs
```

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Downstream (Outputs to)** | `fe-page-search` | Quick search input redirects to `/search?key={keyword}` |
| **Downstream (Outputs to)** | `fe-page-public-profile` | Clicking candidate card navigates to `/public/[username]` |
| **Downstream (Outputs to)** | `fe-page-auth` | Hero and CTA triggers navigate to `/register` or `/login` |
| **Upstream (Depends on)** | `public/images/home/` | Strict literal legacy assets: `matt-poster.png`, `Rileigh-1.jpg`, `Jazmin-1.jpg`, `Ana.png`, `Inspire.png` |

---

## 3. Strict Visual Standards & Historical Pitfalls

### 🔒 Anti-Regression Rules (Learned from Past Incidents):
1. **The 54px Pure CSS Play Button (`VIOLATION-002`, `VIOLATION-003`, `VIOLATION-004`):**
   - The walkthrough video play button MUST be rendered using the pure CSS `:before` border trick (`.video-play-icon`).
   - The button is strictly `display: none` by default and reveals ONLY on card hover (`:hover .modal-start`).
   - **NEVER** assign `height`, `width`, or `background` to `.modal-trigger` in CSS. That bug turned the play button into a catastrophic 240px black ellipse.
2. **Literal Asset Provenance (`VIOLATION-001`):**
   - Use strictly literal image files from `/images/home/`. Never approximate logos or icons with synthetic SVG code.

---

## 4. QC Selectors & Automated Test Assertions

Playwright test suite `qc/tests/e2e/public-routes.spec.ts` verifies:
* `[data-testid="home-hero-headline"]`: Main value proposition headline.
* `[data-testid="home-search-input"]`: Quick search input in hero.
* `[data-testid="home-search-submit"]`: Hero search submit button.
* `[data-testid="walkthrough-card"]`: Step-by-step feature cards.
* `[data-testid="walkthrough-modal"]`: Dialog modal triggered when clicking play on walkthrough cards.
* `[data-testid="candidate-showcase-grid"]`: Verified talent discovery grid.

---

## 5. Post-Feature Self-Updating Protocol

Whenever a developer or agent modifies the Homepage:
1. If new sections or cards are added, append their specifications to Section 1.
2. Verify all image paths exist on disk: `ls -la frontend/public/images/home/`.
3. If an assertion fails, log the root cause in `VIOLATIONS_REGISTER.md` before resolving.
