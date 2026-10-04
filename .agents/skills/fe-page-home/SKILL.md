---
name: fe-page-home
description: Homepage and candidate showcase in frontend/src/app/page.tsx. Use when modifying hero section, walkthrough video modals, candidate cards, or CTA conversion banners. Not for talent search (fe-page-search) or candidate workspace (fe-page-workspace).
---

# Homepage & Candidate Showcase (`/`)

## Current Reality (AS-IS)
- Unified Next.js page in `frontend/src/app/page.tsx`.
- Contains Hero showcase, 3-step walkthrough cards with video modals, candidate showcase grid, testimonials, and CTA banners.
- Assets: Literal images stored in `frontend/public/images/home/` (`matt-poster.png`, `Rileigh-1.jpg`, `Jazmin-1.jpg`, `Ana.png`, `Inspire.png`).

## Project-Specific Rules
- **54px Pure CSS Play Button:**
  - Rendered using `.video-play-icon:before` triangle trick.
  - Hidden by default (`display: none`), reveals only on card hover (`:hover .modal-start`).
  - Triangle fill color must strictly match legacy `#9b9b9b`.
- **QC Selectors:**
  - `[data-testid="home-hero-headline"]`
  - `[data-testid="home-search-input"]`
  - `[data-testid="home-search-submit"]`
  - `[data-testid="walkthrough-card"]`
  - `[data-testid="walkthrough-modal"]`
  - `[data-testid="candidate-showcase-grid"]`

## Known Traps
- **CSS Pollution (VIOLATION-004):** NEVER assign dimensions (`height`, `width`) or `background` to generic modal classes like `.modal-trigger` or `.modal-start`. Use Tailwind utility classes scoped to the element.
- Do not synthesize inline SVGs for logos; always reference `public/images/home/` directly.

## Canonical Example
- `frontend/src/app/page.tsx:WalkthroughModal`

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
