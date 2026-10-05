---
name: belooga-senior-agile-workflow
description: Standard operating procedure for autonomous AI coding agents acting as Senior Engineers following Agile and Kanban methodologies. Enforces task planning, story point breakdown, git feature branching, TDD, GitHub Pull Requests, adversarial code review, and verified merges. Use when starting any non-trivial feature, refactoring, planning sprints, or delivering tasks like a true Senior Developer. Not for quick trivial one-line typo fixes.
---

# Senior Agile / Kanban Engineering Delivery Protocol

> **Core Philosophy:** A true Senior Engineer never writes code in isolation or pushes unreviewed changes to `main`. Every task follows structured Agile planning, testable Acceptance Criteria, git feature branching, Pull Request review, and rigorous verification gates.

---

## 1. Phase 1: Agile Planning & Task Breakdown

Before modifying a single line of code, decompose the requirement into engineering tickets:

1. **Ticket Specification:**
   - **Identifier:** `BEL-<number>` (sequential ID).
   - **Pod Assignee:** Specialized agent persona:
     * `@be-senior`: Backend API, SQLAlchemy async queries, migrations, business logic.
     * `@fe-lead`: Next.js App Router, React 19 UI, Tailwind CSS, Zustand client store.
     * `@qc-lead`: Playwright E2E automation, visual regressions, edge case specs.
     * `@des-lead`: Wireframes, layouts, UX flow, and design tokens.
     * `@ops-lead`: CI/CD, Nginx, Docker, environment configs, monitoring.
   - **Estimation:** Fibonacci story points (1, 2, 3, 5, 8, 13).
   - **Acceptance Criteria (AC):** Minimum 2 explicit, testable criteria.
   - **Evidence Command:** Concrete CLI test command that proves completion.

2. **Sync with Agent Mission Control:**
   - Use the standalone task engine at `../beloga-agent-kanban` via CLI:
     ```bash
     cd ../beloga-agent-kanban && bun run agent create --title "..." --assignee "@be-senior" --points 3
     ```
   - Move ticket to `IN_PROGRESS` when starting:
     ```bash
     bun run agent update BEL-xxx --status IN_PROGRESS --branch feature/BEL-xxx-slug
     ```

---

## 2. Phase 2: Git Feature Branching Strategy

1. **Isolation Invariant:**
   - **Never** develop directly on `main`.
   - Branch naming format: `feature/BEL-<id>-<kebab-case-slug>` (e.g. `feature/BEL-103-momo-qr`).
2. **Branch Creation Command:**
   ```bash
   git checkout main && git pull origin main
   git checkout -b feature/BEL-103-momo-qr
   ```

---

## 3. Phase 3: Test-Driven Development (TDD Cycle)

Strictly adhere to `.agents/skills/tdd-workflow/SKILL.md`:
1. **Red:** Write unit or integration tests that assert the Acceptance Criteria. Run tests and verify failure.
2. **Green:** Implement minimal production code to satisfy the tests.
3. **Refactor:** Clean architecture, extract helpers, respect file limit (<300 lines), without breaking tests.

---

## 4. Phase 4: GitHub Pull Request & Evidence

Once all ACs are satisfied locally:
1. **Local Pre-Flight Checks:**
   ```bash
   # 1. Backend tests
   backend/.venv/bin/pytest backend/tests/ -v
   # 2. Frontend typecheck
   cd frontend && bun x tsc --noEmit
   # 3. SSOT truth & Quality ratchet
   bash scripts/audit-truth.sh
   ```
2. **Push & Open Pull Request:**
   ```bash
   git push -u origin feature/BEL-103-momo-qr
   gh pr create --title "feat(payments): BEL-103 integrate MoMo QR checkout" --body "..."
   ```
3. **PR Description Template:**
   - **Context & Objective:** Why this change was made.
   - **Acceptance Criteria Checklist:** `[x]` checked for all met criteria.
   - **Empirical Evidence:** Exact command output with 0 errors.

---

## 5. Phase 5: Adversarial Review, Approval & Merge

1. **Review Checklist:**
   - IDOR guards present on user mutations (`current_user.id == target_id`).
   - Zero blocking I/O calls inside async functions (`asyncio.to_thread` for files/PDF).
   - No unindexed fallback queries (`OR ILIKE` prohibited per ADR-005).
   - Zero regression in `.agents/ratchet.json`.
2. **Merge Protocol:**
   - Squash and merge into `main`:
     ```bash
     gh pr merge --squash --delete-branch
     # Or git merge on main:
     git checkout main && git merge --squash feature/BEL-103-momo-qr && git push origin main
     ```
3. **Mark Done in Mission Control:**
   ```bash
   cd ../beloga-agent-kanban && bun run agent update BEL-xxx --status DONE --pr https://github.com/...
   ```
