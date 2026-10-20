# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (`BEL-514`):** Audit, Benchmark, Demo, and Upgrade Backend API Gateway (`app/core/gateway.py`) and Multi-Tier Caching (`app/core/cache.py` + domain services):
  1. **Gateway Flaws Fixed:** Replace `BaseHTTPMiddleware` (streaming buffer bug + task-group overhead) with Pure ASGI Middleware (`__call__(scope, receive, send)`), replace unbounded `defaultdict(deque)` IP memory leak with Bounded LRU Token-Bucket/GCRA + Route-Tiered policies (`auth_strict`, `mutation`, `chunk_upload`, `public_read`), add `413 Payload Too Large` guard, `Idempotency-Key` replay cache, and HTTP `ETag`/`If-None-Match` (`304 Not Modified`) + `Cache-Control`.
  2. **Cache Flaws Fixed:** Fix split-brain `profile_cache` vs `platform_cache` invalidation bug across `ProfileService`, `TimelineService`, and `MediaService`; upgrade `AsyncTieredCache` with Stale-While-Revalidate (SWR), Singleflight Coalescing, and real-time hit/miss telemetry; cache hot read endpoints in `CatalogsService` and `CmsService`.
  3. **Empirical Benchmark Demo:** `scripts/benchmark-gateway-cache.py` + artifact `gateway_and_cache_benchmark.md`.

## Pre-Mortem Risks
- Keep all `backend/app/**/*.py` strictly <= 300 lines.
- Ensure `ENVIRONMENT=testing` compatibility across existing backend pytest cases while allowing explicit cache/gateway testing.

## Execution Checklist
- [x] Build & run empirical benchmark script (`scripts/benchmark-gateway-cache.py`) comparing Gateway & Cache architectures
- [x] Write TDD Red/Green test suite (`backend/tests/test_gateway_and_cache_optimization.py`)
- [x] Upgrade `backend/app/core/cache.py` (L1 LRU + L2 Redis + Singleflight + SWR + Telemetry + `invalidate_candidate_cache`)
- [x] Upgrade `backend/app/core/gateway.py` (Pure ASGI + Bounded LRU Token-Bucket + Route Tiers + 413 Guard + Idempotency-Key + ETag 304)
- [x] Fix split-brain cache invalidation in `profile/service.py`, `timeline/service.py`, `media/service.py` & wire `catalogs/service.py`, `cms/service.py`
- [x] Verify `trust-benchmark.py`, `audit-truth.sh`, open PR #22, and merge into `main`
