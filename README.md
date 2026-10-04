# Belooga Platform

[![Belooga SSOT & Integrity CI](https://github.com/farmer911/belooga/actions/workflows/ci.yml/badge.svg)](https://github.com/farmer911/belooga/actions/workflows/ci.yml)
[![Belooga AI Code Reviewer](https://github.com/farmer911/belooga/actions/workflows/ai-code-review.yml/badge.svg)](https://github.com/farmer911/belooga/actions/workflows/ai-code-review.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Belooga** is a modern, high-performance, video-first talent discovery and recruitment platform. Candidates showcase their skills and personality via recorded video elevator pitches, dynamic career timelines, and verified skills, while recruiters search and discover verified talent via full-text search and AI-driven matching.

---

## 1. Verified Tech Stack (Ground Truth)

All agents (Claude, Antigravity, Codex, Cursor, etc.) and human contributors must strictly adhere to the verified runtime stack:

- **Frontend:** Next.js 16.3.8, React 19 (App Router), Bun runtime, Tailwind CSS v4, Zustand (state persistence).
- **Backend:** FastAPI, Python 3.12+, SQLAlchemy 2.0 Async (`asyncpg`), Pydantic v2, Argon2id password hashing, ReportLab (PDF resumes), AnyIO non-blocking disk I/O.
- **Database & Cache:** PostgreSQL 16 (`backend/initdb.sql` with 24 tables, GIN `TSVECTOR`, `pg_trgm`), Redis 7.
- **Quality Control:** Playwright (TypeScript/Bun) in `qc/` (`bun run test:e2e`), Pytest in `backend/tests/` (19 hermetic security & integration tests).
- **Legacy Source:** Stored in `legacy/` (Strictly **READ-ONLY** historical reference; local original at `/Users/phucnguyen/Dev/Beloga-CV`).

---

## 2. Infrastructure & Port Mapping

| Service | Internal Port | Host-Mapped Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `3000` | `http://localhost:3000` | Next.js App Router development server |
| **Backend API** | `8000` | `http://localhost:8000` | FastAPI server (`/docs` for interactive Swagger UI) |
| **PostgreSQL** | `5432` | `localhost:5433` | Primary relational DB (`belooga_db` & `belooga_test`) |
| **Redis** | `6379` | `localhost:6379` | In-memory cache and session store |

> [!NOTE]
> PostgreSQL host port is mapped to **`5433`** to avoid port collisions with any local PostgreSQL instance installed on macOS or Linux.

---

## 3. The 5 Absolute Prohibitions (Ground Rules for ALL AI Agents)

Every human developer and AI agent (Claude Code, Codex, Antigravity, etc.) must obey these non-negotiable rules:

1. **NEVER edit `legacy/**`:** Files in `legacy/` are strictly **READ-ONLY** reference prototypes. Never modify them.
2. **NO fake success banners:** Never stub frontend buttons with fake success toasts without real backend endpoints and tests.
3. **NO blocking calls in async event loop:** Never call `open()`, `doc.build()`, `shutil.rmtree()`, or file operations synchronously inside `async` functions; always wrap with `asyncio.to_thread`.
4. **NO unindexed search fallbacks:** Never combine `search_vector @@` with `OR ILIKE` (violates ADR-005). Rely strictly on PostgreSQL GIN indexing.
5. **NO completion without proof:** Never claim a task or bug fix is done without running verified tests and providing command output (`No Proof = Not Done`).

---

## 4. Autonomous Agent Engineering Workflow

Belooga operates under an asynchronous, issue-driven autonomous workflow:

```mermaid
flowchart TD
    User["👤 Human Product Owner<br/>Submits Idea in GitHub Issues / Project Board"] --> PM["🤖 AI PM Agent (Gemini 2.0)<br/>Reads SSOT & Decomposes into English Tasks"]
    
    PM --> Board["📋 GitHub Projects Kanban Board<br/>Backlog ➔ To Do ➔ In Progress ➔ In Review ➔ Done"]
    
    Board --> Worker["🛠️ AI Worker / Developer Agent<br/>Picks task via scripts/agent-dispatch.py"]
    
    Worker --> TDD["🧪 TDD Implementation<br/>Writes failing test ➔ Minimal code ➔ audit-truth.sh"]
    
    TDD --> PR["🔀 Pull Request & Automated CI"]
    
    PR --> CI["⚙️ GitHub Actions CI<br/>19 Pytest, TypeScript check, SSOT zero-drift"]
    PR --> Reviewer["🤖 AI Code Reviewer Agent<br/>Reviews diff against GEMINI.md & leaves comment"]
    
    CI & Reviewer -->|Pass ✅| Merge["🚀 Merge to Main & Close Task"]
    CI & Reviewer -->|Changes Requested 🛑| Worker
```

### Step 1: Submit an Idea
Create a GitHub Issue using the **💡 Propose an Idea** template (or type an idea on the GitHub Projects Board).

### Step 2: Automated PM Decomposition
The **Belooga AI PM Planner** workflow triggers automatically:
- Reads [CURRENT_STATE.md](file:///Users/phucnguyen/Dev/Beloga/CURRENT_STATE.md) (live AST schema) and [GEMINI.md](file:///Users/phucnguyen/Dev/Beloga/GEMINI.md).
- Formulates a technical specification (PRD) with User Stories, Architectural Decisions, and Acceptance Criteria.
- Generates linked engineering tasks in **100% English** (e.g., `[BE]: Implement Data Layer`, `[FE]: Implement UI Integration`).

### Step 3: Agent Task Dispatch
To start working on any task, run the dispatcher script with the issue number:
```bash
python3 scripts/agent-dispatch.py <issue_number>
```
This automatically:
1. Fetches task requirements from GitHub.
2. Creates and checks out an isolated feature branch `feat/issue-<id>-<slug>`.
3. Moves the GitHub Issue status to `status:in-progress`.
4. Outputs the exact technical contract and TDD instructions.

### Step 4: Verification & Automated CI Gate
Before opening a Pull Request, run the Master Truth Auditor:
```bash
bash scripts/audit-truth.sh
```
This verifies 8 automated gates:
1. PostgreSQL schema matches `backend/initdb.sql` (24 tables).
2. `CURRENT_STATE.md` programmatic generator runs cleanly with 0 drift.
3. Skills documentation has 0 broken references and 0 TO-BE hallucinations.
4. Mutation endpoints have authenticated IDOR ownership guards.
5. Zero synchronous blocking I/O calls inside async FastAPI handlers.
6. Search queries strictly use GIN `search_vector` (zero `OR ILIKE`).
7. 19/19 hermetic backend Pytest suite passes against isolated test DB.
8. Frontend TypeScript compilation passes with 0 errors.

### Step 5: Pull Request & AI Review
Push the feature branch and open a PR:
```bash
gh pr create --title "[BE]: Feature Title" --body "Closes #<issue_number>"
```
- **Belooga SSOT & Integrity CI** verifies all tests and builds on a clean Ubuntu runner.
- **Belooga AI Code Reviewer** analyzes the diff and posts a detailed code review directly on the PR.

---

## 5. Developer Quickstart Cheat Sheet

### 5.1 First-Time Setup
```bash
# 1. Start database and cache
docker compose up -d postgres redis

# 2. Setup Python virtual environment
python3 -m venv backend/.venv
backend/.venv/bin/pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/pip install pytest pytest-asyncio httpx

# 3. Setup Frontend dependencies
cd frontend && bun install && cd ..

# 4. Seed development and test databases
backend/.venv/bin/python3 scripts/seed-data.py
DATABASE_URL="postgresql+asyncpg://belooga:belooga_secret_password@localhost:5433/belooga_test" backend/.venv/bin/python3 scripts/seed-data.py
```

### 5.2 Running the Application
```bash
# Run Backend API (Port 8000)
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000

# Run Frontend UI (Port 3000)
cd frontend && bun run dev
```

### 5.3 Running Tests & Audits
```bash
# Run backend pytest suite
backend/.venv/bin/pytest backend/tests/

# Run frontend TypeScript type-check
cd frontend && bun x tsc --noEmit && cd ..

# Run Master Truth Auditor (Runs all 8 gates)
bash scripts/audit-truth.sh

# Regenerate dynamic Single Source of Truth
python3 scripts/generate-current-state.py
```

---

## 6. Pre-seeded Test Accounts

The seed script creates the following reference personas:

| Role | Email | Password | Username | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@belooga.com` | `AdminSecret123!` | - | Platform administration |
| **Public Candidate** | `alex@belooga.com` | `SecurePassword123!` | `alexnguyen` | Staff Full-Stack Engineer, public profile, full PII |
| **Stealth Candidate** | `jane@belooga.com` | `JaneSecret123!` | `hidden_jane` | Stealth founder (`is_hidden=TRUE`), PII protected |

---

## 7. Instructions for Incoming AI Agents (Claude, Codex, Antigravity)

When an AI agent begins work on this repository:
1. **Always read [GEMINI.md](file:///Users/phucnguyen/Dev/Beloga/GEMINI.md)**: Contains always-on stack invariants and rules.
2. **Always consult [CURRENT_STATE.md](file:///Users/phucnguyen/Dev/Beloga/CURRENT_STATE.md)**: The dynamically generated single source of truth for all 24 tables and 38 active endpoints. Never invent or hallucinate routes.
3. **Follow the TDD Workflow**: Always produce a failing test in `backend/tests/` before implementing backend changes.
4. **All Tickets & Documentation Must Be in English**: Maintain 100% technical English across all issues, pull requests, and code comments.
5. **Audit Before PR**: Always verify that `bash scripts/audit-truth.sh` exits with 0 before submitting code.
