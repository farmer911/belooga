# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (GitHub Code Security & Quality - Option B):** Configure GitHub CodeQL (`security-and-quality` suite) & Dependabot SCA for `farmer911/belooga`:
  1. **Dependabot Configuration (`.github/dependabot.yml`):** Automated weekly dependency & CVE tracking across `backend` (`pip`), `frontend` (`npm`), `qc` (`npm`), and `.github/workflows` (`github-actions`) with grouped minor/patch updates to prevent PR noise.
  2. **CodeQL Security & Quality Workflow (`.github/workflows/codeql.yml`):** Run `github/codeql-action@v3` matrix (`actions`, `python`, `javascript-typescript`) with `queries: security-and-quality` on push/PR to `main` and weekly schedule, excluding `legacy/**` and build artifacts.
  3. **Repo Security Settings (`gh api`):** Enable `vulnerability-alerts` and `automated-security-fixes` on `farmer911/belooga`.

## Pre-Mortem Risks
- Ignore `legacy/**` (read-only historical reference) in CodeQL config so legacy files do not pollute SAST/Quality signals.
- Keep `STATE.md` <= 50 lines and verify remote PR CI (`gh pr checks --watch`) passes 100% including the new CodeQL workflow jobs.

## Execution Checklist
- [x] Create `.github/dependabot.yml` covering `pip`, `npm` (`frontend`, `qc`), and `github-actions`
- [x] Create `.github/workflows/codeql.yml` with `queries: security-and-quality` and `paths-ignore`
- [x] Enable GitHub `vulnerability-alerts` and `automated-security-fixes` via `gh api`
- [x] Verify `audit-truth.sh`, `trust-benchmark.py`, and remote PR checks (`gh pr checks --watch`)
