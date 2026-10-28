# Belooga Engineering System (GEMINI.md)

Always-on project instruction for Gemini / Antigravity. Claude Code loads it via `CLAUDE.md`.

## 1. Verified Tech Stack (Ground Truth)
- **Frontend (Web):** Next.js 16.3.8, React 19 (App Router), Bun runtime, Tailwind CSS v4, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, Zustand.
- **Mobile App (`mobile/`):** Expo SDK 58.0.16 / React Native 0.88.0 (Expo Router), TypeScript, `@tanstack/react-query`, `zod`, Zustand, `expo-secure-store`, Android SDK 36 Clean-APK Pipeline (`mobile/scripts/build-apk.sh`) & ADB UIAutomator2 / Maestro E2E (`mobile/scripts/e2e-mobile-adb.sh`).
- **Edge & Distributed API Gateway:** Nginx 1.27 Reverse Proxy (`nginx/gateway.conf` on `:8080`, K8s `Ingress` in `k8s/deployment-and-hpa.yaml`) + Pure-ASGI Distributed Redis Gateway (`backend/app/core/gateway.py`) & ConnectRPC Batch Engine (`backend/app/core/rpc.py`).
- **Backend:** FastAPI, Python 3.12+, SQLAlchemy 2.0 Async (`asyncpg`), Alembic (`backend/alembic/`), Pydantic v2, ReportLab, AnyIO.
- **Database:** PostgreSQL 16 (See `CURRENT_STATE.md` §1; GIN `TSVECTOR`, `pg_trgm`), Redis 7.
- **QC:** Playwright (TypeScript/Bun) in `qc/` (`bun run test:e2e`), Pytest in `backend/tests/`.
- **Legacy Source:** In-repo `legacy/` (read-only reference). Set `$LEGACY_DIR` only if you also keep an upstream checkout elsewhere; when unset, `legacy/` is the reference.
- **Python venv paths:** commands write `backend/.venv/bin/<tool>` (Linux/macOS/CI). On Windows use `backend/.venv/Scripts/<tool>.exe`, or run `<venv python> -m pytest` / `-m alembic`, which works everywhere.

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
6. **No completion without proof or PR CI green:** Never claim a task or bug fix is done without completing `.agents/workflows/definition-of-done.md` (the single canonical DoD). Never push directly to `main`.

## 4. Supervisor Operating Discipline (Always-On)
- **Ultra-Short & Simplified Responses (<= 8 Lines):** Mọi câu trả lời hoặc clarify của AI phải cực ngắn gọn, đi thẳng vào trọng tâm (tối đa 5–8 dòng hoặc 3–5 gạch đầu dòng: *Root Cause -> Option A/B ngắn gọn -> Kết quả*). Không viết sớ dài dòng, không lặp lại code diff. Query `graphify` -> `CURRENT_STATE.md` -> `.agents/PRODUCT_THESIS.md` -> Domain `SKILL.md` -> Code before acting.
- **Ponytail Minimalism (always on):** Apply the `ponytail` ladder to every code change without asking (policy: `.agents/rules/ponytail.md`). If 200 lines can be written in 50 while keeping `router -> service -> repository` layering and type safety, do it. Never flatten layers in its name.
- **When to ask the user:** One policy for every agent and mode: `.agents/rules/anti-hallucination-harness.md` rule 6.
- **Stateful Working Memory:** For tasks touching >= 3 files or changing contracts, record hypothesis, risks, and `[ ] -> [x]` checklist in `.agents/STATE.md` (<= 50 lines).
- **5-Step Self-Learn & Knowledge Sync:** On any bug/correction or new feature, execute `belooga-self-learn` (Where -> How/Why -> Minimal Fix -> Script Guard -> Skill/Thesis Upgrade) and run `python3 scripts/render-skill-facts.py --write`.

## 5. Task Routing
- **Forensic Investigation & Plan (`/investigate`):** Skill `investigate` (read-only trace + Option A/B trade-off + writes `.agents/STATE.md` & halts).
- **Supervisor & Product Challenge:** Skill `belooga-supervisor` + `.agents/PRODUCT_THESIS.md`.
- **Backend API / Gateway / DB:** Skill `belooga-backend-engineering` (covers Edge `:8080` + `backend/app/core/gateway.py` + routes to `be-domain-*`), test with `backend/.venv/bin/pytest backend/tests/` (Windows: `backend/.venv/Scripts/pytest.exe backend/tests/`).
- **Frontend App Router / UI:** Skill `belooga-frontend-engineering` (routes to `fe-domain-*`), test with `cd frontend && bun x tsc --noEmit`.
- **E2E / Visual QC:** Skill `belooga-qc-engineering`, run `cd qc && bun run test:e2e`.
- **Agile Planning & PR Delivery:** Skill `belooga-senior-agile-workflow`, GitHub Issues + `Kanban Belooga` board via `gh`; dispatch a ticket with `python3 scripts/agent-dispatch.py <issue>`.
- **Quality Gate / PR / Before claiming done:** Workflow `.agents/workflows/definition-of-done.md` (canonical; every other DoD mention links here).
