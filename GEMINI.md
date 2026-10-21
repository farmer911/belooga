# Belooga Engineering System (GEMINI.md)

Always-on project instruction for Gemini / Antigravity agent.

## 1. Verified Tech Stack (Ground Truth)
- **Frontend:** Next.js 16.3.8, React 19 (App Router), Bun runtime, Tailwind CSS v4, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, Zustand.
- **Backend:** FastAPI, Python 3.12+, SQLAlchemy 2.0 Async (`asyncpg`), Alembic (`backend/alembic/`), Pydantic v2, ReportLab, AnyIO.
- **Database:** PostgreSQL 16 (See `CURRENT_STATE.md` §1; GIN `TSVECTOR`, `pg_trgm`), Redis 7.
- **QC:** Playwright (TypeScript/Bun) in `qc/` (`bun run test:e2e`), Pytest in `backend/tests/`.
- **Legacy Source:** Located locally at `$LEGACY_DIR` (default: `../Beloga-CV`).

## 2. Precedence of Truth
1. `Running Source Code` (`backend/`, `frontend/`, `qc/`)
2. `CURRENT_STATE.md` (Dynamically generated SSOT)
3. `.agents/PRODUCT_THESIS.md` (Capped <= 120 lines) & `.agents/STATE.md` (Active scratchpad <= 50 lines)
4. `.agents/rules/` and `.agents/workflows/`
5. `.agents/skills/*/SKILL.md` (Domain knowledge)
6. `docs/adr/` (Architectural Decision Records)

## 3. Top 6 Absolute Prohibitions
1. **Never edit `legacy/**`:** Files in `legacy/` are strictly READ-ONLY historical references.
2. **No sycophancy ("Yes-Man"):** Follow `belooga-supervisor`. Never flatter user ideas; challenge contradictions, bloat, or weak business ROI immediately with repo evidence.
3. **No fake success banners, band-aid code, or `useEffect` API calls:** Never stub UI toasts, swallow exceptions (`except: pass`), bypass `router -> service -> repository` layers, call `apiClient` inside `useEffect` (must use `@tanstack/react-query`), or skip tests (`test.skip()`).
4. **No blocking calls in async event loop:** Never call `open()`, `doc.build()`, `shutil.rmtree()`, or `remove()` synchronously inside async functions across `backend/app/`; use `asyncio.to_thread`.
5. **No unindexed search fallbacks:** Never combine `search_vector @@` with `OR ILIKE` (violates ADR-005).
6. **No completion without proof or PR CI green:** Never claim a task or bug fix is done without running `python3 scripts/trust-benchmark.py`, verified tests, and pushing via a feature branch PR (`gh pr create` -> `gh pr checks --watch` green). Never push directly to `main`.

## 4. Supervisor Operating Discipline (Always-On)
- **Ultra-Short & Simplified Responses (<= 8 Lines):** Mọi câu trả lời hoặc clarify của AI phải cực ngắn gọn, đi thẳng vào trọng tâm (tối đa 5–8 dòng hoặc 3–5 gạch đầu dòng: *Root Cause -> Option A/B ngắn gọn -> Kết quả*). Không viết sớ dài dòng, không lặp lại code diff. Query `graphify` -> `CURRENT_STATE.md` -> `.agents/PRODUCT_THESIS.md` -> Domain `SKILL.md` -> Code before acting.
- **Default Ponytail Compression:** Apply `ponytail` automatically without asking permission. If 200 lines can be written in 50 lines while keeping clean layering and type safety, refactor immediately. Only ask the user when business requirements are ambiguous.
- **Stateful Working Memory:** For tasks touching >= 3 files or changing contracts, record hypothesis, risks, and `[ ] -> [x]` checklist in `.agents/STATE.md` (<= 50 lines).
- **5-Step Self-Learn & Knowledge Sync:** On any bug/correction or new feature, execute `belooga-self-learn` (Where -> How/Why -> Minimal Fix -> Script Guard -> Skill/Thesis Upgrade) and run `python3 scripts/render-skill-facts.py --write`.

## 5. Task Routing
- **Forensic Investigation & Plan (`/investigate`):** Skill `investigate` (read-only trace + Option A/B trade-off + writes `.agents/STATE.md` & halts).
- **Supervisor & Product Challenge:** Skill `belooga-supervisor` + `.agents/PRODUCT_THESIS.md`.
- **Backend API / DB:** Skill `belooga-backend-engineering` (routes to `be-domain-*`), test with `backend/.venv/bin/pytest backend/tests/`.
- **Frontend App Router / UI:** Skill `belooga-frontend-engineering` (routes to `fe-domain-*`), test with `cd frontend && bun x tsc --noEmit`.
- **E2E / Visual QC:** Skill `belooga-qc-engineering`, run `cd qc && bun run test:e2e`.
- **Agile Planning & PR Delivery:** Skill `belooga-senior-agile-workflow`, task breakdown with standalone engine at `../beloga-agent-kanban` (CLI: `bun run agent`).
- **Quality Gate / PR:** Workflow `.agents/workflows/definition-of-done.md` (Always branch -> `git push -u origin <branch>` -> `gh pr create` -> `gh pr checks --watch` -> `gh pr merge --squash --delete-branch`).
- **Before claiming done:** Always run `python3 scripts/lint-skills.py --quiet && python3 scripts/trust-benchmark.py` and verify remote PR checks pass (`gh pr checks --watch`).
