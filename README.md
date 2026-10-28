# Belooga Platform

[![Belooga SSOT & Integrity CI](https://github.com/farmer911/belooga/actions/workflows/ci.yml/badge.svg)](https://github.com/farmer911/belooga/actions/workflows/ci.yml)
[![Belooga AI Code Reviewer](https://github.com/farmer911/belooga/actions/workflows/ai-code-review.yml/badge.svg)](https://github.com/farmer911/belooga/actions/workflows/ai-code-review.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Belooga** is a high-performance, video-first talent discovery, ATS diagnostics, and career acceleration platform. Candidates showcase recorded video elevator pitches, dynamic career timelines, ATS-audited resumes, and verified skills, while recruiters discover talent via full-text search and AI-assisted matching.

---

## 1. Verified Tech Stack (Ground Truth)

All contributors and AI agents must strictly adhere to the verified runtime stack (see [CURRENT_STATE.md](CURRENT_STATE.md) for live table, endpoint, and route inventories):

- **Frontend (Web):** Next.js 16.3.8, React 19 (App Router), Bun runtime, Tailwind CSS v4, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, Zustand.
- **Mobile App (`mobile/`):** Expo SDK 58.0.16 / React Native 0.88.0 (Expo Router), TypeScript, `@tanstack/react-query`, `zod`, Zustand, `expo-secure-store`, Android SDK 36 Clean-APK Pipeline (`mobile/scripts/build-apk.sh`) & ADB UIAutomator2 / Maestro E2E (`mobile/scripts/e2e-mobile-adb.sh`).
- **Edge & Distributed API Gateway:** Nginx 1.27 Edge Reverse Proxy (`nginx/gateway.conf` on `:8080`, K8s `Ingress` in `k8s/deployment-and-hpa.yaml`) + Pure-ASGI Distributed Redis Gateway (`backend/app/core/gateway.py` with `belooga:gw:rl:*` rate-limiting, `belooga:gw:idem:*` idempotency replay, ETag `304`, and ConnectRPC `/v1/rpc/*`).
- **Backend:** FastAPI, Python 3.12+, SQLAlchemy 2.0 Async (`asyncpg`), Alembic (`backend/alembic/`), Pydantic v2, Argon2id password hashing, ReportLab (PDF resumes), AnyIO.
- **Database & Cache:** PostgreSQL 16 (`backend/initdb.sql`; GIN `TSVECTOR`, `pg_trgm`), Redis 7 (Two-Tier L1/L2 SWR Cache & Distributed Gateway state).
- **Quality Control:** Playwright (TypeScript/Bun) in `qc/` (`bun run test:e2e`), Pytest in `backend/tests/`.
- **Legacy Source:** In-repo `legacy/` (strictly **READ-ONLY** historical reference; `$LEGACY_DIR` optionally points at an upstream checkout).

---

## 2. Infrastructure & Port Mapping

| Service | Internal Port | Host-Mapped Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `3000` | `http://localhost:3000` | Next.js App Router development server |
| **Edge API Gateway** | `8080` | `http://localhost:8080` | Nginx 1.27 reverse proxy (**belooga-gateway**, `/v1/*`, `/uploads/*`, `/docs`) |
| **Backend API** | `8000` | `http://localhost:8000` | FastAPI modular monolith (`backend/app/main.py` & Pure-ASGI Gateway) |
| **PostgreSQL** | `5432` | `localhost:5433` | Primary relational DB (`belooga_db` & `belooga_test`) |
| **Redis** | `6379` | `localhost:6379` | Distributed Gateway rate-limit/idempotency & L2 SWR cache |

---

## 3. Top 6 Absolute Prohibitions (Always-On Invariants)

Every human developer and AI agent must obey the non-negotiable laws in [GEMINI.md](GEMINI.md):

1. **Never edit `legacy/**`:** Files in `legacy/` are strictly **READ-ONLY** historical references.
2. **No sycophancy ("Yes-Man"):** Follow `belooga-supervisor`. Challenge contradictions, bloat, or weak business ROI immediately with repository evidence.
3. **No fake success banners, band-aid code, or `useEffect` API calls:** Never stub UI toasts, swallow exceptions (`except: pass`), bypass `router -> service -> repository` layers, call `apiClient` inside `useEffect` (must use `@tanstack/react-query`), or skip tests (`test.skip()`).
4. **No blocking calls in async event loop:** Never call `open()`, `doc.build()`, `shutil.rmtree()`, or `remove()` synchronously inside `async` functions across `backend/app/`; always use `asyncio.to_thread`.
5. **No unindexed search fallbacks:** Never combine `search_vector @@` with `OR ILIKE` (violates ADR-005).
6. **No completion without proof:** Never claim a task or bug fix is done without completing [`.agents/workflows/definition-of-done.md`](.agents/workflows/definition-of-done.md) (`No Proof = Not Done`).

---

## 4. Developer Quickstart Cheat Sheet

### 4.1 First-Time Setup
```bash
# 1. Start database, cache, backend, and Edge API Gateway (:8080)
docker compose up -d postgres redis backend gateway

# 2. Setup Python virtual environment
python3 -m venv backend/.venv
backend/.venv/bin/pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements.txt

# 3. Setup Frontend & Mobile dependencies
cd frontend && bun install && cd ../mobile && bun install && cd ..

# 4. Seed development and test databases
backend/.venv/bin/python3 scripts/seed-data.py
DATABASE_URL="postgresql+asyncpg://belooga:belooga_secret_password@localhost:5433/belooga_test" backend/.venv/bin/python3 scripts/seed-data.py

# 5. Install the local pre-push gate (runs scripts/pre-push-gate.sh)
git config core.hooksPath .githooks
```
Windows: the venv lives in `backend/.venv/Scripts/` (`python.exe`, `pip.exe`, `pytest.exe`) instead of `backend/.venv/bin/`. `docker compose` reads `JWT_SECRET` from `.env` (`cp .env.example .env`); the built-in fallback is dev-only.

### 4.2 Running the Application
```bash
# Verify Edge API Gateway & Distributed Redis Telemetry (Port 8080)
curl -i http://localhost:8080/v1/gateway/status

# Or run Backend API locally (Port 8000)
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000

# Run Frontend UI (Port 3000, connects to http://localhost:8080)
cd frontend && bun run dev
```

### 4.3 Verification & Automated Truth Gates
```bash
# 1. Sync dynamic Single Source of Truth & Skill AUTO facts
python3 scripts/generate-current-state.py --allow-dirty
python3 scripts/render-skill-facts.py --write

# 2. Run Skill Linter & Supervisor Anti-Deception Trust Benchmark
python3 scripts/lint-skills.py --quiet
python3 scripts/trust-benchmark.py

# 3. Run Master Truth Auditor (All 8 schema, AST, pytest & tsc gates)
bash scripts/audit-truth.sh
```
The full, canonical checklist is [`.agents/workflows/definition-of-done.md`](.agents/workflows/definition-of-done.md).

---

## 5. Pre-Seeded Reference Personas

| Role | Email | Password | Username | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@belooga.com` | `AdminSecret123!` | - | Platform administration |
| **Public Candidate** | `alex@belooga.com` | `SecurePassword123!` | `alexnguyen` | Staff Full-Stack Engineer, public profile, full PII |
| **Stealth Candidate** | `jane@belooga.com` | `JaneSecret123!` | `hidden_jane` | Stealth founder (`is_hidden=TRUE`), PII protected |

---

## 6. CI/CD & Deployment

| Workflow | Trigger | What it does |
| :--- | :--- | :--- |
| `ci.yml` | push / PR to `main` | SSOT audit, backend pytest + coverage (`COV_MIN`), Alembic-from-empty + single-head check, frontend lint/build, mobile tests, Playwright E2E, `security` (pip-audit, `bun audit` high+, gitleaks) and `docker` (image builds) jobs |
| `deploy.yml` | CI green on `main`, or manual | Pushes `ghcr.io/farmer911/belooga-{backend,frontend}:<sha>`; `production` job runs the migration Job, applies `k8s/` and waits for rollout |
| `codeql.yml` | push / PR / weekly | CodeQL security-and-quality |
| `ai-code-review.yml` | PR / push | Gemini review (PR comment or step summary) |
| `ai-pm-planner.yml` | maintainer adds `type:idea` to a trusted issue | Gemini decomposes the idea into at most 8 tasks |
| `skill-evals.yml` | weekly / manual | `scripts/eval-triggers.py` skill-routing accuracy |

**Required repository setup (Settings):**
- **Secrets:** `GEMINI_API_KEY` (AI workflows, skill evals). Environment `production` secret `KUBE_CONFIG` = `base64 -w0 kubeconfig`; without it, deploy only pushes images.
- **Environment `production`:** required reviewers + deployment branch rule `main`.
- **Variables (optional):** `NEXT_PUBLIC_API_URL` (default `https://api.belooga.com`), `NEXT_PUBLIC_SITE_URL`, `KUBE_NAMESPACE` (default `default`).
- **Branch protection on `main`:** require the `SSOT Ground Truth & Test Verification`, `Dependency Audit & Secret Scan`, `Docker Images Build (no push)` and CodeQL checks.
- **GHCR:** make both packages public, or add an image pull secret to the namespace.

**Cluster prerequisites:** ingress-nginx, cert-manager with a `letsencrypt-prod` ClusterIssuer, a `ReadWriteMany` storage class for the uploads PVC (or move uploads to object storage), and the app Secret:
```bash
# keys: see k8s/secrets.example.yaml (never commit real values)
kubectl create secret generic belooga-secrets --from-env-file=belooga-secrets.env
```

---

## 7. AI Agent Layer (Gemini / Antigravity and Claude Code)

- Canonical agent content lives in `.agents/` (skills, rules, workflows, `ROUTER.md`); `GEMINI.md` is the always-on entry point.
- Claude Code reads `CLAUDE.md`, which imports `GEMINI.md`, the always-on rule and the router. `.claude/skills` mirrors `.agents/skills` (`python3 scripts/sync-claude-skills.py`), `.claude/commands/` exposes the workflows as `/investigate`, `/definition-of-done`, `/schema-change`, `/visual-verify`, and `.claude/agents/investigator.md` is a read-only subagent.
- Gates: `python3 scripts/lint-skills.py --quiet` (broken refs, contradictions, Claude mirror sync) and `python3 scripts/eval-triggers.py` (skill routing accuracy; needs `GEMINI_API_KEY`).
