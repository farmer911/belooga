# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (Remediate All 71 GitHub CodeQL Security & Quality Alerts + Permanent Guard):**
  1. **Security Remediation (12/12 Alerts):** Enforce `get_validated_video_path()` (`os.path.realpath` + `.startswith`) in `media_transcoder.py`, strip user-controlled paths from log entries in `media/service.py` & `media_transcoder.py`, verify `event.origin === self.location.origin` in `frontend/public/sw.js`, and add `permissions: contents: read` + commit-pinned `oven-sh/setup-bun` in `.github/workflows/ci.yml`.
  2. **Code Quality Remediation (59/59 Alerts):** Eliminate all unused imports, unused local/global variables, repeated imports, uninitialized variables, and `empty-except` blocks across `backend/`, `frontend/`, `scripts/`, and `.agents/skills/ui-ux-pro-max/scripts/`.
  3. **Self-Learn Permanent Guard (`scripts/trust-benchmark.py`, `docs/VIOLATIONS_REGISTER.md`):** Extend `trust-benchmark.py` Axis 2 to fail on AST `empty-except` and unused top-level imports across `backend/app/`, `backend/tests/`, and `scripts/`, and log `VIOLATION-007`.

## Pre-Mortem Risks
- Do not claim 0 CodeQL alerts until the post-merge `CodeQL` workflow on `main` finishes and `gh api repos/farmer911/belooga/code-scanning/alerts?state=open` returns `0`.

## Execution Checklist
- [x] Fix 12 security/workflow alerts (`media_transcoder.py`, `media/service.py`, `sw.js`, `ci.yml`)
- [x] Fix 59 quality alerts (`unused-import`, `unused-variable`, `empty-except`, Alembic revision globals)
- [x] Upgrade `scripts/trust-benchmark.py` + `docs/VIOLATIONS_REGISTER.md` (`VIOLATION-007`)
- [x] Verify `audit-truth.sh`, PR CI green, merge to `main`, and confirm `0` open CodeQL alerts
