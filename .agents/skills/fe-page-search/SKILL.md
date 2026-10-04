---
name: fe-page-search
description: Authoritative Department Skill for the Talent Discovery & Candidate Search Page (/search). Covers full-text ts_rank querying, debounced autocomplete suggestions, filter controls, candidate grid, and pagination.
---

# 🔍 Department Skill: Talent Discovery & Candidate Search (`/search`)

> **Department:** Frontend Product Engineering — Search & Discovery Division  
> **Route:** `frontend/src/app/search/page.tsx`  
> **Type:** Public Talent Discovery Engine & Filter System  

---

## 1. Department Role & Mission

The Search Department enables recruiters, hiring managers, and visitors to discover top-tier candidate profiles through keyword matching, location filtering, and technical skill taxonomy.

### Component Hierarchy & Section Decomposition:
```
frontend/src/app/search/page.tsx (Page Shell & Suspense Boundary)
│
├── 1. SearchBarSection (`src/components/organisms/search/search-bar-section.tsx`)
│      └── Primary input, clear button, debounced autocomplete dropdown
│
├── 2. SearchFilterDrawer (`src/components/organisms/search/search-filter-drawer.tsx`)
│      └── Employment status, seeking status, location filter toggles
│
├── 3. CandidateResultsGrid (`src/components/organisms/search/candidate-results-grid.tsx`)
│      └── 3-column responsive card grid displaying video thumbnails, headlines, and badges
│
├── 4. SearchPagination (`src/components/molecules/search-pagination.tsx`)
│      └── Previous, Next, and numbered page controls synchronized with URL search params
│
└── 5. SearchEmptyState (`src/components/molecules/search-empty-state.tsx`)
       └── Helpful guidance and search reset action when zero results match
```

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-search` | `GET /v1/profile/search/?key={k}&page={p}&limit={l}` returning `{ results, total, page, total_pages }` |
| **Upstream (Depends on)** | `be-service-catalogs` | `GET /v1/profile/skills/`, `GET /v1/profile/company/` for autocomplete |
| **Downstream (Outputs to)** | `fe-page-public-profile` | Clicking any candidate card navigates to `/public/[username]` |
| **Downstream (Outputs to)** | `fe-page-home` | Accepts incoming keyword query params from home search launcher |

---

## 3. Debounced Autocomplete & Query Synchronization Protocol

1. **URL State Synchronization:**
   - Search query and active page number MUST be synchronized with browser URL query parameters: `/search?key=React&page=1`.
   - Ensures search results are shareable, bookmarkable, and preserve browser back/forward navigation history.
2. **Debounce Optimization:**
   - Autocomplete dropdown queries MUST be debounced by 250ms to prevent flooding backend PostgreSQL search vectors with transient keystrokes.

---

## 4. QC Selectors & Automated Test Assertions

Playwright test suite `qc/tests/e2e/search.spec.ts` verifies:
* `[data-testid="search-input"]`: Main search keyword input box.
* `[data-testid="search-submit-btn"]`: Search execution button.
* `[data-testid="candidate-card"]`: Individual candidate result cards.
* `[data-testid="candidate-card-name"]`: Heading with candidate full name.
* `[data-testid="candidate-card-headline"]`: Text showing candidate role.
* `[data-testid="search-pagination"]`: Pagination control container.
* `[data-testid="search-empty-state"]`: Empty state container when no candidates are found.

---

## 5. Post-Feature Self-Updating Protocol

Whenever a developer or agent modifies the Search experience:
1. Verify debounced behavior does not cause UI flickering.
2. Test both empty search (`/search`) and targeted query (`/search?key=alex`).
3. Ensure all card links point strictly to `/public/{username}`.
