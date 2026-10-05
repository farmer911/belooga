---
name: definition-of-done
description: Enterprise Definition of Done (DoD) contract and verification gates for Belooga deliverables. Use when preparing a PR, finishing a task, verifying code gates, or checking architectural compliance. Not for writing code or individual unit tests (tdd-workflow).
---

# Enterprise Definition of Done (DoD) Quality Contract

> **Rule:** Every deliverable (feature, refactor, bug fix) must satisfy all applicable gates below with empirical command evidence before being declared done or merged.

---

## 1. Architectural & Modularity Invariants

1. **Backend Layered Architecture:**
   - **Router (`app/api/v1/endpoints/`):** Thin controller; parses HTTP requests, authenticates user, delegates to Service, returns typed response. Zero SQL and zero business workflows.
   - **Service (`app/services/`):** Business logic, transaction orchestration, ownership guards, and calls Repositories.
   - **Repository (`app/repositories/`):** Database queries, inserts, updates, deletes, and row-level locks (`with_for_update`).
   - **Models & Schemas:** SQLAlchemy ORM models in `app/models/`, Pydantic DTOs in `app/schemas/`, and migrations in `backend/alembic/versions/`.
2. **Frontend Atomic Design:**
   - **Atoms (`components/ui/`):** Pure presentation primitives without business logic.
   - **Molecules (`components/common/`):** Combinations of atoms forming reusable UI units.
   - **Organisms (`components/features/`):** Feature-scoped domain components.
   - **Custom Hooks (`hooks/`):** Stateful logic, client-side timers, WebRTC, and API interactions.
   - **Pages (`app/`):** Thin orchestrators under the ratchet baseline line limits.
3. **File Size Invariant:**
   - All source code files must remain strictly under 300 lines. Split growing modules into sub-components or custom hooks.

---

## 2. The Verification Gates

Every pull request or task completion must pass these empirical gates:

| Gate | Verification Command | Requirement |
|---|---|---|
| **Backend Tests** | `backend/.venv/bin/pytest backend/tests/ -v` | 100% pass (Exit: 0) |
| **Frontend Typecheck** | `cd frontend && bun x tsc --noEmit` | 0 errors (Exit: 0) |
| **E2E / Visual Tests** | `cd qc && bun run test:e2e -- <spec>` | Pass if UI or flow touched |
| **Skill Lint & Ratchet** | `python3 scripts/lint-skills.py --quiet && python3 scripts/ratchet.py` | 0 errors, no WORSE metrics |
| **Schema Migration** | `alembic upgrade head && alembic downgrade -1 && alembic upgrade head` | Two-way migration pass if DB schema changed |
| **Master SSOT Truth** | `bash scripts/audit-truth.sh` | All gates pass |

---

## 3. Ratchet Tightening Rule

When an engineering task improves any metric recorded in `.agents/ratchet.json` (such as eliminating `any` types, removing `# type: ignore`, or reducing arbitrary hex styles), run:
```bash
python3 scripts/ratchet.py --update
```
to lock in the improved baseline. Ratchet metrics may only improve or stay flat; any regression triggers an immediate gate failure.

---

## 4. Empirical Proof of Work

Never claim a task is complete without running the verified commands above. Always provide the exact command, exit code 0, and unedited output snippet adhering to `engineering-integrity-and-evidence`.
