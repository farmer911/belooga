---
name: clean-architecture
description: Clean Architecture, Layered System Design, Atomic Design, and Component Modularization Standards for Belooga. Enforces thin controllers, service layers, repository patterns, ORM models, Alembic migrations, atomic UI primitives, custom hooks, and strict file size limits (< 300 lines).
---

# Belooga Clean Architecture & Engineering Standards

## 1. Architectural Mandates

This standard governs the structural quality, maintainability, and modularity of both Backend and Frontend codebases in Belooga. Every change, refactor, and new feature must adhere to these layering principles.

### Core Non-Negotiables
1. **File Size Invariant:** No single source code file may exceed 300 lines. Any file approaching 250 lines must be split into sub-components, custom hooks, or service modules.
2. **Separation of Concerns:** Business logic, data persistence, HTTP transport, and UI rendering must live in strictly isolated architectural layers.
3. **Zero Untested Code:** Every layer refactoring must preserve 100% test passing across backend pytest integration tests and frontend Playwright E2E suites.

---

## 2. Backend Clean Architecture (FastAPI + SQLAlchemy + Alembic)

The backend follows the Classic 4-Tier Layered Clean Architecture:

### A. Router Layer (Thin Controllers) - app/api/v1/endpoints/
- Responsibilities:
  - Route declaration and HTTP method specification.
  - Dependency injection for authentication (current_user = Depends(get_current_user)).
  - Request DTO parsing and validation via Pydantic schemas.
  - Invoking the corresponding Service method.
  - Returning the appropriate HTTP response model and status code.
- Strict Prohibition: Routers must NEVER contain business workflows, raw SQL statements, or direct transaction commits.

### B. Service Layer (Business Domain) - app/services/
- Responsibilities:
  - Domain workflows, business invariant validations, authorization and ownership checks.
  - Multi-step transaction coordination (commit, rollback).
  - Heavy or blocking calculations (e.g. PDF generation, chunk reassembly) delegated via asyncio.to_thread.
- Encapsulation: Services depend on Repositories for data access.

### C. Repository Layer (Data Access) - app/repositories/
- Responsibilities:
  - Encapsulated database queries, inserts, updates, and deletes.
  - Concurrency control and pessimistic row locks (SELECT ... FOR UPDATE).
  - Conversion between SQLAlchemy ORM models and database records.

### D. Models & Migrations - app/models/ and alembic/
- **SQLAlchemy 2.0 Async Models:** All database tables must have declared ORM classes inheriting from Base.
- **Alembic Migrations:** All database schema modifications must be recorded and managed via numbered migration revisions in alembic/versions/.

### E. Schemas / Data Transfer Objects - app/schemas/
- All endpoint inputs and outputs must have typed Pydantic v2 schemas.
- Strict separation between Request schemas (input validation) and Response schemas (serialization).

---

## 3. Frontend Architecture (Next.js 16 + React 19 + Atomic Design)

The frontend adheres to Atomic Design principles and decoupled state management:

### A. Atoms - components/ui/
- Single-purpose, headless or styled primitive UI elements.
- Examples: Button, Input, Textarea, Badge, Avatar, Dialog (Modal Base), Card, Spinner, Skeleton.
- Invariant: Zero business logic, purely driven by props.

### B. Molecules - components/common/
- Combinations of atoms forming simple reusable functional units.
- Examples: FormField (Label + Input + Error), ConfirmDialog, SkillBadge, SearchInput.

### C. Organisms - components/features/
- Complex, self-contained UI sections combining molecules and atoms.
- Examples: ProfileHeaderCard, VideoPitchCard, VideoPitchModal, TimelineSection, WebRTCStudioModal.
- Shared Organisms: Components shared across pages (e.g. video player modal between workspace and public profile) must be placed in components/features/media/.

### D. Custom Hooks - hooks/
- Encapsulate all stateful workflows, side-effects, timers, and browser APIs.
- Examples: useVideoPlayer, useWebRTCStudio, useTimelineDnD, useCandidateProfile.
- Invariant: Modals and complex widgets must delegate their state management to custom hooks to prevent parent component re-render cascading.

### E. Pages & Templates - app/
- Route files (page.tsx) act as thin composition templates (< 150 lines).
- Heavy interactive features (such as WebRTC studio, recording canvas, teleprompter) must be loaded dynamically via next/dynamic with ssr: false to ensure optimal initial load performance.

---

## 4. Verification & Quality Gates

Every refactoring step must be verified with:
- bash scripts/audit-truth.sh
- backend/.venv/bin/pytest backend/tests/
- cd frontend && bun x tsc --noEmit
- cd qc && bun run test:e2e
