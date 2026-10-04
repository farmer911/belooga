---
name: be-patterns-and-practices
description: Authoritative Technical Standard & Master Design Patterns for Senior Backend Engineers. Enforces zero-compromise best practices across Clean 4-Layer Architecture, Repository & Unit of Work, Pessimistic Row Locking, CQRS with GIN indexing, AnyIO non-blocking event-loop safety, and GoF Creational, Structural, and Behavioral patterns (Adapter, Strategy, Factory, Decorator, Chain of Responsibility).
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
│ • Enforces IDOR guards: current_user.id == target.owner_id  │
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
          profile = await uow.profile_repo.get_by_user_id(user_id)
          if not profile:
              raise NotFoundException("Profile not found")
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

## 6. STRUCTURAL PATTERN: ADAPTER PATTERN (PLUGGABLE INFRASTRUCTURE)

* **Technical Definition:** Converts the interface of an external third-party service or infrastructure driver into an interface expected by the domain layer, decoupling domain services from vendor lock-in.
* **When to Use:** File storage (Local Disk vs. AWS S3 vs. Cloudflare R2), email delivery (SendGrid vs. SES), media transcoders.
* **Best Practice Blueprint:**
  ```python
  from abc import ABC, abstractmethod

  class StorageAdapter(ABC):
      @abstractmethod
      async def upload_file(self, file_bytes: bytes, destination_path: str) -> str:
          """Upload file and return public access URL."""
          pass

      @abstractmethod
      async def delete_file(self, file_path: str) -> bool:
          """Delete file from storage."""
          pass

  class LocalDiskStorageAdapter(StorageAdapter):
      def __init__(self, base_dir: Path):
          self.base_dir = base_dir

      async def upload_file(self, file_bytes: bytes, destination_path: str) -> str:
          target = self.base_dir / destination_path
          target.parent.mkdir(parents=True, exist_ok=True)
          await anyio.to_thread.run_sync(target.write_bytes, file_bytes)
          return f"/uploads/{destination_path}"

  class S3StorageAdapter(StorageAdapter):
      def __init__(self, bucket_name: str, s3_client):
          self.bucket = bucket_name
          self.client = s3_client

      async def upload_file(self, file_bytes: bytes, destination_path: str) -> str:
          await self.client.put_object(Bucket=self.bucket, Key=destination_path, Body=file_bytes)
          return f"https://{self.bucket}.s3.amazonaws.com/{destination_path}"
  ```
* **Rejection Trigger:** Importing `boto3` or directly using raw file paths in domain services.

---

## 7. BEHAVIORAL PATTERN: STRATEGY PATTERN (INTERCHANGEABLE ALGORITHMS)

* **Technical Definition:** Defines a family of algorithms, encapsulates each one, and makes them interchangeable at runtime without modifying the client code.
* **When to Use:** Search ranking algorithms (FTS vs Trigram), Password hashing strategies (Argon2id vs Legacy Bcrypt migration), Video encoding bitrates.
* **Best Practice Blueprint:**
  ```python
  class SearchRankingStrategy(ABC):
      @abstractmethod
      def apply_ranking(self, query: Select, term: str) -> Select:
          pass

  class FullTextSearchStrategy(SearchRankingStrategy):
      def apply_ranking(self, query: Select, term: str) -> Select:
          tsquery = func.plainto_tsquery("english", term)
          return query.where(Candidate.search_vector.op("@@")(tsquery)).order_by(
              func.ts_rank_cd(Candidate.search_vector, tsquery).desc()
          )

  class TrigramFuzzyStrategy(SearchRankingStrategy):
      def apply_ranking(self, query: Select, term: str) -> Select:
          return query.where(
              or_(
                  Candidate.first_name.op("%")(term),
                  Candidate.last_name.op("%")(term)
              )
          ).order_by(func.similarity(Candidate.first_name, term).desc())
  ```

---

## 8. STRUCTURAL PATTERN: DECORATOR PATTERN (CROSS-CUTTING CONCERNS)

* **Technical Definition:** Dynamically attaches additional responsibilities (metrics, execution latency logging, automated retry) to a function without modifying its signature.
* **When to Use:** Audit trails, latency timing, connection retry policies.
* **Best Practice Blueprint:**
  ```python
  from functools import wraps
  import time
  import structlog

  logger = structlog.get_logger()

  def track_latency(operation_name: str):
      def decorator(func):
          @wraps(func)
          async def wrapper(*args, **kwargs):
              start_time = time.perf_counter()
              try:
                  return await func(*args, **kwargs)
              finally:
                  elapsed_ms = (time.perf_counter() - start_time) * 1000
                  logger.info("operation_timed", operation=operation_name, latency_ms=round(elapsed_ms, 2))
          return wrapper
      return decorator

  # Application:
  @track_latency("talent_search_query")
  async def search_candidates(self, query_str: str) -> List[Candidate]:
      ...
  ```

---

## 9. BEHAVIORAL PATTERN: CHAIN OF RESPONSIBILITY (REQUEST PIPELINE)

* **Technical Definition:** Passes a request along a chain of potential handlers, allowing each handler to either process the request, apply security checks, or pass it to the next handler in the chain.
* **When to Use:** Request security pipelines, multi-layer authorization (Auth ➔ RateLimit ➔ IDOR Guard ➔ Payload Sanitizer).
* **Best Practice Blueprint:**
  ```python
  class RequestHandler(ABC):
      def __init__(self, next_handler: Optional['RequestHandler'] = None):
          self._next_handler = next_handler

      async def handle(self, context: SecurityContext) -> None:
          await self.process(context)
          if self._next_handler:
              await self._next_handler.handle(context)

      @abstractmethod
      async def process(self, context: SecurityContext) -> None:
          pass

  class AuthenticationGuard(RequestHandler):
      async def process(self, context: SecurityContext) -> None:
          if not context.user_id:
              raise HTTPException(status_code=401, detail="Unauthenticated")

  class IDOROwnershipGuard(RequestHandler):
      async def process(self, context: SecurityContext) -> None:
          if context.user_id != context.resource_owner_id and not context.is_admin:
              raise HTTPException(status_code=403, detail="Access denied: IDOR violation")
  ```

---

## 10. CREATIONAL PATTERNS: ABSTRACT FACTORY & BUILDER

1. **Factory Method (Database & Session Instantiation):**
   * Encapsulates connection pooling and session options (`expire_on_commit=False` for Async SQLAlchemy):
   ```python
   class AsyncDatabaseSessionFactory:
       def __init__(self, database_url: str):
           self.engine = create_async_engine(database_url, pool_size=20, max_overflow=10)
           self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

       def create_session(self) -> AsyncSession:
           return self.session_factory()
   ```

2. **Builder Pattern (Dynamic SQL Query Builders):**
   * Incrementally constructs complex multi-predicate queries without string concatenation:
   ```python
   class CandidateSearchQueryBuilder:
       def __init__(self):
           self.query = select(Candidate).where(Candidate.is_hidden.is_(False))

       def with_location(self, location: Optional[str]):
           if location:
               self.query = self.query.where(Candidate.location.ilike(f"%{location}%"))
           return self

       def with_seeking_status(self, status: Optional[str]):
           if status:
               self.query = self.query.where(Candidate.seeking_status == status)
           return self

       def build(self) -> Select:
           return self.query
   ```

---

## 11. IDENTITY & TOKEN VAULT SECURITY PATTERNS

1. **Password Hashing:** Argon2id with strict parameters (Memory cost: 65,536 KiB, Time cost: 3 iterations, Parallelism: 4 threads).
2. **JWT Token Family Replay Protection:**
   * Refresh tokens must be stored in a PostgreSQL `refresh_sessions` table with a `family_id` and `is_revoked` flag.
   * If a revoked refresh token is presented, revoke the ENTIRE token family immediately (detecting theft/replay attack).
3. **IDOR Ownership Verification:**
   * Any mutating endpoint must verify `current_user.id == target_entity.user_id`. Never trust user IDs passed in URL paths without authorization checks.

---

## 12. COMPLEXITY CONTROL & ALGORITHMIC INVARIANTS

Even the cleanest patterns will destroy production systems if algorithmic and operational complexity budgets are violated. Senior Backend Engineers must enforce:

### 12.1. Big-O Database Query Complexity ($O(\log N)$ Mandatory)
* **The Rule:** Any database query executed against tables exceeding 1,000 rows MUST resolve to $O(1)$ (Primary Key / Unique Hash lookup) or $O(\log N)$ (B-Tree index seek) or $O(k \log N)$ (GIN inverted index scan).
* **The Invariant:** Table scans ($O(N)$ `Seq Scan`) are **STRICTLY PROHIBITED** on production entity tables.
* **Verification Protocol:** All repository queries must be verified via `EXPLAIN (ANALYZE, BUFFERS)`. If `Filter: (seq_scan)` appears on large tables, the query is rejected immediately.

### 12.2. Anti-N+1 Query Invariant (The $O(1)$ Eager Loading Rule)
* **The Rule:** Iterating through an entity collection and executing lazy relationship queries inside a loop ($1 + N$ roundtrips) is a severe architectural flaw.
* **Best Practice Blueprint:**
  * One-to-Many / Many-to-Many: Bắt buộc dùng `selectinload(Candidate.skills)` ($O(2)$ queries regardless of $N$).
  * One-to-One / Many-to-One: Bắt buộc dùng `joinedload(Candidate.identity)` ($O(1)$ query via SQL JOIN).
  ```python
  stmt = (
      select(Candidate)
      .options(selectinload(Candidate.skills), selectinload(Candidate.experiences))
      .where(Candidate.is_hidden.is_(False))
      .limit(20)
  )
  ```

### 12.3. Lock Contention & Duration Budget ($< 50\text{ms}$)
* **The Invariant:** An open transaction holding pessimistic row locks (`SELECT FOR UPDATE`) must commit or abort within **$\le 50\text{ms}$**.
* **Forbidden Anti-Pattern:** Holding a database transaction while awaiting external network I/O, S3 file uploads, or password hashing.
  * *CORRECT:* Hash password / upload file FIRST ➔ Acquire lock ➔ Mutate database ➔ Commit immediately.

### 12.4. Cyclomatic Complexity Limit ($\le 10$) & Guard Clauses
* **The Rule:** No backend method may have a Cyclomatic Complexity score exceeding **10**.
* **The Invariant:** Deeply nested `if-else` staircases ($\ge 3$ levels) are rejected. Engineers must use **Guard Clauses (Early Returns)**:
  ```python
  # REJECT: Nested pyramid of doom (Complexity = 14)
  if user:
      if user.is_active:
          if profile:
              ...

  # MANDATORY: Flattened Guard Clauses (Complexity = 3)
  if not user:
      raise UnauthorizedException("User not authenticated")
  if not user.is_active:
      raise InactiveUserException("User account suspended")
  if not profile:
      raise NotFoundException("Profile not found")
  ```

### 12.5. The Rule of Three (Anti-Overengineering & YAGNI)
* **The Invariant:** Speculative abstractions (writing generic interfaces, complex factories, or strategies for features with only 1 single concrete case) are forbidden.
* Abstraction is strictly permitted ONLY when:
  1. Interacting across physical boundaries (external cloud vendor / disk / hardware driver).
  2. The identical algorithmic variation exists in $\ge 3$ concrete production locations.

---

## 13. REJECTION CHECKLIST FOR SENIOR BACKEND CODE

Before submitting any code for review, verify:
- [ ] Clean 4-Layer structure strictly preserved (zero SQL in routers).
- [ ] Query execution plan verified: Zero $O(N)$ Seq Scans on indexed tables.
- [ ] Anti-N+1 enforced via `selectinload` / `joinedload` on all relationship queries.
- [ ] Row lock duration is strictly budgeted ($< 50\text{ms}$, zero external I/O inside lock).
- [ ] Cyclomatic complexity $\le 10$ with flattened guard clauses.
- [ ] Third-party I/O (S3, disk, transcoders) abstracted behind an **Adapter**.
- [ ] Multi-criteria filters constructed via **Query Builder**, not raw string concatenation.
- [ ] All database writes modifying multiple records run within a Unit of Work transaction.
- [ ] Sequence order shifts are guarded by `.with_for_update()`.
- [ ] All synchronous disk I/O and PDF compilation are wrapped in `anyio.to_thread.run_sync()`.
- [ ] Full-text search strictly utilizes GIN indexes with zero `OR ILIKE` cancellations.
- [ ] Every mutating endpoint contains an explicit IDOR ownership guard.
- [ ] All response payloads are annotated with a strict Pydantic `response_model`.
