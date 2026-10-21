# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (BEL-137 — Distributed Edge API Gateway, Redis State & K8s Ingress):**
  1. Upgrade `backend/app/core/gateway.py` (`APIGatewayMiddleware` & `/v1/gateway/status`) from process-local `OrderedDict` state to Distributed Redis-backed Rate-Limiting & Idempotency-Key replay (`gw:rl:*`, `gw:idem:*`) with automatic L1 LRU fallback.
  2. Activate Edge Gateway (`nginx/gateway.conf` + `docker-compose.yml` `belooga-gateway` on `:8080`), wire Web (`frontend/`) & Mobile (`mobile/`) clients + `.env.example` to route via `:8080`, and add Kubernetes `Ingress` in `k8s/deployment-and-hpa.yaml`.
  3. Add TDD tests in `backend/tests/test_gateway_and_cache_optimization.py` proving cross-worker distributed Redis rate-limiting, cross-worker `Idempotency-Key` replay, K8s `Ingress` manifest, and live Nginx `:8080` proxy routing.

## Pre-Mortem Risks
- Keep `backend/app/core/gateway.py` <= 300 lines (`be_files_over_300_lines = 0`) using Ponytail compression.
- Ensure GitHub Actions CI (`.github/workflows/ci.yml`) runs gateway listener on `:8080` alongside `:8000` so Playwright E2E passes seamlessly in CI.
- Set `client_max_body_size 15m;` and `limit_req_status 429;` in `nginx/gateway.conf` so 1MB+ video chunks / PDF uploads are not blocked by Nginx's default 1MB limit.

## Execution Checklist
- [x] **Phase 1 (TDD RED):** Add failing tests in `backend/tests/test_gateway_and_cache_optimization.py` for distributed Redis rate-limiting, cross-worker idempotency replay, and K8s Ingress / Edge routing
- [x] **Phase 2 (TDD GREEN Backend & Edge Infra):** Implement Redis-backed distributed state in `backend/app/core/gateway.py`, update `nginx/gateway.conf`, `docker-compose.yml`, `k8s/deployment-and-hpa.yaml`, and start `belooga-gateway`
- [x] **Phase 3 (Client Wiring & CI):** Point `frontend/`, `mobile/`, `.env.example`, and `.github/workflows/ci.yml` to `:8080` gateway
- [x] **Phase 4 (SSOT Sync & PR):** Run `generate-current-state.py`, `render-skill-facts.py`, `trust-benchmark.py`, `audit-truth.sh`, and merge PR
