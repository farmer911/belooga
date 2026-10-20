# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task:** Full-Stack Parity (Zero UI-Only Features), SEO + Lighthouse Optimization, and Backend/Edge API Gateway across 5 sequential PRs (`BEL-509` -> `BEL-513`):
  1. `BEL-509`: CMS Blog Full-Stack (`blog_posts` table + `GET /v1/blog/posts/`, `GET /v1/blog/posts/{slug}/` + FE wiring).
  2. `BEL-510`: CV Studio Persistence & Interactive Sidebar (`GET/PUT /v1/profile/{username}/cv-draft/` + server PDF export + toggleable sections).
  3. `BEL-511`: Executive Analytics `?range=7D|30D|ALL` + Real DB Order Ledger + Expert Review Feedback Scorecard viewer.
  4. `BEL-512`: Dynamic SEO (`sitemap.ts`, `robots.ts`, route `layout.tsx` metadata, JSON-LD) & Lighthouse CLS/LCP/A11y optimization.
  5. `BEL-513`: Backend API Gateway (`app/core/gateway.py` Rate-Limiting, `X-Request-ID`, Security Headers, `GET /v1/gateway/status`, Nginx Edge Gateway & Next.js `/api/v1` proxy).

## Pre-Mortem Risks
- **File Line Caps:** Keep all backend `.py` <= 300 lines and frontend `page.tsx` <= 241 lines (`cv-studio/page.tsx` is 211 lines; extract helpers/hooks).
- **Test Compatibility:** Rate-Limiter in `app/core/gateway.py` must allow high burst in `ENVIRONMENT=testing` unless explicitly tested via `X-Test-Rate-Limit` header.

## 5-PR Execution Checklist
- [x] **PR 1 (`BEL-509`):** Blog CMS Full-Stack (`blog_posts` table + `/v1/blog/posts/*` + `/blog` & `/blog/[slug]` FE integration)
- [x] **PR 2 (`BEL-510`):** CV Studio Cloud Draft Persistence (`GET/PUT /v1/profile/{username}/cv-draft/`) & Interactive Section Reordering
- [x] **PR 3 (`BEL-511`):** Analytics `?range=7D|30D|ALL` Dynamic Querying + Expert Review Feedback Scorecard Integration
- [x] **PR 4 (`BEL-512`):** SEO Engine (`sitemap.ts`, `robots.ts`, OpenGraph/JSON-LD, Route Metadata) & Lighthouse Optimization
- [ ] **PR 5 (`BEL-513`):** Backend API Gateway Middleware (`app/core/gateway.py`, `GET /v1/gateway/status`) + Nginx Edge Gateway & Next.js Proxy
