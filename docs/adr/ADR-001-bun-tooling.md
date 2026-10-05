# ADR-001: Selection of Bun over Node.js for Frontend & QC Tooling

* **Status:** Accepted
* **Context:** The frontend and E2E test suite require package management, TypeScript execution, and fast CI turnaround times.
* **Decision:** Standardize on **Bun** as the primary package manager and runtime executor for `frontend/` and `qc/`.
* **Rationale:**
  1. **Execution Velocity:** Bun installs dependencies 4–10x faster than npm/pnpm, significantly cutting CI container boot times.
  2. **Native TypeScript & JSX Execution:** Eliminates redundant transpilation steps during script execution (`bun x tsc`, `bun test`).
  3. **Deterministic Lockfile:** `bun.lock` provides reproducible hermetic dependency graphs.
* **Consequences:**
  * All script invocations must use `bun run`, `bun install`, `bun test`.
  * Node.js/npm commands are strictly forbidden in CI workflows.
