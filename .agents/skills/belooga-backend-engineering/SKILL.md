---
name: belooga-backend-engineering
description: Technical architecture and engineering guide for Belooga Backend (FastAPI, Python 3.12+, SQLAlchemy 2.0 Async, PostgreSQL 16). Use when developing backend features across multiple domains or understanding system-wide backend invariants.
---

# Belooga Backend Engineering Guide

## Current Reality (AS-IS)
- **Framework & Runtime:** FastAPI on Python 3.12+ with `asyncpg` and SQLAlchemy 2.0 Async.
- **Active Layout:** All 36 domain endpoints + 2 root probes are in `backend/app/api/v1/endpoints/`:
  - `auth.py` (Domain 1: Identity & Sessions)
  - `profile.py` (Domain 2: Candidate Profiles & Skills)
  - `timeline.py` (Domain 3: Career Timeline & Display Order)
  - `media.py` (Domain 4: Chunked Video Uploads & PDF Generation)
  - `search.py` (Domain 6: TSVECTOR Full-Text Search)
  - `catalogs.py` (Domain 7: Master Taxonomies)
  - `cms.py` (Domain 8: Contact Inquiries, FAQs, Moderation)
- **Database Schema:** 24 tables in `backend/initdb.sql`. Full table list: see `CURRENT_STATE.md §1` (do not duplicate here).
- **Session Execution:** Endpoints execute queries directly via `db: AsyncSession = Depends(get_db)` and raw `text(...)`. No separate service or repository layer currently exists.

## Core Architectural Invariants
1. **Non-blocking Event Loop (ADR-006):** Any synchronous or CPU-intensive task (ReportLab `doc.build()`, `shutil.rmtree()`, chunk reassembly) must execute in worker threads via `asyncio.to_thread`.
2. **PostgreSQL GIN Search (ADR-005):** Search queries must execute against `candidate_profiles.search_vector` via `plainto_tsquery('english', :q)`. Never mix with `OR ILIKE`.
3. **IDOR & Ownership Guards:** All user mutations require `Depends(get_current_user)` and `verify_profile_owner(clean_username, current_user)`.
4. **Pessimistic Concurrency Locking:** Reorder operations and token family rotations must acquire row-level locks via `SELECT ... FOR UPDATE` and conclude with an explicit `await db.commit()`.

## Infrastructure Configuration
- PostgreSQL: Host port `5433` (mapped from container `5432` to avoid host PostgreSQL conflict).
- Redis: Host port `6379`.
- Backend API: Port `8000` (`http://localhost:8000/docs` for Swagger UI).

## Self-Verification
- `backend/.venv/bin/pytest backend/tests/ -v`
- `bash scripts/audit-truth.sh`
