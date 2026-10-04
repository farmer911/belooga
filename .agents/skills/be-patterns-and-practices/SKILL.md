---
name: be-patterns-and-practices
description: Authoritative Technical Standard & Master Design Patterns for Senior Backend Engineers. Enforces zero-compromise best practices across Clean 4-Layer Architecture, Repository & Unit of Work, Pessimistic Row Locking, CQRS with GIN indexing, AnyIO non-blocking event-loop safety, and Argon2id/Token Vault security.
---

# ⚙️ SENIOR BACKEND ENGINEER — PRODUCTION PATTERNS & STANDARDS

> **Role Authority:** Principal Backend Engineer (10+ Years Experience)  
> **Status:** MANDATORY & ENFORCED FOR ALL BACKEND IMPLEMENTATIONS  
> **Core Principle:** ZERO-COMPROMISE PRODUCTION STANDARD. No trade-offs that cause event-loop freezes, race conditions, dirty reads, IDOR vulnerabilities, or database pool exhaustion.

---

## 1. CLEAN 4-LAYER ARCHITECTURE (STRICT INWARD DEPENDENCY)

Every backend domain service must strictly implement the 4-tier separation. Fat controllers or leaking queries are rejected immediately:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ROUTER / PRESENTATION LAYER                              │
│ • Validates HTTP headers/cookies, parses request parameters │
│ • Delegates 100% of execution to Domain Service             │
│ • Returns strict Pydantic response_model and status code    │
│ • ZERO SQL QUERIES, ZERO ORM SELECTS, ZERO BUSINESS RULES   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. APPLICATION DTO SCHEMAS                                  │
│ • Pydantic v2 schemas: Request/Response data validation     │
│ • ConfigDict(from_attributes=True) for seamless ORM mapping │
│ • Prevents internal database column leakage to client       │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DOMAIN SERVICE LAYER                                     │
│ • 100% Pure Business Logic, calculation, authorization      │
│ • Inforces IDOR guards: current_user.id == target.owner_id  │
│ • Orchestrates Unit of Work & Transaction Boundaries        │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. REPOSITORY & PERSISTENCE LAYER                           │
│ • Encapsulates SQLAlchemy 2.0 Async queries                 │
│ • Row-level locks, GIN full-text queries, connection safety │
│ • Returns domain entities or mapped DTOs                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. REPOSITORY & UNIT OF WORK (UoW) PATTERN

* **The Rule:** Any business operation mutating more than one table, or mutating sequence positions, must execute within an explicit Unit of Work transaction.
* **Best Practice Blueprint:**
  ```python
  class UnitOfWork:
      def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
          self._session_factory = session_factory

      async def __aenter__(self):
          self.session = self._session_factory()
          self.timeline_repo = TimelineRepository(self.session)
          self.profile_repo = ProfileRepository(self.session)
          return self

      async def __aexit__(self, exc_type, exc_val, exc_tb):
          if exc_type is not None:
              await self.session.rollback()
          else:
              await self.session.commit()
          await self.session.close()

  # Usage in Domain Service:
  async def reorder_and_record_experience(self, user_id: uuid.UUID, payload: ReorderPayload):
      async with self.uow as uow:
          # Verify ownership (IDOR guard)
          profile = await uow.profile_repo.get_by_user_id(user_id)
          if not profile:
              raise NotFoundException("Profile not found")
          
          # Execute mutations within atomic transaction
          await uow.timeline_repo.reorder_items(profile.id, payload.from_index, payload.to_index)
  ```

---

## 3. PESSIMISTIC CONCURRENCY LOCKING PATTERN (`SELECT FOR UPDATE`)

* **The Rule:** Mutations of sequence orders (`display_order`), balances, or inventory counters MUST lock matching rows at the PostgreSQL engine level to prevent lost updates and race conditions.
* **Best Practice Blueprint:**
  ```python
  async def shift_timeline_orders(
      session: AsyncSession,
      profile_id: uuid.UUID,
      from_order: int,
      to_order: int
  ) -> None:
      # Pessimistic Row Locking: blocks concurrent writes until transaction commits
      stmt = (
          select(JobExperience)
          .where(JobExperience.profile_id == profile_id)
          .where(JobExperience.display_order.between(min(from_order, to_order), max(from_order, to_order)))
          .with_for_update()
          .order_by(JobExperience.display_order.asc())
      )
      result = await session.execute(stmt)
      items = result.scalars().all()
      # Mutate indices safely...
  ```
* **Rejection Trigger:** Sequential `UPDATE` queries without `with_for_update()` in concurrent endpoints.

---

## 4. CQRS WITH TSVECTOR & GIN INDEXING

* **The Rule:** Full-text discovery must read from pre-computed `tsvector` columns indexed with GIN. Never execute `ILIKE '%...%'` across full tables.
* **Best Practice Blueprint:**
  ```sql
  -- Schema definition with generated TSVECTOR column and GIN Index
  ALTER TABLE candidates 
  ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(headline, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(bio, '')), 'C')
  ) STORED;

  CREATE INDEX idx_candidates_search_vector_gin ON candidates USING gin(search_vector);
  CREATE INDEX idx_candidates_name_trgm ON candidates USING gin(first_name gin_trgm_ops, last_name gin_trgm_ops);
  ```
* **Python Query Standard:**
  ```python
  stmt = (
      select(Candidate)
      .where(Candidate.search_vector.op("@@")(func.plainto_tsquery("english", query)))
      .order_by(func.ts_rank_cd(Candidate.search_vector, func.plainto_tsquery("english", query)).desc())
      .limit(limit).offset(offset)
  )
  ```
* **Rejection Trigger:** Adding `OR first_name ILIKE '%...%'` to a `search_vector @@ ...` query, which causes the PostgreSQL planner to abandon the GIN index and execute a Full Table Scan.

---

## 5. NON-BLOCKING EVENT-LOOP OFFLOADING PATTERN

* **The Rule:** Uvicorn's main async thread must NEVER be blocked by synchronous file I/O, PDF compilation, image processing, or heavy cryptography.
* **Best Practice Blueprint:**
  ```python
  import anyio

  # Offload synchronous disk chunk merging and ReportLab PDF builds
  await anyio.to_thread.run_sync(pdf_generator.build_resume, canvas_target, profile_data)

  # For subprocesses (FFmpeg transcoding), NEVER use subprocess.run()
  process = await asyncio.create_subprocess_exec(
      "ffmpeg", "-i", input_path, "-c:v", "libvpx-vp9", output_path,
      stdout=asyncio.subprocess.PIPE,
      stderr=asyncio.subprocess.PIPE
  )
  stdout, stderr = await process.communicate()
  ```
* **Rejection Trigger:** Calling `open(path, "wb")`, `time.sleep()`, `subprocess.run()`, or `requests.get()` inside an `async def` function.

---

## 6. IDENTITY & TOKEN VAULT SECURITY PATTERNS

1. **Password Hashing:** Argon2id with strict parameters (Memory cost: 65,536 KiB, Time cost: 3 iterations, Parallelism: 4 threads).
2. **JWT Token Family Replay Protection:**
   * Refresh tokens must be stored in a PostgreSQL `refresh_sessions` table with a `family_id` and `is_revoked` flag.
   * If a revoked refresh token is presented, revoke the ENTIRE token family immediately (detecting theft/replay attack).
3. **IDOR Ownership Verification:**
   * Any mutating endpoint must verify `current_user.id == target_entity.user_id`. Never trust user IDs passed in URL paths without authorization checks.

---

## 7. REJECTION CHECKLIST FOR SENIOR BACKEND CODE

Before submitting any code for review, verify:
- [ ] Clean 4-Layer structure strictly preserved (zero SQL in routers).
- [ ] All database writes modifying multiple records run within a Unit of Work transaction.
- [ ] Sequence order shifts are guarded by `.with_for_update()`.
- [ ] All synchronous disk I/O and PDF compilation are wrapped in `anyio.to_thread.run_sync()`.
- [ ] Full-text search strictly utilizes GIN indexes with zero `OR ILIKE` cancellations.
- [ ] Every mutating endpoint contains an explicit IDOR ownership guard.
- [ ] All response payloads are annotated with a strict Pydantic `response_model`.
