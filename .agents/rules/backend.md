---
trigger: glob
globs: backend/**
description: Invariants and standards for Belooga FastAPI backend.
---

# Backend Rules (FastAPI + SQLAlchemy 2.0 Async)

1. **Async Event-Loop Safety:** Never call synchronous I/O directly in `async def`. Always delegate `open()`, `ReportLab doc.build()`, `shutil.rmtree()`, and file system writes to worker threads via `asyncio.to_thread`.
2. **IDOR & Ownership Protection:** All mutation endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) operating on user resources MUST enforce `current_user: AuthenticatedUser = Depends(get_current_user)` and `verify_profile_owner(current_user, target_username)`. Never deduce candidate identity from email strings.
3. **Database Concurrency & Locking:** For reordering operations or token sessions, always acquire row-level locks via `SELECT ... FOR UPDATE`. Use explicit `await db.commit()` within the transaction scope. Zero nested `db.begin()` on autobegun sessions.
4. **Search Queries (ADR-005):** Always query `search_vector @@ plainto_tsquery('english', :q)`. Never append unindexed `OR ILIKE` fallbacks which degrade the GIN index scan.
5. **Layering Architecture:** Routers (`app/api/v1/endpoints/`) call domain services in `app/modules/<domain>/service.py`; SQL queries and row locks live in `app/modules/<domain>/repository.py`. `app/services/*_service.py` and `app/repositories/*_repo.py` are re-export shims: never add code there or import `app.services` from routers. Models live in `app/models/` and schemas in `app/schemas/`.
6. **Edge & Distributed API Gateway (`gateway.py` & `:8080`):** Keep `APIGatewayMiddleware` Pure-ASGI (never `BaseHTTPMiddleware`) backed by Redis distributed rate-limiting (`belooga:gw:rl:*`) and idempotency replay (`belooga:gw:idem:*`) with L1 LRU fallback. Public media/export URLs must resolve via `PUBLIC_API_URL` (`http://localhost:8080`).
