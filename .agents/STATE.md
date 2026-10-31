# Active Working Memory (.agents/STATE.md)

🎯 Đang làm ticket: [BEL-246] (#255) — Apply System Design Primer (BE) & Primer 3-Tier Design Token SSOT (FE/Mobile) | Role: Architect / Full-Stack | Cột: In Progress

## Hypothesis & Architectural Scope
1. **Backend (`donnemartin/system-design-primer`):**
   - **Read/Write Replica Routing:** Add `DATABASE_READ_URL` in `backend/app/core/config.py` + `.env.example`, `read_engine` & `get_read_db()` in `backend/app/core/database.py` (falling back to `get_db` when `DATABASE_READ_URL` is unset or overridden in tests), and wire read-heavy endpoints (`search.py`, `catalogs.py`).
   - **Distributed L1 Cache Invalidation & Half-Open Circuit Breaker:** Add Redis Pub/Sub invalidation (`belooga:cache:inval`, `apply_remote_invalidation`) and `circuit_state` (`CLOSED` -> `OPEN` -> `HALF_OPEN` -> `CLOSED`) in `backend/app/core/cache.py` & `backend/app/core/gateway.py`.
2. **Frontend & Mobile (`primer/primitives` & `primer/react`):**
   - **3-Tier W3C Design Token SSOT (`tokens/design-tokens.json`):** `base` -> `semantic` (`light`, `dark`, `neumorphic` with `surface`, `brand`, `typography`, `status`) -> `component`, synced and verified across `frontend/src/app/globals.css`, `frontend/src/lib/design-tokens.ts`, and `mobile/src/theme/tokens.ts` via `scripts/sync-design-tokens.py --check`.

## Execution Checklist
- [x] RED: Write failing tests in `backend/tests/test_bel246_primer_system_and_design_tokens.py` & `frontend/src/__tests__/design-tokens.test.ts`
- [x] Verify RED: Run `pytest` and `bun test` and confirm expected failures
- [x] GREEN (BE): Implement `get_read_db`, L1 Pub/Sub invalidation, and `circuit_state` in `database.py`, `cache.py`, `gateway.py`
- [x] GREEN (FE/Mobile): Create `tokens/design-tokens.json`, `scripts/sync-design-tokens.py`, `frontend/src/lib/design-tokens.ts`, update `globals.css` & `mobile/src/theme/tokens.ts`, lock in `scripts/trust-benchmark.py`
- [x] Verify GREEN + Full DoD + PR Merge & Close #255
