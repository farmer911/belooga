---
name: definition-of-done
description: Authoritative Enterprise Definition of Done (DoD) Contract & Quality Gate for All Software Engineering Deliverables. Enforces non-negotiable criteria across Architecture, Complexity, Resilience, Database Migrations, Test Pyramid, Observability, and Dual-Key Reviewer Sign-Off.
---

# 🏁 ENTERPRISE DEFINITION OF DONE (DoD) QUALITY CONTRACT

> **Authority:** Principal Software Architect & Chief Technology Officer  
> **Status:** MANDATORY & STRICTLY ENFORCED ACROSS ALL TASKS, PRs, AND AUTONOMOUS AGENTS  
> **Standard:** BINARY PASS/FAIL GATE (0 or 1). There is no "almost done" or "partial completion". A task is either 100% compliant with this contract or REJECTED.

---

## 1. THE DEFINITION OF DONE MANDATE

No feature, refactoring, bug fix, or technical improvement may be marked as "DONE" or submitted for final merge unless every single gate in the **7-Tier DoD Pyramid** is satisfied with empirical, verifiable evidence.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 7-TIER DEFINITION OF DONE (DoD)                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Architecture DoD: Clean 4-Layer BE, Atomic Design FE, Adapter DTOs  │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Complexity DoD: Cyclomatic ≤ 10, Big-O O(log N), 0 N+1, Frame 16.6ms│
├────────────────────────────────────────────────────────────────────────┤
│ 3. Resilience DoD: error.tsx, loading.tsx, IDOR guards, .env.example   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Database DoD: Alembic migration (forward upgrade + clean downgrade) │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Test Pyramid DoD: Unit/Integration tests + Playwright E2E (Exit: 0) │
├────────────────────────────────────────────────────────────────────────┤
│ 6. Observability DoD: X-Request-ID trace, Genuine /health probe        │
├────────────────────────────────────────────────────────────────────────┤
│ 7. Reviewer Sign-Off: Dual-Key FE & BE Reviewers emit formal APPROVAL  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. LAYER 1: ARCHITECTURAL PURITY & DESIGN PATTERNS

- [ ] **Backend 4-Layer Purity:**
  - Routers contain **zero SQL queries** and **zero business logic**. Execution is 100% delegated to Domain Services.
  - Multi-table mutations and sequence reordering execute within an atomic **Unit of Work** transaction.
  - All mutating endpoints require strict Pydantic v2 `response_model` annotations.
- [ ] **Frontend Atomic Hierarchy:**
  - Route pages (`page.tsx`) are pure orchestrators strictly under **100 LOC** (zero inline layout DOM, zero raw SVG/div soup).
  - Organisms remain strictly under **300 LOC**.
  - High-frequency telemetry (audio meter, video progress) is isolated in dedicated Leaf Nodes; parent re-renders equal **0**.
- [ ] **Data Normalization via Adapter:**
  - Raw backend `snake_case` DTOs are mapped through a dedicated **Adapter** into UI `camelCase` ViewModels with deterministic fallbacks before reaching presentation components.

---

## 3. LAYER 2: COMPUTATIONAL COMPLEXITY & PERFORMANCE BUDGETS

- [ ] **Algorithmic Complexity & Big-O:**
  - All database queries against tables exceeding 1,000 rows resolve to $O(1)$ or $O(\log N)$ or $O(k \log N)$ (GIN Index).
  - Verified via `EXPLAIN (ANALYZE, BUFFERS)`: **Zero sequential table scans (`Seq Scan`)** on indexed production tables.
- [ ] **Anti-N+1 Query Invariant:**
  - Zero lazy relationship queries inside loops.
  - One-to-Many / Many-to-Many relations use `selectinload()`; One-to-One relations use `joinedload()`.
- [ ] **Database Lock Duration Budget:**
  - Pessimistic row locks (`SELECT FOR UPDATE`) are held for **$< 50\text{ms}$**. Zero external HTTP calls or disk writes while holding a database lock.
- [ ] **Cyclomatic Complexity Limit:**
  - Maximum cyclomatic complexity per method is $\le 10$.
  - Zero nested `if-else` staircases ($\ge 3$ levels); code is flattened using **Guard Clauses (Early Returns)**.
- [ ] **Frontend Frame Budget (16.6ms) & Long Tasks:**
  - Canvas telemetry painting executes inside a 16.6ms frame budget via `requestAnimationFrame`.
  - Zero synchronous JavaScript executions on the browser main thread exceed **50ms** (INP $\le 200\text{ms}$).
  - Zero nested `.filter().map()` loops inside JSX render blocks ($O(1)$ Hash Map lookups mandatory).

---

## 4. LAYER 3: CLIENT RESILIENCE, SECURITY & ERROR BOUNDARIES

- [ ] **Error Boundaries:**
  - Next.js route has an `error.tsx` component implementing an isolated fallback UI with recovery actions (`reset()`), preventing white-screen crashes.
- [ ] **Suspense & Streaming Skeletons:**
  - Next.js route has a `loading.tsx` component rendering accessible skeleton placeholders during data fetching.
- [ ] **IDOR Authorization Guards:**
  - Every mutating endpoint strictly verifies ownership (`current_user.id == target_entity.identity_id`) via a FastAPI dependency.
- [ ] **Environment Contract:**
  - Any newly introduced environment variable is documented in `.env.example` with clear descriptions and non-secret defaults.

---

## 5. LAYER 4: DATABASE MIGRATION INTEGRITY (ALEMBIC)

- [ ] **Migration Scripts:**
  - Any relational schema change is captured in a dedicated Alembic revision script in `backend/alembic/versions/`.
  - Direct schema mutation via raw SQL scripts or unversioned manual commands is strictly forbidden.
- [ ] **Two-Way Verification:**
  - Forward migration verified: `alembic upgrade head` executes with exit code `0`.
  - Backward rollback verified: `alembic downgrade -1` executes cleanly without orphan constraints, followed by a re-upgrade to `head`.

---

## 6. LAYER 5: TESTING PYRAMID & ZERO-FLAKINESS INVARIANTS

- [ ] **Unit & Service Testing:**
  - New domain business logic, adapters, and repositories are covered by deterministic Unit / Integration tests (`pytest` for BE, `vitest` for FE).
- [ ] **E2E Playwright Suite:**
  - Full E2E test suite executes cleanly with exit code `0`: `cd qc && bun run test`.
- [ ] **Zero-Sleep Invariant:**
  - Exactly **zero occurrences of `page.waitForTimeout()`**, `time.sleep()`, or arbitrary thread pauses exist in test code.
  - All assertions use Web-First auto-waiting locators (`expect(locator).toBeVisible({ timeout: 5000 })`).
- [ ] **Selector Determinism:**
  - 100% of user interaction targets use dedicated `data-testid` attributes. Zero brittle CSS paths or Tailwind class locators.

---

## 7. LAYER 6: OBSERVABILITY, AUDIT & HEALTH PROBES

- [ ] **Genuine Health Probes:**
  - The `/health` endpoint actively verifies live connectivity to PostgreSQL (`SELECT 1`) and Redis (`PING`), returning HTTP 503 if any dependency is degraded.
- [ ] **Distributed Request Tracing:**
  - Outgoing and incoming requests propagate the `X-Request-ID` header.
  - Server logs format messages as structured JSON containing `request_id`, `latency_ms`, and `endpoint`.

---

## 8. LAYER 7: DUAL-KEY REVIEWER APPROVAL & PROOF BLOCK

A task is officially complete ONLY when both independent Reviewers issue formal approval and the final proof block is emitted:

```markdown
### 📋 EMPIRICAL DEFINITION OF DONE SIGN-OFF BLOCK

1. **Task Title / Scope:** [Feature / Bugfix / Refactoring Name]
2. **Architecture Compliance:** PASS (Clean 4-Layer / Atomic Design)
3. **Complexity Compliance:** PASS (Cyclomatic ≤ 10, O(log N) Queries, 60fps Frame Budget)
4. **Resilience Compliance:** PASS (error.tsx, loading.tsx, IDOR Guards, .env.example)
5. **Database Migration:** PASS (Alembic upgrade & downgrade verified)
6. **Automated Test Results:**
   - Unit Tests: PASS (Exit Code: 0)
   - E2E Tests: PASS (Exit Code: 0, 0 waitForTimeout)
7. **Typecheck & Linter Proof:**
   - Frontend: `bun x tsc --noEmit` -> Exit Code: 0
   - Backend: `ruff check .` -> Exit Code: 0
8. **Dual-Key Reviewer Sign-Off:**
   - Senior Frontend Lead Reviewer: **APPROVED**
   - Principal Backend Lead Reviewer: **APPROVED**
```
