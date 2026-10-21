---
name: definition-of-done
description: Mandatory 6-step quality and knowledge-sync gate required before committing or reporting task completion.
---

# Workflow: Definition of Done (DoD)

Execute this workflow before declaring any feature or bug fix complete. Detailed contract: `.agents/skills/definition-of-done/SKILL.md`.

## Step 1: Synchronize Single Source of Truth & Skill Facts
```bash
python3 scripts/generate-current-state.py --allow-dirty
python3 scripts/render-skill-facts.py --write
```
Ensure `CURRENT_STATE.md` and `<!-- AUTO:BEGIN -->` blocks in `.agents/skills/*/SKILL.md` reflect all endpoint, schema, and route changes.

## Step 2: Run Anti-Deception & Trust Benchmark
```bash
python3 scripts/trust-benchmark.py
```
Must achieve **100% Trust Score (0 violations across all 6 axes)**.

## Step 3: Run SSOT Ground Truth Auditor
```bash
bash scripts/audit-truth.sh
```
All verification gates (DB schema, AST IDOR, async non-blocking, pytest, tsc, skill lint, ratchet) must report green.

## Step 4: Lock In Ratchet Improvements (If Metrics Improved)
```bash
python3 scripts/ratchet.py
```
If any metric prints `better`, lock in the lower baseline via `python3 scripts/ratchet.py --update`.

## Step 5: Visual Verification (If UI was modified)
- Inspect the affected route in browser.
- Verify against legacy source at `$LEGACY_DIR` (default: `../Beloga-CV`).
- Ensure zero class collision or global CSS pollution.

## Step 6: Update `.agents/STATE.md`, Create Pull Request, Watch Remote CI & Verify Post-Merge Health
```bash
git status
git push -u origin <feature-branch>
gh pr create --title "..." --body "..."
gh pr checks --watch
gh pr merge --squash --delete-branch
python3 scripts/trust-benchmark.py
```
Mark completed items `[x]` in `.agents/STATE.md`, push to a feature/fix branch (never push directly to `main`), open a Pull Request, and wait until `gh pr checks --watch` reports 100% green before running `gh pr merge --squash --delete-branch`. After merging to `main`, wait for post-merge workflows (`CodeQL Security & Quality` and `Belooga SSOT & Integrity CI`) and run `python3 scripts/trust-benchmark.py` on `main` to verify 0 failing open PRs, 0 failing `main` workflows, and 0 open CodeQL alerts.
