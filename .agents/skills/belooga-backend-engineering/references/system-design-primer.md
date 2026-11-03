# System Design Primer, Applied to Belooga

Source: `donnemartin/system-design-primer` (GitHub). This file keeps only what an agent needs to design or review Belooga backend work, with every topic mapped to the code that implements it today, or marked as not adopted. Code is the source of truth: if a line below disagrees with `backend/`, trust the code and fix this file.

---

## 1. Design Method (use for every new feature, scaling question, or `/investigate` plan)

1. **Use cases, constraints, assumptions.** Who calls it (candidate, recruiter, expert, admin, anonymous)? Read/write ratio? Expected traffic? Data size? Consistency need (must a user see their own write immediately)?
2. **Back-of-the-envelope estimate** (section 6). Turn traffic into QPS, storage, and bandwidth before choosing a pattern.
3. **High-level design.** Place it on the existing pipeline: Edge Nginx -> ASGI Gateway -> Router -> Service -> Repository -> PostgreSQL, with cache and event stream on the side (`belooga-backend-engineering` section 1). Reuse a layer before adding one.
4. **Core components.** API contract (Pydantic DTO + Zod mirror), tables and indexes (Alembic migration), cache keys and invalidation, side effects.
5. **Scale the design.** Find the bottleneck (DB writes, DB connections, hot keys, CPU-bound work, fan-out) and pick the cheapest pattern from section 3 that removes it. State the trade-off (consistency, cost, complexity) in one line.

Rule: adopt a pattern only when the estimate or a benchmark (`scripts/benchmark-*.py`) shows the need. A modular monolith on one PostgreSQL primary is the deliberate baseline.

---

## 2. Trade-offs to Name Explicitly

| Trade-off | Primer meaning | Belooga position |
|---|---|---|
| Performance vs scalability | Slow for one user vs slow only under load | Profile one request first (`EXPLAIN ANALYZE`, N+1); scale out only after |
| Latency vs throughput | Time per request vs requests per second | Gateway rate limits and HPA protect throughput; single-roundtrip SQL protects latency |
| CAP | Under a partition, pick consistency (CP) or availability (AP) | PostgreSQL primary = CP (money, auth, ownership). Redis cache and read replica = AP (stale reads accepted) |
| Consistency | Weak / eventual / strong | Strong: writes and reads on `get_db`. Eventual: `get_read_db` replica, L1/L2 cache until invalidation or TTL. Weak: in-memory event stream (may drop) |
| Availability | Fail-over (active-passive, active-active) and replication | Stateless API pods behind K8s Service, HPA 2..10 replicas + PodDisruptionBudget (`k8s/deployment-and-hpa.yaml`). DB fail-over is outside this repo |

Availability math: parts in sequence multiply (`A_total = A1 * A2`), parts in parallel combine (`A_total = 1 - (1 - A1) * (1 - A2)`). 99.9% allows about 8h 46m downtime per year; 99.99% about 52m 36s.

---

## 3. Topic Map: Primer -> Belooga Code

### Edge, DNS, CDN, Load Balancer, Reverse Proxy
- **DNS / CDN:** not managed in this repo. No CDN in front of `frontend`; static assets come from the Next.js `standalone` server. Adopt a pull CDN when static or media egress dominates bandwidth.
- **Load balancer:** K8s `Service` + `Ingress` (L7) in `k8s/deployment-and-hpa.yaml`; Nginx `upstream belooga_backend` with `keepalive 32` in `nginx/gateway.conf`.
- **Reverse proxy:** `nginx/gateway.conf` does gzip (incl. `application/x-protobuf`), `limit_req` 100r/s burst 200 -> `429`, `client_max_body_size 15m`.
- **Gateway (app-level reverse proxy):** `backend/app/core/gateway.py` = Redis token-bucket rate limit, `Idempotency-Key` replay, `ETag` -> `304`, `413` guard.

### Application Layer
- **Modular monolith**, not microservices: bounded contexts live in `backend/app/modules/<domain>/` behind router -> service -> repository. Split a service out only when one context needs independent deploy cadence or scaling that HPA on the whole pod cannot give.
- **Service discovery:** K8s DNS (`backend:8000`). No registry needed.
- **Batching:** `backend/app/core/rpc.py` (`execute_rpc_batch`) multiplexes many reads in one HTTP call to kill client waterfalls.

### Database
- **Master-slave replication:** `get_read_db` uses `DATABASE_READ_URL` (falls back to primary) in `backend/app/core/database.py`. Mutations always `get_db`.
- **Replication lag trap:** a read that must reflect the caller's own write (read-your-writes, e.g. `/auth/me/` right after a profile update) must not go to a lagging replica; `/auth/me/` uses `get_db` for this reason.
- **Connection budget:** `pool_size + max_overflow` per pod x max HPA replicas must stay below PostgreSQL `max_connections` (comment in `backend/app/core/database.py`). Recheck when raising `maxReplicas`.
- **Master-master, federation, sharding:** not adopted. Single primary is enough until write QPS or table size outgrows one node; partition by time (`created_at`) or tenant before sharding.
- **Denormalization (adopted):** `search_vector` TSVECTOR with GIN (ADR-005), `json_agg` profile bundle reads (`ProfileRepository.get_full_profile_bundle`).
- **SQL tuning (adopted):** composite B-Tree indexes in `backend/alembic/versions/0004_optimize_indexes_and_sql.py`, keyset pagination on `(created_at, id)`, writeable CTEs, bulk `CASE` updates, zero `text(f"...")`.
- **NoSQL:** Redis as key-value store only (cache, rate limit, idempotency). No document or wide-column store.

### Cache
- **Where:** client (`@tanstack/react-query`, Service Worker `frontend/public/sw.js`), web server (gateway `ETag` / `304`), application (`AsyncTieredCache` in `backend/app/core/cache.py`: L1 per-pod LRU + L2 Redis), database (PostgreSQL buffer cache).
- **What:** query/object results keyed by domain prefix (`pub_profile:`, `search:`, `shortlist:`, `analytics:`); see `invalidate_candidate_cache`.
- **Update strategy:**
  - Cache-aside (adopted): `platform_cache.get_or_set(key, ttl, loader)` with per-key singleflight against stampede.
  - Refresh-ahead (adopted, as SWR): `stale_ttl_seconds` serves stale while one loader refreshes.
  - Write-through / write-behind: not adopted. Writes go to PostgreSQL, then invalidate.
- **Invalidation (cross-pod):** `invalidate_prefix` purges local L1 and Redis L2, then publishes `<pod_id>|<prefix>` on `<namespace>:inval`. Every pod's `run_invalidation_listener` (started in the FastAPI `lifespan`) skips its own `pod_id` and calls `apply_remote_invalidation`. Pub/Sub is fire-and-forget: events published while a listener is disconnected (Redis outage, circuit `OPEN`) are lost, so L1 TTL on mutable data stays the backstop.
- **Circuit breaker:** Redis failures trip `CLOSED -> OPEN`, cooldown -> `HALF_OPEN`, success -> `CLOSED` (`circuit_state` in `backend/app/core/cache.py`, `get_gateway_circuit_state` in `backend/app/core/gateway.py`). Cache and gateway fail open to L1.

### Asynchronism
- **Message queue:** `backend/app/core/events.py` is a per-pod, in-memory partitioned log (CRC32 key -> partition, micro-batch drain, retry, DLQ). Not durable, not shared across pods. `deque(maxlen=4096)` drops the oldest event when full. Use it for best-effort telemetry and notifications only.
- **Task queue:** none. Blocking or CPU work runs via `asyncio.to_thread`. Adopt a durable queue (Redis Streams first, since Redis is already deployed) when work must survive a pod restart, retry across pods, or exceed request time.
- **Back pressure:** at the edge (Nginx `429`, gateway rate limits, `413`). Inside the event stream there is none (drop-oldest). New producers of must-deliver work must reject with `429`/`503` when full, never silently drop.
- **Idempotency:** `Idempotency-Key` stored in Redis; on Redis failure it falls back to per-pod L1, so a retry on another pod may run twice (docstring in `backend/app/core/gateway.py`). Money paths must also be idempotent at the DB level: MoMo orders are keyed by `order_id` (primary key in `backend/app/models/payments.py`), so an IPN replay must be a no-op state transition, never a second credit.

### Communication
- **REST** over HTTP for resources (`/v1/*`), **RPC** batch for multi-widget reads (`/v1/rpc/*`, optional Protobuf-varint framing). Pick REST for public, cacheable contracts; RPC for internal aggregation.
- **TCP vs UDP:** all API traffic is TCP. WebRTC recording in the browser uses UDP media transport; uploads go back over HTTP chunks.

### Security (primer points to OWASP)
- Parameterized SQL only, Pydantic validation at the boundary, `get_current_user` + `verify_profile_owner` against IDOR, rate limits on auth (`AUTH_STRICT_RPM`), HttpOnly `samesite="lax"` refresh cookie (`backend/app/modules/auth/service.py`), HMAC-SHA256 on payment webhooks.

---

## 4. Review Checklist (cite in `be-code-review` and `/investigate`)
- Does every new read pick `get_db` vs `get_read_db` on purpose, with read-your-writes in mind?
- Does every mutation of cached data invalidate the right prefix after `commit()`, and is the L1 TTL acceptable for events lost while a pod's Pub/Sub listener is disconnected?
- Is anything that must not be lost routed through `event_stream`? Reject.
- Is a new hot path cache-aside with singleflight, or does it hit PostgreSQL per request?
- Does the change add pods or pool size? Recheck the connection budget.
- Is retry safe (idempotent) for every mutation a client may resend?
- Is a new pattern backed by an estimate or benchmark, not by "it scales"?

---

## 5. Latency Numbers (order of magnitude)

| Operation | Time |
|---|---|
| L1 cache reference | 0.5 ns |
| Main memory reference | 100 ns |
| Compress 1 KB (Zippy) | 10 us |
| Send 1 KB over 1 Gbps | 10 us |
| Random 4 KB read, SSD | 150 us |
| Read 1 MB sequentially from memory | 250 us |
| Round trip within one datacenter | 500 us |
| Read 1 MB sequentially from SSD | 1 ms |
| HDD seek | 10 ms |
| Read 1 MB sequentially from HDD | 30 ms |
| Packet CA -> Netherlands -> CA | 150 ms |

Takeaways: a Redis or PostgreSQL call costs about one datacenter round trip (0.5 ms + query time), so N+1 queries cost N round trips. Memory beats network beats disk. Compress before sending over the WAN.

---

## 6. Back-of-the-Envelope Estimation

- 2.5 million requests per month ~ 1 request per second; 100 million per month ~ 40 rps; 1 billion per month ~ 400 rps.
- Average QPS = daily requests / 86,400. Plan for peak = 2-3x average.
- Concurrent users -> QPS: `CCU x requests per user per minute / 60`. Example: 25,000 CCU at 6 requests per minute = 2,500 rps peak.
- Storage = rows per day x row bytes x retention days; add indexes (often +50-100%).
- Powers of two: 2^10 ~ 1 thousand (KB), 2^20 ~ 1 million (MB), 2^30 ~ 1 billion (GB), 2^40 ~ 1 trillion (TB).
- Compare the result with measured capacity from `scripts/benchmark-gateway-cache.py` and `scripts/benchmark-sql-optimization.py`, not with intuition.
