# Belooga Platform Engineering Onboarding Guide

Welcome to the **Belooga** engineering repository. This document serves as the authoritative onboarding manual and single source of truth for getting your local development, testing, and CI/CD environment operational within minutes.

---

## 1. System Architecture & Tech Stack

Belooga is an enterprise video-first recruitment platform built around a high-performance modern web stack:

- **Frontend Engine**: Next.js 16.3.8 + React 19 (App Router), Bun runtime, Tailwind CSS v4, Zustand (state persistence), TanStack Query v5.
- **Backend API Engine**: FastAPI (Python 3.12+), SQLAlchemy 2.0 Async (`asyncpg`), Pydantic v2, Argon2id (`pwdlib`), AnyIO non-blocking disk I/O, ReportLab PDF generation.
- **Data & Caching**: PostgreSQL 16 with `pg_trgm` (trigram fuzzy search) and `TSVECTOR` generated columns with GIN indexing; Redis 7 for high-speed caching and rate limiting.
- **Quality Control**: Playwright (TypeScript/Bun) for end-to-end test automation and visual regression testing; Pytest for hermetic backend integration testing.

---

## 2. Infrastructure Port Allocation Matrix

| Service | Internal Container Port | Host-Mapped Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `3000` | `http://localhost:3000` | Next.js App Router development server |
| **Backend API** | `8000` | `http://localhost:8000` | FastAPI server (`/docs` for Swagger UI) |
| **PostgreSQL** | `5432` | `localhost:5433` | Primary relational database (`belooga_db` & `belooga_test`) |
| **Redis** | `6379` | `localhost:6379` | In-memory cache and session store |

> [!NOTE]
> The PostgreSQL host port is mapped to **`5433`** to avoid port collisions with any local PostgreSQL instance installed on macOS or Linux systems.

---

## 3. Quickstart Setup (Step-by-Step)

### Step 3.1: Prerequisites
Ensure your local environment has the following tools installed:
- [Docker Desktop](https://www.docker.com/) (version 24+ and Docker Compose v2)
- [Python](https://www.python.org/) (version 3.12 or newer)
- [Bun](https://bun.sh/) (version 1.1 or newer)
- [Node.js](https://nodejs.org/) (v20+ LTS)

### Step 3.2: Environment Configuration
Copy the template configuration to activate your local environment:
```bash
cp .env.example .env
```

### Step 3.3: Start Infrastructure Containers
Launch PostgreSQL 16 and Redis 7 in detached mode:
```bash
docker compose up -d postgres redis
```
Verify container health:
```bash
docker compose ps
```
Both `belooga-postgres` and `belooga-redis` should report `(healthy)`.

### Step 3.4: Setup Python Virtual Environment
Initialize the dedicated virtual environment and install backend requirements:
```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements.txt
```

### Step 3.5: Initialize and Seed Databases
Execute the idempotent seed script to populate both the primary development database (`belooga_db`) and the hermetic test database (`belooga_test`):
```bash
backend/.venv/bin/python3 scripts/seed-data.py
```
This script initializes tables, triggers, and indices from `backend/initdb.sql` and inserts clean persona records.

### Step 3.6: Launch Backend API Server
In a dedicated terminal:
```bash
cd backend
../backend/.venv/bin/uvicorn app.main:app --reload --port 8000
```
Verify backend health:
```bash
curl http://localhost:8000/health
# Output: {"status":"healthy","service":"belooga-backend","version":"1.0.0"}
```
Explore the interactive OpenAPI documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

### Step 3.7: Launch Frontend Application
In another terminal:
```bash
cd frontend
bun install
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Pre-seeded Test Accounts & Personas

The seed script creates three reference personas for testing authentication, authorization, role permissions, and privacy controls:

| Persona | Email / Username | Password | Role / State | Key Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **Standard Candidate** | `alex@belooga.com`<br>`alexnguyen` | `SecurePassword123!` | Candidate (`public`) | Complete profile with 2 work experiences, 2 educations, 5 skills, PDF resume, video pitch, avatar. |
| **Admin User** | `admin@belooga.com`<br>`admin_sarah` | `AdminSecret123!` | Admin (`public`) | Administrative privileges for platform moderation and ticket management. |
| **Hidden Candidate** | `hidden@belooga.com`<br>`hidden_jane` | `HiddenSecret123!` | Candidate (`is_hidden=TRUE`) | Privacy test persona. Excluded from public search; public profile and PDF resume return HTTP 404 for unauthenticated visitors. |

---

## 5. Architectural Ground Truth & Known Gap Registry

Belooga strictly enforces a **Zero-Hallucination Policy** between documentation, AI agent skills, and executable code.

### Ground Truth vs. Target Architecture
- **Current Ground Truth (AS-IS)**: The backend operates as a Clean 2-Layer modular monolith where endpoints in `backend/app/api/v1/endpoints/` directly interact with SQLAlchemy 2.0 Async models and database sessions.
- **Target Architecture (TO-BE)**: Documented under `> [!WARNING] TARGET ARCHITECTURE` banners in `.agents/skills/be-service-*/SKILL.md` (Domain Services and Repositories layers planned for high-scale enterprise decoupling).

### Known Architecture Stubs & Gaps (AS-IS Registry)
1. **Password Reset (`/forgot-password`)**: Frontend UI allows entering email with client-side modal confirmation. Backend password reset token generation and email dispatch are currently mocked.
2. **Account Settings (`/user/[username]/settings`)**: Password update and account deletion forms execute client-side state notifications. Dedicated backend `/v1/auth/password` and `/v1/users/{id}` deletion endpoints are scheduled for Next Release.
3. **OAuth Callback (`/callback`)**: Page captures token parameters and redirects to workspace. Third-party provider handshake is simulated.
4. **Master Catalogs & CMS (`/catalogs/...`, `/career/jobs/`, `/cms/faq`)**: Endpoints return structured, searchable in-memory reference datasets without database persistence overhead.

---

## 6. Verification & Quality Gates

Every code change must pass all 8 automated quality gates before pull request approval.

### 6.1: Run Full Truth Audit
Run the master audit script that validates schema parity, endpoint routing, AST security invariants, IDOR guards, blocking async calls, and agent skill synchronization:
```bash
bash scripts/audit-truth.sh
```
*Expected result: All 8 checks pass with 0 errors.*

### 6.2: Run Backend Integration Test Suite
Tests run against the isolated `belooga_test` database (port 5433) without modifying or polluting the development database:
```bash
backend/.venv/bin/pytest backend/tests/ -v
```
*Current test suite: 19 integration tests passing (100% success).*

### 6.3: Run Frontend TypeScript Typecheck
Verify strict zero-`any` and error-free Next.js compilation:
```bash
cd frontend && bun x tsc --noEmit
```
*Expected result: 0 errors.*

### 6.4: Run Playwright End-to-End Suite
Execute browser automated tests covering candidate workspace, talent discovery, public profile, and authentication:
```bash
cd qc && bunx playwright test tests/e2e
```

### 6.5: Knowledge Graph Maintenance
Per project engineering rules, after modifying any source code files, update the AST knowledge graph:
```bash
graphify update .
```

---

## 7. Key Project Directories

```
Belooga/
├── .agents/skills/              # 50 specialized agent skills (Zero-Hallucination audited)
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # 8 Domain router modules (38 endpoints)
│   │   ├── core/                # Database engine (asyncpg) & security (Argon2id/JWT)
│   │   └── main.py              # FastAPI application lifecycle & CORS
│   ├── initdb.sql               # 24 PostgreSQL tables, triggers & GIN indexes
│   ├── requirements.txt         # Pinned Python dependencies
│   └── tests/                   # Hermetic integration test suite
├── frontend/
│   ├── src/
│   │   ├── app/                 # 18 Next.js App Router page families
│   │   ├── components/          # Atomic Design UI components
│   │   ├── services/            # Axios API client & endpoints
│   │   └── store/               # Zustand state stores
│   └── package.json
├── qc/
│   ├── tests/e2e/               # Playwright E2E test suites
│   └── playwright.config.ts     # Multi-device browser testing matrix
├── scripts/
│   ├── audit-truth.sh           # 8-Gate Truth Verification Auditor
│   ├── generate-current-state.py# AST Single Source of Truth generator
│   └── seed-data.py             # Idempotent dual-database seeder
├── CURRENT_STATE.md             # Ground-truth system state documentation
├── docker-compose.yml           # PostgreSQL 16 & Redis 7 container orchestration
└── ONBOARDING.md                # This authoritative guide
```
