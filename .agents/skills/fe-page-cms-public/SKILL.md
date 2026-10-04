---
name: fe-page-cms-public
description: Public Content and CMS Pages (Blog, Careers, Contact Us, Help FAQs, Legal) in frontend/src/app/(public)/. Use when modifying static content, contact inquiry forms, FAQ accordions, or legal policy terms. Not for candidate workspace (fe-page-workspace).
---

# Public Content, CMS & Compliance (`/(public)/...`)

## Current Reality (AS-IS)
- Public routes located in `frontend/src/app/(public)/`:
  - `blog/`: Article listings and slug detail pages.
  - `careers/`: Internal job vacancies and application modal (mock).
  - `contact-us/`: Visitor inquiry form posting to `POST /v1/contact/`.
  - `help/`: FAQ accordion fetching `GET /v1/faqs`.
  - `privacy-policy/`, `terms-and-conditions/`: Legal disclosure documents.

## Project-Specific Rules
- **Public Accessibility:** All pages in this group must remain accessible to anonymous visitors without triggering authentication redirects.
- **QC Selectors:**
  - `[data-testid="contact-form"]`
  - `[data-testid="contact-submit-btn"]`
  - `[data-testid="careers-openings-list"]`
  - `[data-testid="help-faq-accordion"]`
  - `[data-testid="legal-content-container"]`

## Known Traps
- Career applications modal does not have a backend persistence endpoint yet (`career_applications` is a stub in current release). Do not fake backend success.

## Canonical Example
- `frontend/src/app/(public)/contact-us/page.tsx`

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
