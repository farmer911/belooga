---
name: fe-page-search
description: Talent discovery and candidate search page (/search) in frontend/src/app/search/page.tsx. Use when modifying search filters, candidate result cards, pagination, or debounced autocomplete. Not for backend search ranking (be-service-search) or homepage search bar (fe-page-home).
---

# Talent Discovery & Search (`/search`)

## Current Reality (AS-IS)
- Unified search page in `frontend/src/app/search/page.tsx` (`"use client"`).
- Queries `GET /v1/profile/search/` with query params (`key`, `page`, `limit`).
- Autocomplete: queries `GET /v1/profile/search/suggest/` with 250ms debounce.
- URL synchronization: search queries and page numbers sync to URL query strings.

## Project-Specific Rules
- **State Synchronization:** Keep search keyword and page index synced with URL search params (`/search?key=...&page=...`) to ensure shareable URLs and browser history preservation.
- **Hidden Candidate Filtering:** Only candidates with `is_hidden = false` appear in search results and autocomplete dropdowns.
- **QC Selectors:**
  - `[data-testid="search-input"]`
  - `[data-testid="search-submit-btn"]`
  - `[data-testid="candidate-card"]`
  - `[data-testid="candidate-card-name"]`
  - `[data-testid="search-pagination"]`
  - `[data-testid="search-empty-state"]`

## Known Traps
- Search components are inlined in `page.tsx`. Do not import from non-existent `src/components/organisms/search/`.
- Ensure autocomplete suggestions close upon clicking outside or pressing Escape.

## Canonical Example
- `frontend/src/app/search/page.tsx`

## Self-Verification
- `cd frontend && bun x tsc --noEmit`
- `cd qc && bun run test:e2e`
