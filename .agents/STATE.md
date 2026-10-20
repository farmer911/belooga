# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task:** Option B2 — Refactor `backend/app/` into **12 Self-Contained Vertical-Slice Modules** under `backend/app/modules/<domain>/` (`__init__.py` Public Facade, `service.py`, `repository.py`), enforce AST Modular Boundary Guards in `scripts/trust-benchmark.py`, and **`git commit` + `git push origin main` after every single completed module (1/12 -> 12/12)**.

## Pre-Mortem Risks
- **Cross-Module Private Imports:** Forbid `from app.modules.<other>.repository import ...` via AST check in `scripts/trust-benchmark.py`. Cross-module calls must go through `app.modules.<other>` public facade.
- **SSOT & CI Compatibility:** Keep `scripts/render-skill-facts.py`, `scripts/lint-skills.py` (`python3 -I -S`), and `CURRENT_STATE.md` 100% synchronized on every push.

## 12-Module Vertical Refactoring & Push Checklist (Option B2)
- [x] Module 1/12 (`profile`): `backend/app/modules/profile/` + Public Profile Facade + Push
- [x] Module 2/12 (`auth`): `backend/app/modules/auth/` (decouple `ProfileRepository`) + Push
- [x] Module 3/12 (`timeline`): `backend/app/modules/timeline/` (decouple `ProfileRepository`) + Push
- [x] Module 4/12 (`media`): `backend/app/modules/media/` (decouple `ProfileRepository`) + Push
- [x] Module 5/12 (`catalogs`): `backend/app/modules/catalogs/` + Push
- [x] Module 6/12 (`search`): `backend/app/modules/search/` (dedicated `SearchService`/`SearchRepository`) + Push
- [ ] Module 7/12 (`cms`): `backend/app/modules/cms/` + Push
- [ ] Module 8/12 (`ats_matching`): `backend/app/modules/ats_matching/` + Push
- [ ] Module 9/12 (`expert_review`): `backend/app/modules/expert_review/` + Push
- [ ] Module 10/12 (`job_tracker`): `backend/app/modules/job_tracker/` + Push
- [ ] Module 11/12 (`payments`): `backend/app/modules/payments/` + Push
- [ ] Module 12/12 (`analytics`): `backend/app/modules/analytics/` + Final 12-Module AST Lock + Push
