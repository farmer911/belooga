# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (BEL-138 — Full Service, Workflow, Skill, README & E2E Gateway Alignment):**
  1. Update Backend services (`profile/service.py`, `media/service.py`, `analytics/service.py`, `services/media_transcoder.py`) to emit Gateway URLs (`PUBLIC_API_URL=http://localhost:8080`) instead of hardcoded `:8000`.
  2. Synchronize Skills, Rules, Workflows (`GEMINI.md`, `.agents/ROUTER.md`, `.agents/rules/backend.md`, `belooga-backend-engineering`, `belooga-frontend-engineering`, `belooga-qc-engineering`, `render-skill-facts.py`) and `README.md` with the `:8080` Edge + Distributed Redis API Gateway architecture.
  3. Migrate all Playwright E2E API calls (`qc/tests/e2e/workspace.spec.ts`, `expert-review.spec.ts`) and Frontend BI snippets (`use-analytics-dashboard.ts`) from `:8000` to `:8080` and verify live E2E execution.

## Pre-Mortem Risks
- Register `PUBLIC_API_URL` in `.env.example` so `scripts/trust-benchmark.py` passes with 100% score.
- Keep all `backend/app/` files <= 300 lines (`be_files_over_300_lines = 0`) and all `SKILL.md` files <= 200 lines (`scripts/lint-skills.py`).
- Ensure `nginx/gateway.conf` proxies `/redoc` in addition to `/docs` and `/openapi.json`.

## Execution Checklist
- [x] **Phase 1 (TDD RED):** Add failing test in `backend/tests/test_gateway_and_cache_optimization.py` checking service URLs, E2E specs, and README gateway alignment
- [x] **Phase 2 (TDD GREEN Services & E2E):** Update backend services, `use-analytics-dashboard.ts`, `qc/tests/e2e/*.spec.ts`, and `nginx/gateway.conf` to `:8080`
- [x] **Phase 3 (Skills, Workflows & README):** Update `GEMINI.md`, `README.md`, `.agents/ROUTER.md`, `.agents/rules/backend.md`, and `.agents/skills/*`
- [x] **Phase 4 (Verification & PR):** Run `pytest`, Playwright E2E, `audit-truth.sh`, `trust-benchmark.py`, and merge PR
