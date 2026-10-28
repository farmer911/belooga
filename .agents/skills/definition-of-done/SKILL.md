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
   - **Service (`app/modules/<domain>/service.py`):** Business logic, transaction orchestration, ownership guards, `asyncio.to_thread` for blocking I/O, and calls Repositories.
   - **Repository (`app/modules/<domain>/repository.py`):** Database queries, inserts, updates, deletes, and row-level locks (`with_for_update`).
   - `app/services/*_service.py` and `app/repositories/*_repo.py` are re-export shims; never add domain code there or import `app.services` from routers (`scripts/trust-benchmark.py` rejects it). Only the shared helpers `app/services/media_transcoder.py` and `app/services/pdf_generator.py` are real code.
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

## 2. Gates & Procedure

The gates, commands and PR procedure live in exactly one place: `.agents/workflows/definition-of-done.md`. Run it; do not restate it here.

## Known Traps
- **CI Runner Stdlib Isolation (`python3 -I -S`):** Root gate scripts (`scripts/lint-skills.py`, `scripts/ratchet.py`, `scripts/render-skill-facts.py`, `scripts/generate-current-state.py`) run under system `python3` in GitHub Actions and must never require unguarded third-party packages (`PyYAML`, etc.). Always wait for `gh pr checks --watch` to complete green after `git push`.
- **Post-Merge CodeQL & Background Bot PRs (`VIOLATION-007` & `VIOLATION-008`):** Never report task completion immediately after merging without verifying on `main` that post-merge `CodeQL` runs completed with `0` open alerts and that no background bot PRs (`app/dependabot`) are failing CI (`scripts/trust-benchmark.py` enforces all 3 checks automatically).

