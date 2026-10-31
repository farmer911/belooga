---
name: be-code-review
description: Adversarial review of backend diffs before merge. Use when asked to review a backend PR or diff, or at ROUTER step 4. Not for writing code.
---

# Backend Code Review Protocol (System Design Primer Enforced)

> **Purpose:** Strict adversarial code review of backend pull requests and diffs prior to merging into `main`, enforcing `donnemartin/system-design-primer` distributed resilience invariants.

## Blocking Gates (Must REJECT if violated)
1. **Zero SQL in Routers:** Routers in `backend/app/api/v1/endpoints/` must strictly delegate to `backend/app/modules/<domain>/`. `be_sql_in_routers` must equal `0`.
2. **Mandatory Ownership & IDOR Guards:** Every mutating endpoint must authenticate via `get_current_user` and verify resource ownership (zero anonymous `"alexnguyen"` fallback).
3. **No Blocking I/O in Async Event Loop:** Direct calls to `open()`, `shutil`, `remove()`, or `doc.build()` inside `async def` are strictly forbidden; use `asyncio.to_thread`.
4. **No Unindexed Search Fallbacks:** Combining `search_vector @@` with `OR ILIKE` violates ADR-005.
5. **Zero Runtime Seed Arrays, Synthetic Offsets & Demo Literals:** Reject any `CURATED_*`, `DEFAULT_*_SEEDS`, `SAMPLE_*` constant in `backend/app/modules/`, any hardcoded demo persona/company/salary default in `backend/app/schemas/`, or synthetic math offsets (`+ 148`, `total // 14`, `mult = 4.2`). Initial data belongs exclusively in `scripts/seed-data.py`.
6. **System Design Primer — Read/Write Replica Routing (`get_read_db` vs `get_db`):** Read-only catalog/discovery queries should use `get_read_db` (`DATABASE_READ_URL` in `backend/app/core/database.py`), while mutations MUST use primary `get_db`.
7. **System Design Primer — Cross-Pod L1 Cache Invalidation & Half-Open Circuit Breaker:** Mutations touching cached entities must call `invalidate_prefix` / `invalidate_candidate_cache` in `backend/app/core/cache.py` (publishing to Redis Pub/Sub for `apply_remote_invalidation`), and Redis failure handling in `backend/app/core/cache.py` and `backend/app/core/gateway.py` must preserve the `CLOSED -> OPEN -> HALF_OPEN -> CLOSED` `circuit_state` state machine.

## Rationalization Prevention Table & Red Flags

| Agent Excuse / Rationalization | Why It Is Wrong (Reality) | Mandatory Reviewer Action |
|---|---|---|
| "We need a fallback list in `service.py` in case the DB is empty." | Runtime fallback arrays hide broken migrations and violate SSOT. `scripts/seed-data.py` seeds all environments hermetically. | **REJECT** — Move seed rows to `scripts/seed-data.py`. |
| "Adding `+ 148` or `mult = 4.2` makes the analytics chart look populated." | Synthetic offsets corrupt executive BI and violate production data honesty. | **REJECT** — Query real SQL aggregates with `make_interval(days => CAST(:days AS int))`. |
| "Invalidating `self._l1` locally is enough; other pods will expire eventually." | Multi-replica deployments serve stale profile/catalog state across pods without Redis Pub/Sub broadcast. | **REJECT** — Require `invalidate_prefix` + `apply_remote_invalidation`. |
| "Using `get_db` everywhere is simpler than `get_read_db`." | High-QPS read endpoints (`catalogs`, `search`) saturate primary write connections under load. | **REJECT** if a read-replica route regressions to write session without reason. |

**Red Flags (Stop & Reject Immediately):**
- Any `*-part2.py` filename or renamed constant (`CURATED_*`, `PRESET_*`) attempting to evade `scripts/ratchet.py`.
- Any `except Exception: pass` or bare `except:` swallowing database/Redis errors without tripping `_trip_circuit`.

## Adversarial Review Methodology (`no-mistakes` Protocol)
1. **Independent Reviewer Session:** Author $\neq$ Reviewer $\neq$ Fixer. Review must execute in a fresh subagent context against `git diff` and stated Intent; a Reviewer never certifies its own fix without a fresh pass.
2. **Fix by Invariant (Sibling-Site Sweep):** When reporting or fixing a defect, state the violated invariant in one sentence and enumerate every sibling endpoint, service method, or state transition (`file:line`) in the changed area where that invariant must also hold.
3. **Simplification Pass:** Enumerate every newly introduced branch, fallback, helper, or config flag. If not strictly required by user intent, flag for removal rather than hardening.

## Ratchet Gates (Metrics must not worsen)
- `be_routes_without_response_model` must remain `0`.
- `be_type_ignore` must remain `0`.
- `be_files_over_300_lines` must remain `0`.
- `alembic_schema_drift` must remain `0`.

## Review Sign-off Template
APPROVE only when:
- Backend test suite passes: `backend/.venv/bin/pytest backend/tests/ -v`
- Ratchet, Design Token Sync & Trust check passes: `python3 scripts/ratchet.py && python3 scripts/sync-design-tokens.py --check && python3 scripts/trust-benchmark.py`
Output the literal test execution and ratchet output in the review sign-off.
