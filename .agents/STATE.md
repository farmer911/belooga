# Active Working Memory (`STATE.md`)

## Objective & Hypothesis
- **Task (BEL-139 — Full Platform Option B Remediation & Anti-Recurrence Gates):**
  1. Fix all 32 FE/BE integration gaps, UI stubs, missing CRUD endpoints, and BE in-memory/hardcoded mocks across all 4 domain tracks.
  2. Upgrade `scripts/trust-benchmark.py` with automated AST gates blocking uncalled BE endpoints, UI `alert()`/`window.prompt()`/`Simulated` stubs, and unpersisted repositories.

## Pre-Mortem Risks
- Enforce `be_files_over_300_lines = 0`, `fe_files_over_300_lines = 0`, `fe_max_page_lines <= 238`, `fe_arbitrary_hex = 0`, `fe_structural_emoji = 0`, `fe_any = 0`.
- All new `@router` endpoints must declare `response_model` and `get_current_user` on mutations.

## Execution Checklist
- [x] **Phase 1:** Full-platform forensic audit (`platform_forensic_audit.md`)
- [x] **Phase 2 (Track 1 BE Core):** Fix Auth avatar/OAuth, Timeline Award PATCH/order & privacy, Media/PDF PII & video-status, Search & DB schema
- [x] **Phase 3 (Track 2 BE Tools):** Fix Job Tracker PATCH & leak, ATS History & dynamic kit/pulse, Catalogs DB queries, Payments DB sync, CMS/Analytics
- [x] **Phase 4 (Track 3 FE Core):** Mount global `AuthSessionBootstrap`, fix Mobile Logout, Homepage `<video>`, Avatar upload, Catalogs autocomplete, Timeline Edit/Reorder, PDF auth blob
- [x] **Phase 5 (Track 4 FE Tools):** Fix CV Studio GET draft/reorder/education, ATS MoMo Tailor callback & History/Questions, Expert Review, Salary params, Kanban Edit, Analytics Copy
- [x] **Phase 6 (Anti-Recurrence Lock & Verification):** Promote FE-BE wiring & stub gates into `scripts/trust-benchmark.py`, run `pytest`, `tsc`, E2E, and PR checks
