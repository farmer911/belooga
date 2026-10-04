# Belooga Engineering System (GEMINI.md)

Always-on project instruction for Gemini / Antigravity agent.

## 1. Verified Tech Stack (Ground Truth)
- **Frontend:** Next.js 16.3.8, React 19 (App Router), Bun runtime, Tailwind CSS v4, Zustand.
- **Backend:** FastAPI, Python 3.12+, SQLAlchemy 2.0 Async (`asyncpg`), Pydantic v2, ReportLab, AnyIO.
- **Database:** PostgreSQL 16 (`initdb.sql` with 24 tables, GIN `TSVECTOR`, `pg_trgm`), Redis 7.
- **QC:** Playwright (TypeScript/Bun) in `qc/` (`bun run test:e2e`), Pytest in `backend/tests/`.
- **Legacy Source:** Located locally at `/Users/phucnguyen/Dev/Beloga-CV` (`../Beloga-CV`).

## 2. Precedence of Truth
1. `Running Source Code` (`backend/`, `frontend/`, `qc/`)
2. `CURRENT_STATE.md` (Dynamically generated SSOT)
3. `.agents/rules/` and `.agents/workflows/`
4. `.agents/skills/*/SKILL.md` (Domain knowledge)
5. `docs/adr/` (Architectural Decision Records)
6. `docs/archive/` (Historical only; never cite as active truth)

## 3. Top 5 Absolute Prohibitions
1. **Never edit `legacy/**`:** Files in `legacy/` are strictly READ-ONLY historical references.
2. **No fake success banners:** Never stub frontend buttons with fake success toasts without real backend endpoints and tests.
3. **No blocking calls in async event loop:** Never call `open()`, `doc.build()`, `shutil.rmtree()`, or `remove()` synchronously inside async functions; use `asyncio.to_thread`.
4. **No unindexed search fallbacks:** Never combine `search_vector @@` with `OR ILIKE` (violates ADR-005).
5. **No completion without proof:** Never claim a task or bug fix is done without running verified tests and providing command output (`No Proof = Not Done`).

## 4. Task Routing
- **Backend API / DB:** Skill `belooga-backend-services`, test with `backend/.venv/bin/pytest backend/tests/`.
- **Frontend App Router / UI:** Skill `belooga-frontend-engineering`, test with `cd frontend && bun x tsc --noEmit`.
- **E2E / Visual QC:** Skill `belooga-qc-engineering`, run `cd qc && bun run test:e2e`.
- **Quality Gate / PR:** Workflow `.agents/workflows/definition-of-done.md`.
