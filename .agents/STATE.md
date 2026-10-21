# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (Consolidate Dependabot PRs `#30`–`#37`, Fix WebRTC Studio Race Condition & Add Repo PR Health Guard):**
  1. **Consolidate Dependency Upgrades (`#30`–`#37`):** Upgrade `actions/checkout@v7` & `actions/setup-python@v7` across `.github/workflows/*.yml`, update `backend/requirements.txt` (`fastapi>=0.143.3`, `sqlalchemy>=2.1.5`, `pyjwt>=2.15.1`, `redis>=8.1.0`, `pytest-asyncio>=1.4.0`), regenerate `CURRENT_STATE.md`, and group Dependabot updates (`open-pull-requests-limit: 1`).
  2. **Fix WebRTC Studio E2E Race (`use-webrtc-studio.ts`):** Stop previous stream tracks only after `acquireStream()` resolves, verify live tracks in `startRecording()`, and set `recordedVideoUrl` synchronously in `stopRecording()` without impure nested state updaters.
  3. **Automated PR/CI Health Guard (`scripts/trust-benchmark.py`, `docs/VIOLATIONS_REGISTER.md`):** Query `gh pr list --state open --json number,title,statusCheckRollup` in `trust-benchmark.py` Axis 6 so any failing open PR on the repo immediately fails the supervisor benchmark (`VIOLATION-008`).

## Pre-Mortem Risks
- Close superseded Dependabot PRs (`#30`–`#35`, `#37`) and verify `trust-benchmark.py` reports 100% with 0 failing open PRs.

## Execution Checklist
- [x] Consolidate `#30`–`#37` into `backend/requirements.txt`, `.github/workflows/*.yml`, and `.github/dependabot.yml`
- [x] Fix `reacquireStream` & `stopRecording` race in `frontend/src/hooks/use-webrtc-studio.ts`
- [x] Add Open PR CI health monitor to `scripts/trust-benchmark.py` & log `VIOLATION-008`
- [x] Close superseded Dependabot PRs, verify `audit-truth.sh`, merge PR, and confirm 0 failing PRs/runs
