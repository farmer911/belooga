# 🏛️ BELOOGA ARCHITECTURE DECISION RECORDS (ADR LOG)

> **Authority:** Principal Software Architect & Chief Technology Officer  
> **Status:** ACTIVE & MANDATORY REFERENCE FOR ALL ENGINEERS AND AGENTS  
> **Purpose:** Document the architectural rationale, context, tradeoffs, and invariants for core technology choices to prevent architectural drift, speculative refactoring, and library churn.

---

## ADR-001: Selection of Bun over Node.js for Frontend & QC Tooling

* **Context:** The frontend and E2E test suite require package management, TypeScript execution, and fast CI turnaround times.
* **Decision:** Standardize on **Bun** as the primary package manager and runtime executor for `frontend/` and `qc/`.
* **Rationale:**
  1. **Execution Velocity:** Bun installs dependencies 4–10x faster than npm/pnpm, significantly cutting CI container boot times.
  2. **Native TypeScript & JSX Execution:** Eliminates redundant transpilation steps during script execution (`bun x tsc`, `bun test`).
  3. **Deterministic Lockfile:** `bun.lock` provides reproducible hermetic dependency graphs.
* **Consequences:**
  * All script invocations must use `bun run`, `bun install`, `bun test`.
  * Node.js/npm commands are strictly forbidden in CI workflows.

---

## ADR-002: Next.js 14+ App Router & Server/Client Segregation

* **Context:** Belooga requires SEO-indexed public discovery pages (Talent Search, Public Profiles, CMS) combined with highly interactive private workspaces (WebRTC Studio, Drag-and-Drop Timeline).
* **Decision:** Adopt **Next.js App Router** with strict Server Component (RSC) and Client Component (`"use client"`) segregation.
* **Rationale:**
  1. **Bundle Size Minimization:** Public marketing and CMS routes remain zero-bundle-size React Server Components.
  2. **Streaming & Suspense:** Native support for `loading.tsx` and `error.tsx` route boundaries prevents full-page crash cascades.
  3. **SEO Performance:** Public profiles render pre-computed semantic HTML with OpenGraph meta tags for candidate social sharing.
* **Consequences:**
  * Interactive widgets must declare `"use client"` at the lowest possible leaf node. Root page shells must remain pure orchestrators.

---

## ADR-003: FastAPI & Python 3.12+ Async for Modular Monolith Backend

* **Context:** The backend powers real-time WebRTC uploads, PDF resume compilation, Argon2id authentication, and candidate discovery.
* **Decision:** Use **FastAPI with Python 3.12+ Async (Uvicorn / AnyIO)** structured as a Modular Monolith.
* **Rationale:**
  1. **Async High Concurrency:** Asyncio event loop handles thousands of concurrent I/O-bound connections (chunk uploads, search queries).
  2. **Strict Type Safety:** Pydantic v2 schemas provide compile-time request validation and automatic OpenAPI contract generation.
  3. **Python Ecosystem:** Direct integration with ReportLab (PDF compilation) and NumPy/AI tooling without multi-process microservice overhead.
* **Consequences:**
  * Any synchronous CPU-bound task (ReportLab, FFmpeg) must be offloaded via `anyio.to_thread.run_sync` or background processes.

---

## ADR-004: SQLAlchemy 2.0 Async Mapped Models & Unit of Work

* **Context:** The database schema encompasses 19 relational tables with complex constraints, sequence ordering (`display_order`), and audit histories.
* **Decision:** Standardize on **SQLAlchemy 2.0 Async (`asyncpg`)** using declarative mapped models, Repositories, and Unit of Work.
* **Rationale:**
  1. **Type-Safe ORM:** SQLAlchemy 2.0 provides static typing (`Mapped[uuid.UUID]`, `mapped_column()`) preventing runtime column mismatch bugs.
  2. **Pessimistic Locking Support:** First-class support for `.with_for_update()`, enabling atomic sequence reordering without lost updates.
  3. **Connection Pooling Safety:** Explicit session lifecycles (`expire_on_commit=False`) prevent connection leaks under high concurrent traffic.
* **Consequences:**
  * Raw SQL queries inside routers are strictly prohibited. All queries must flow through Repositories.

---

## ADR-005: PostgreSQL 16 TSVECTOR with GIN Index over External Search Engine

* **Context:** Belooga requires talent discovery and autocomplete search across candidates' names, headlines, bios, and skills.
* **Decision:** Utilize **PostgreSQL 16 native `tsvector` with GIN Indexes and `pg_trgm`**, rejecting external search clusters (Elasticsearch / Typesense) for Phase 1.
* **Rationale:**
  1. **Zero Dual-Write Synchronization Lag:** Candidate profile updates instantly reflect in the search index within the same database transaction.
  2. **Operational Simplicity:** Eliminates the infrastructure cost, networking latency, and failure modes of managing a separate Elasticsearch cluster.
  3. **High Throughput:** GIN indexes with `ts_rank_cd` easily sustain sub-10ms search queries across hundreds of thousands of candidate profiles.
* **Consequences:**
  * Queries must never combine `search_vector @@ ...` with `OR ILIKE '%...%'`, which disables the GIN index scan.

---

## ADR-006: ReportLab Python Canvas over Headless Browser for PDF Resumes

* **Context:** Candidates require high-fidelity, printable PDF resumes generated on demand from their profile data.
* **Decision:** Implement **ReportLab Platypus Engine** natively in Python, rejecting headless browser rendering (Puppeteer / Playwright).
* **Rationale:**
  1. **Memory Footprint:** ReportLab compiles PDFs in $< 50\text{ms}$ consuming $< 15\text{MB}$ RAM. Spawning a headless Chromium browser requires $> 200\text{MB}$ RAM per instance and takes $> 1,500\text{ms}$.
  2. **Container Portability:** ReportLab requires zero external browser binaries or heavy OS graphics dependencies in the Docker container.
  3. **Print-Perfect Geometry:** Exact point-based typography, margins, and page breaks without CSS print media query inconsistencies.
* **Consequences:**
  * PDF generation must be executed inside `anyio.to_thread.run_sync` to prevent blocking Uvicorn's event loop thread.
