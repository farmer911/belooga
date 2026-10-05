---
name: definition-of-done
description: Mandatory 6-step quality gate required before committing or reporting task completion.
---

# Workflow: Definition of Done (DoD)

Execute this workflow before declaring any feature or bug fix complete. Detailed contract: `.agents/skills/definition-of-done/SKILL.md`.

## Step 1: Regenerate Single Source of Truth
```bash
python3 scripts/generate-current-state.py --allow-dirty
```
Ensure `CURRENT_STATE.md` reflects all endpoint and route changes.

## Step 2: Run SSOT Ground Truth Auditor
```bash
bash scripts/audit-truth.sh
```
All verification gates must report green.

## Step 3: Run Backend Tests
```bash
backend/.venv/bin/pytest backend/tests/ -v
```
All integration and security tests must pass.

## Step 4: Run Frontend Typecheck
```bash
cd frontend && bun x tsc --noEmit
```
Must report 0 TypeScript errors.

## Step 5: Visual Verification (If UI was modified)
- Inspect the affected route in browser.
- Verify against legacy source at `$LEGACY_DIR` (default: `../Beloga-CV`).
- Ensure zero class collision or global CSS pollution.

## Step 6: Git Status Review
```bash
git status
```
Verify that no temporary scratch files, test dumps, or unintended edits remain uncommitted.
