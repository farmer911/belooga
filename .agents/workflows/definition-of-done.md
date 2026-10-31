---
name: definition-of-done
description: The single canonical Definition of Done - quality and knowledge-sync gates required before committing, opening a PR, or reporting task completion.
---

# Workflow: Definition of Done (DoD) - canonical

This is the only DoD. `GEMINI.md`, `.agents/ROUTER.md`, the `definition-of-done` skill (architecture invariants + traps) and `scripts/pre-push-gate.sh` (automates Steps 1-3 locally) link here instead of restating it.

> Windows: replace `backend/.venv/bin/` with `backend/.venv/Scripts/` (see `GEMINI.md` §1).

## Step 1: Synchronize Single Source of Truth, Design Tokens & Skill Facts
```bash
python3 scripts/generate-current-state.py --allow-dirty
python3 scripts/render-skill-facts.py --write
python3 scripts/sync-design-tokens.py --check
```
Ensure `CURRENT_STATE.md`, `tokens/design-tokens.json` parity, and `<!-- AUTO:BEGIN -->` blocks in `.agents/skills/*/SKILL.md` reflect all endpoint, schema, token, and route changes. Record new traps/insights per `belooga-self-learn`.

## Step 2: Run Anti-Deception & Trust Benchmark
```bash
python3 scripts/trust-benchmark.py
```
Must achieve **100% Trust Score (0 violations across all 6 axes)**. It also runs `scripts/lint-skills.py --quiet` and `scripts/ratchet.py`.

## Step 3: Run SSOT Ground Truth Auditor (+ targeted tests)
```bash
bash scripts/audit-truth.sh
```
All gates (DB schema, AST IDOR, async non-blocking, backend pytest, frontend tsc + unit tests, skill lint, ratchet) must be green. Also run what your change touches:
- Backend: `backend/.venv/bin/pytest backend/tests/ -v`
- Frontend: `cd frontend && bun x tsc --noEmit && bun run lint`
- E2E / UI: `cd qc && bun run test:e2e` and keep the `.png`/`.webm` evidence.

## Step 4: Lock In Ratchet Improvements (If Metrics Improved)
```bash
python3 scripts/ratchet.py
```
If any metric prints `better`, lock in the lower baseline via `python3 scripts/ratchet.py --update`.

## Step 5: Visual Verification & Independent Review
- UI changed: follow `.agents/workflows/visual-verify.md` (live browser check against `legacy/`, no global CSS pollution).
- Run the matching review skill (`be-code-review` / `fe-code-review`) on the diff.

## Step 6: Update `.agents/STATE.md`, Create Pull Request, Watch Remote CI & Verify Post-Merge Health
```bash
git status
git push -u origin <feature-branch>
gh pr create --title "..." --body "..."
gh pr checks --watch
gh pr merge --squash --delete-branch
python3 scripts/trust-benchmark.py
```
Mark completed items `[x]` in `.agents/STATE.md`, push to a feature/fix branch (never push directly to `main`; install the local gate once with `git config core.hooksPath .githooks`), open a Pull Request, and wait until `gh pr checks --watch` reports 100% green before running `gh pr merge --squash --delete-branch`. After merging to `main`, wait for post-merge workflows (`CodeQL Security & Quality` and `Belooga SSOT & Integrity CI`) and run `python3 scripts/trust-benchmark.py` on `main` to verify 0 failing open PRs, 0 failing `main` workflows, and 0 open CodeQL alerts.
