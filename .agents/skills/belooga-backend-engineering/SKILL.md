---
name: belooga-backend-engineering
description: Technical architecture and engineering guide for Belooga Backend (FastAPI, Python 3.12+, SQLAlchemy 2.0 Async, PostgreSQL 16). Use when developing backend features across multiple domains or understanding system-wide backend invariants. Not for frontend components (belooga-frontend-engineering) or writing tests (tdd-workflow).
---

# Belooga Backend Engineering Architecture

> **Architecture:** Modular Monolith using FastAPI, SQLAlchemy 2.0 Async (`asyncpg`), Alembic, and PostgreSQL 16.

---

## 1. Clean 4-Layer Backend Architecture
- **Routers (`app/api/v1/endpoints/`):** Thin controllers handling HTTP request parsing, auth injection (`get_current_user`), calling domain services, and returning Pydantic response models. Zero raw SQL or direct commits.
- **Services (`app/services/`):** Business logic, validation, ownership enforcement, transaction coordination, and non-blocking delegations (`asyncio.to_thread`).
- **Repositories (`app/repositories/`):** Encapsulated database operations, queries, and row-level locks (`with_for_update()`).
- **Models & Schemas:** Declarative ORM models in `app/models/`, Pydantic DTOs in `app/schemas/`, and migrations in `backend/alembic/versions/`. Active schema and endpoints: see `CURRENT_STATE.md`.

---

## 2. Domain Services Map

| Domain | Router & Service Scope | Domain Skill |
|---|---|---|
| **Identity & Sessions** | `auth.py`, `AuthService`, `IdentityRepository` | `be-service-auth` |
| **Candidate Profile** | `profile.py`, `ProfileService`, `ProfileRepository` | `be-service-profile` |
| **Career Timeline** | `timeline.py`, `TimelineService`, `TimelineRepository` | `be-service-timeline` |
| **Media & PDF** | `media.py`, `MediaService`, `PdfGenerator` | `be-service-media` |
| **Talent Search** | `search.py`, `CatalogsService`, `CatalogsRepository` | `be-service-search` |
| **Master Catalogs** | `catalogs.py`, `CatalogsService` | `be-service-catalogs` |
| **Public CMS & Abuse**| `cms.py`, `CmsService`, `CmsRepository` | `be-service-cms` |
| **Expert CV Review** | `expert_review.py`, `ExpertReviewService` | `be-service-expert-review` |

---

## 3. System-Wide Invariants
1. **Async Event Loop Non-Blocking:** All synchronous disk I/O, chunk reassembly, and ReportLab PDF builds (`doc.build()`) must execute via `asyncio.to_thread`.
2. **PostgreSQL GIN Search (ADR-005):** Full-text search must query `search_vector @@ plainto_tsquery('english', :q)`. Never mix with `OR ILIKE`.
3. **IDOR & Ownership Protection:** All mutation endpoints must authenticate caller and enforce `verify_profile_owner(current_user, target_username)`.
4. **Pessimistic Locking:** Timeline reorders and token family rotations must acquire row-level locks via `with_for_update()` and conclude with an explicit `await db.commit()`.

---

## 4. Self-Verification
```bash
backend/.venv/bin/pytest backend/tests/ -v
bash scripts/audit-truth.sh
python3 scripts/lint-skills.py --quiet
```
