---
name: be-code-review
description: Adversarial review of backend diffs before merge. Use when asked to review a backend PR or diff, or at ROUTER step 4. Not for writing code.
---

# Backend Code Review Protocol

> **Purpose:** Strict adversarial code review of backend pull requests and diffs prior to merging into main.

## Blocking Gates (Must REJECT if violated)
1. **Zero SQL in Routers:** Routers must strictly delegate to services. `be_sql_in_routers` must equal 0.
2. **Mandatory Ownership & IDOR Guards:** Every mutating endpoint must authenticate user and verify profile ownership.
3. **No Blocking I/O in Async Event Loop:** Direct calls to `open()`, `shutil`, `remove()` inside async handlers are strictly forbidden; use `asyncio.to_thread`.
4. **No Unindexed Search Fallbacks:** Combining `search_vector @@` with `OR ILIKE` violates ADR-005.
5. **No Fake Stubs / Mock Data:** Handlers must never return static hardcoded mock data to simulate persistence.

## Adversarial Review Methodology (`no-mistakes` Protocol)
1. **Independent Reviewer Session:** Author $\neq$ Reviewer $\neq$ Fixer. Review must execute in a fresh subagent context against `git diff` and stated Intent; a Reviewer never certifies its own fix without a fresh pass.
2. **Fix by Invariant (Sibling-Site Sweep):** When reporting or fixing a defect, state the violated invariant in one sentence and enumerate every sibling endpoint, service method, or state transition (`file:line`) in the changed area where that invariant must also hold.
3. **Simplification Pass:** Enumerate every newly introduced branch, fallback, helper, or config flag. If not strictly required by user intent, flag for removal rather than hardening.

## Ratchet Gates (Metrics must not worsen)
- `be_routes_without_response_model` must not increase beyond recorded baseline.
- `be_type_ignore` must not increase.

## Review Sign-off Template
APPROVE only when:
- Backend test suite passes: `backend/.venv/bin/pytest backend/tests/ -v`
- Ratchet & Trust check passes: `python3 scripts/ratchet.py && python3 scripts/trust-benchmark.py`
Output the literal test execution and ratchet output in the review sign-off.
