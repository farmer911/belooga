---
name: definition-of-done
description: Enterprise Definition of Done (DoD) contract, automatic SSOT/skill synchronization, and Anti-Deception Trust Benchmark gates for Belooga deliverables. Use when preparing a PR, finishing a task, verifying code gates, or checking architectural compliance. Not for writing code or individual unit tests (tdd-workflow).
---

# Enterprise Definition of Done (DoD) Quality Contract

> **Rule:** Every deliverable (feature, refactor, bug fix) must synchronize repository knowledge and satisfy all deterministic verification gates below with empirical command evidence before being declared done.

---

## 1. Architectural & Modularity Invariants

1. **Backend Layered Architecture:**
   - **Router (`app/api/v1/endpoints/`):** Thin controller; parses HTTP requests, authenticates user, delegates to Service, returns typed response. Zero SQL (`select`, `db.execute`, `text`) and zero business workflows.
   - **Service (`app/services/`):** Business logic, transaction orchestration, ownership guards, `asyncio.to_thread` for blocking I/O, and calls Repositories.
   - **Repository (`app/repositories/`):** Database queries, inserts, updates, deletes, and row-level locks (`with_for_update`).
   - **Models & Schemas:** SQLAlchemy ORM models in `app/models/`, Pydantic DTOs in `app/schemas/`, and migrations in `backend/alembic/versions/`.
2. **Frontend Atomic Design:**
   - **Atoms (`components/ui/`):** Pure presentation primitives without business logic.
   - **Molecules (`components/common/`):** Combinations of atoms forming reusable UI units.
   - **Organisms (`components/features/`):** Feature-scoped domain components.
   - **Custom Hooks (`hooks/`):** Stateful logic, client-side timers, WebRTC, and API interactions.
   - **Pages (`app/`):** Thin orchestrators under the ratchet baseline line limits (zero raw `fetch()` inside `page.tsx`).
3. **File Size & Memory Cap Invariants:**
   - Source files in `backend/app/` must remain <= 300 lines (`be_files_over_300_lines = 0`), and `frontend/src/` must never exceed `.agents/ratchet.json`.
   - `.agents/STATE.md` must stay <= 50 lines; `.agents/PRODUCT_THESIS.md` must stay <= 120 lines.

---

## 2. Mandatory Post-Feature Knowledge Sync

Before running final gates on any new feature or contract change, synchronize the harness automatically:
```bash
python3 scripts/generate-current-state.py --allow-dirty
python3 scripts/render-skill-facts.py --write
```
If a new trap or product insight was discovered, update the target `SKILL.md` (`## Known Traps`) or `.agents/PRODUCT_THESIS.md` per `belooga-self-learn`.

---

## 3. The Verification Gates

Every pull request or task completion must pass these empirical gates:

| Gate | Verification Command | Requirement |
|---|---|---|
| **Anti-Deception Benchmark** | `python3 scripts/trust-benchmark.py` | 100% Trust Score (0 violations) |
| **Skill Lint & Ratchet** | `python3 scripts/lint-skills.py --quiet && python3 scripts/ratchet.py` | 0 errors, no WORSE metrics |
| **Backend Tests** | `backend/.venv/bin/pytest backend/tests/ -v` | 100% pass (Exit: 0) |
| **Frontend Typecheck** | `cd frontend && bun x tsc --noEmit` | 0 errors (Exit: 0) |
| **E2E / Visual & Video Evidence** | `cd qc && bun run test:e2e -- <spec>` | Pass + retain `.png`/`.webm` evidence |
| **Local Pre-Push Gate** | `bash scripts/pre-push-gate.sh` | Blocks push if any check or orphan worker fails |
| **Master SSOT Truth** | `bash scripts/audit-truth.sh` | All gates pass (Exit: 0) |
| **Remote GitHub Actions CI** | `gh run list --limit 2` | Verify remote `Belooga SSOT & Integrity CI` passes after push |

## Known Traps
- **CI Runner Stdlib Isolation (`python3 -I -S`):** Root gate scripts (`scripts/lint-skills.py`, `scripts/ratchet.py`, `scripts/render-skill-facts.py`, `scripts/generate-current-state.py`) run under system `python3` in GitHub Actions and must never require unguarded third-party packages (`PyYAML`, etc.). Always verify `gh run list` after `git push`.

---

## 4. Ratchet Tightening Rule

When an engineering task improves any metric recorded in `.agents/ratchet.json` (eliminating `any` types, removing `# type: ignore`, or reducing file bloat), run:
```bash
python3 scripts/ratchet.py --update
```
to lock in the improved baseline.

---

## 5. Empirical Proof of Work & Independent Review

Never claim a task is complete without running the verified commands above, attaching screenshot/video evidence for UI changes, and verifying via an independent reviewer pass (`be-code-review` / `fe-code-review`) with exit code 0.
