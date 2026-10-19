---
name: tdd-workflow
description: Test-Driven Development (TDD) cycle enforcing Red -> Green -> Refactor for bug fixes and new behavior. Use when fixing a bug or adding behavior in backend/ or qc/. Not for pure CSS styling or static text tweaks.
---

# Test-Driven Development (TDD) Standard Operating Procedure

> **Rule:** No code modification for functional logic is permitted without an existing or newly authored failing test (`Red`).

---

## 1. The Red -> Green -> Refactor Cycle

```
1. RED: Write failing test -> Run -> Capture failure output
2. GREEN: Write minimal code -> Run -> Verify test passes (100%)
3. REFACTOR: Clean code & layers -> Verify zero regressions
```

### Phase 1: RED (Test First & Prove Defect)
1. Write a minimal, deterministic unit or integration test in:
   - Backend: `backend/tests/test_<domain>_<feature>.py`
   - QC: `qc/tests/e2e/<spec>.spec.ts`
2. Run the test before modifying application code. Capture the failure log proving the issue exists.

### Phase 2: GREEN (Minimal Sane Fix)
1. Implement the minimal code required to satisfy the test.
2. Re-run test and verify it passes with exit code 0.

### Phase 3: REFACTOR
1. Clean code according to layered architecture standards without altering behavior.
2. Run the full test suite to guarantee regression containment.

---

## 2. Test Quality & Fix-by-Invariant Rules (`no-mistakes` Standard)
1. **Zero Source-Content-Only Grep Tests:** Functional tests in `backend/tests/` and `qc/tests/` must execute real endpoints, services, or browser flows and assert observable state/output (`scripts/trust-benchmark.py`). Never write a functional test whose only check is reading `.py`/`.tsx` source text.
2. **Independent Oracle:** Expected values must come from the specification or independent contract, never copied from the implementation's own formula.
3. **Fix by Invariant & Dead-Code Sweep:** Before fixing a bug, state the violated invariant and fix all sibling call sites in the changed area in one pass; remove any helper, alias, or branch made unreachable by the fix.

---

## 3. Visual / Static Styling Exception
Pure CSS styling, layout adjustments, and static text tweaks are exempt from the strict Red-first unit test requirement. For these changes, run `cd qc && bun run test:visual` (which records always-on screenshot + `.webm` video evidence) or inspect the live browser page as empirical proof.

---

## 4. DoD Compliance
Before declaring completion, ensure deliverable passes all gates in `definition-of-done`:
```bash
backend/.venv/bin/pytest backend/tests/ -v
cd frontend && bun x tsc --noEmit
python3 scripts/lint-skills.py --quiet && python3 scripts/trust-benchmark.py
```
