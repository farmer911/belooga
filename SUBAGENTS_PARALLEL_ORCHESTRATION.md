# 🤖 Parallel 3-Sub-Agent Orchestration Blueprint
> **Project:** Belooga Modernization (CRA / Redux / Stack-Theme ➔ Next.js 14+ / FastAPI / Playwright)  
> **Architecture Pattern:** Decoupled Modular Monolith + Component-Driven Frontend + Playwright Automated Quality Gates  

---

## 1. Sub-Agent Roster & Operational Boundaries

```
                    ┌────────────────────────────────────────────────────────┐
                    │            ORCHESTRATOR COORDINATOR                    │
                    └───────┬───────────────────┬────────────────────┬───────┘
                            │                   │                    │
              ┌─────────────▼─────────┐ ┌───────▼─────────────┐ ┌────▼─────────────────┐
              │  SUB-AGENT 1          │ │  SUB-AGENT 2        │ │  SUB-AGENT 3         │
              │  Frontend Engineering │ │  Backend Architect  │ │  QC Automation Lead  │
              ├───────────────────────┤ ├─────────────────────┤ ├──────────────────────┤
              │ Tech: Next.js 14, Bun,│ │ Tech: Python 3.12+, │ │ Tech: Playwright,    │
              │ Tailwind, shadcn/ui,  │ │ FastAPI, PostgreSQL │ │ TypeScript, Bun,     │
              │ Zustand, React Query  │ │ 16, SQLAlchemy 2.0  │ │ Chromium, Firefox,   │
              │ Dir: /frontend        │ │ Dir: /backend       │ │ WebKit; Dir: /qc     │
              │ Plan: PLAN_FRONTEND.md│ │ Plan: PLAN_BACKEND.md│ │ Plan: PLAN_QC.md     │
              └───────────────────────┘ └─────────────────────┘ └──────────────────────┘
```

---

## 2. Sub-Agent Profiles & Execution Briefs

### 🅰️ Sub-Agent 1: Frontend Engineering Specialist
- **Mission:** Implement all 16 page families, layout shell, common UI primitives, and type-safe data fetching.
- **Working Directory:** [`/frontend/`](file:///Users/phucnguyen/Dev/Beloga/frontend)
- **Execution Checklist:** [`PLAN_FRONTEND.md`](file:///Users/phucnguyen/Dev/Beloga/PLAN_FRONTEND.md)
- **Ground-Truth Knowledge Base:** [`belooga-frontend-engineering`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/belooga-frontend-engineering/SKILL.md) & [`legacy-ground-truth-enforcement`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/legacy-ground-truth-enforcement/SKILL.md)
- **Strict Anti-Hallucination Directives:**
  1. Only import literal assets from `/images/` (e.g., `/images/logo-big.png`, `/images/avatar.jpg`).
  2. Implement the 54px pure CSS play button (`:before` border trick) that reveals strictly on card `:hover`.
  3. Zero dimension pollution on `.modal-trigger` or generic interactive classes.
  4. Auth token stored strictly in memory (Zustand) with HttpOnly cookie credentials.

---

### 🅱️ Sub-Agent 2: Backend Architecture & Services Specialist
- **Mission:** Deliver the async FastAPI application with all 19 PostgreSQL tables and 72 endpoints across 8 service domains.
- **Working Directory:** [`/backend/`](file:///Users/phucnguyen/Dev/Beloga/backend)
- **Execution Checklist:** [`PLAN_BACKEND.md`](file:///Users/phucnguyen/Dev/Beloga/PLAN_BACKEND.md)
- **Ground-Truth Knowledge Base:** [`belooga-backend-engineering`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/belooga-backend-engineering/SKILL.md)
- **Strict Architectural Directives:**
  1. Initialize database via `backend/initdb.sql` and run async migrations with Alembic.
  2. Enforce pessimistic locking (`SELECT ... FOR UPDATE`) inside transactions for all timeline reordering operations.
  3. Refresh token rotation must use token family replay detection (revoking family if a reused token is detected).
  4. Full-text search must query generated TSVECTOR column with `ts_rank` and Trigram index for autocomplete.

---

### 🅲️ Sub-Agent 3: QC Automation & Visual Regression Specialist
- **Mission:** Act as the uncompromising quality gatekeeper. Execute Playwright tests across multi-browsers (Chromium, Firefox, WebKit) and multi-viewports (Desktop, Tablet, Mobile).
- **Working Directory:** [`/qc/`](file:///Users/phucnguyen/Dev/Beloga/qc)
- **Execution Checklist:** [`PLAN_QC.md`](file:///Users/phucnguyen/Dev/Beloga/PLAN_QC.md)
- **Ground-Truth Knowledge Base:** [`belooga-qc-engineering`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/belooga-qc-engineering/SKILL.md) & [`VIOLATIONS_REGISTER.md`](file:///Users/phucnguyen/Dev/Beloga/VIOLATIONS_REGISTER.md)
- **Strict Quality Directives:**
  1. TC-VIS-001: Assert 54px play button geometry and hover reveal.
  2. TC-VIS-002: Assert zero broken images across all 16 routes.
  3. TC-AUTH-002: Assert zero auth token leakage in `localStorage` or `sessionStorage`.
  4. TC-WORK-003: Assert drag-and-drop reordering dispatches network batch mutation.

---

## 3. Parallel Execution Matrix (Milestones M1 – M5)

```
Time ──►
Phase        Frontend Sub-Agent            Backend Sub-Agent           QC Sub-Agent
─────────────────────────────────────────────────────────────────────────────────────────────
M1           • Next.js App initialized     • Docker Compose & Postgres • Playwright test harness
             • Belooga tokens in CSS       • 19 tables initialized     • BasePage POM created
             • Header & Footer layout      • Health check /health      • Build & typecheck pass
─────────────────────────────────────────────────────────────────────────────────────────────
M2           • Public Marketing Pages      • Domain 1: Auth APIs       • TC-VIS-001 (Play button)
             • Login & Register forms      • Argon2id + Token Family   • TC-VIS-002 (Logo & images)
             • Zod form validation         • HttpOnly refresh cookie   • TC-AUTH-001 availability
─────────────────────────────────────────────────────────────────────────────────────────────
M3           • Candidate Workspace (/user) • Domain 2: Profile CRUD    • TC-WORK-001 (320px sidebar)
             • 0:30 Video Pitch Player     • Domain 3: Timeline & Lock • TC-WORK-002 (Video modal)
             • Experience timeline cards   • Domain 4: Media S3 upload • TC-WORK-003 (Reorder check)
─────────────────────────────────────────────────────────────────────────────────────────────
M4           • Candidate Search & Grid     • Domain 6: TSVECTOR Search • TC-SRCH-001 (URL sync)
             • Autocomplete dropdown       • Trigram suggest top 5     • TC-SRCH-002 (Debounce 300ms)
             • Numeric pagination controls • Catalog taxonomies APIs   • Multi-browser matrix
─────────────────────────────────────────────────────────────────────────────────────────────
M5           • Public CV (/public/:user)   • Domain 5: WebRTC Studio   • Full visual regression
             • PDF export trigger          • Domain 8: CMS & Support   • Zero regression report
             • Polish 16 routes            • Full OpenAPI v3 at /docs  • 100% green test suite
```

---

## 4. Immediate Commands to Run

### Frontend:
```bash
cd frontend && bun dev
# Running on http://localhost:3000
```

### Backend:
```bash
docker compose up -d
# Running on http://localhost:8000 (OpenAPI docs at http://localhost:8000/docs)
```

### QC / Playwright:
```bash
cd qc && bun test
# Or with visual UI dashboard:
cd qc && bunx playwright test --ui
```
