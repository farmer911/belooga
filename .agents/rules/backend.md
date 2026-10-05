---
trigger: glob: backend/**
description: Invariants and standards for Belooga FastAPI backend.
---

# Backend Rules (FastAPI + SQLAlchemy 2.0 Async)

1. **Async Event-Loop Safety:** Never call synchronous I/O directly in `async def`. Always delegate `open()`, `ReportLab doc.build()`, `shutil.rmtree()`, and file system writes to worker threads via `asyncio.to_thread`.
2. **IDOR & Ownership Protection:** All mutation endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) operating on user resources MUST enforce `current_user: AuthenticatedUser = Depends(get_current_user)` and `verify_profile_owner(current_user, target_username)`. Never deduce candidate identity from email strings.
3. **Database Concurrency & Locking:** For reordering operations or token sessions, always acquire row-level locks via `SELECT ... FOR UPDATE`. Use explicit `await db.commit()` within the transaction scope. Zero nested `db.begin()` on autobegun sessions.
4. **Search Queries (ADR-005):** Always query `search_vector @@ plainto_tsquery('english', :q)`. Never append unindexed `OR ILIKE` fallbacks which degrade the GIN index scan.
5. **Layering Architecture:** Routers call services (`app/services/`); SQL queries and row locks live in repositories (`app/repositories/`). Models live in `app/models/` and schemas in `app/schemas/`.
