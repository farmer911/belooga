# ⚡ Belooga Backend Sub-Agent Execution Plan
> **Target:** Build Modular Monolith Backend with FastAPI, PostgreSQL 16 & Docker  
> **Tech Stack:** Python 3.12+, FastAPI, PostgreSQL 16, SQLAlchemy 2.0 Async, Alembic, Docker  
> **Authority Skill:** [`belooga-backend-engineering`](file:///Users/phucnguyen/Dev/Beloga/.agents/skills/belooga-backend-engineering/SKILL.md)

---

## 1. Sub-Agent Mission & Concurrency Rules
- **Mission:** Implement the high-performance async FastAPI backend with all 72 endpoints across 8 domains, backed by PostgreSQL 16 and Redis.
- **Strict Non-Negotiable Standards:**
  - **Single Source of Truth:** Business rules, validations, permissions, and session tracking reside strictly on the backend.
  - **Pessimistic Locking on Reorder:** All timeline reordering operations (`display_order`) MUST acquire row locks using `SELECT ... FOR UPDATE` inside a database transaction.
  - **Token Vault Rotation:** Refresh tokens must use family-based rotation with instant replay attack detection. Presenting a revoked token invalidates the entire session family.
  - **Cascade Account Deletion:** `DELETE /v1/users/` must cleanly cascade across all candidate profile, timeline, media, and archive records.
  - **Zero Raw Secrets:** Passwords must be hashed with Argon2id; refresh tokens stored as SHA-256 hashes.

---

## 2. Parallel Synchronization Milestones
| Milestone | Backend Deliverable | Interface for Frontend | Validation for QC |
|---|---|---|---|
| **M1: Foundation** | Docker Compose (Postgres 16, Redis), FastAPI factory, Alembic setup | Health probe `/health` | DB connectivity & migration runner |
| **M2: Auth & Session** | Domain 1 (10 APIs: login, register, refresh cookie, reset) | `/v1/auth/*`, `/v1/users/*` | TC-AUTH-001..003 |
| **M3: Profile & Timeline** | Domain 2, 3, 4 (Profile CRUD, Timeline reorder, S3 Media) | `/v1/profile/*` | TC-WORK-001..004 |
| **M4: Talent Search** | Domain 6 (PostgreSQL tsvector FTS + Trigram autocomplete) | `/v1/profile/search/*` | TC-SRCH-001..003 |
| **M5: Catalogs & CMS** | Domain 5, 7, 8 (OpenTok WebRTC, Master Catalogs, Careers, Contact) | Full OpenAPI v3 at `/docs` | TC-PUB-001..002, Full Contract Test |

---

## 3. Phase-by-Phase Implementation Checklist

### Phase 1: Environment & Database Infrastructure
- [ ] Create `backend/docker-compose.yml`:
  - [ ] `postgres`: PostgreSQL 16 with `pg_trgm` and `btree_gin` extensions enabled.
  - [ ] `redis`: Redis 7 for cache & token blacklisting.
  - [ ] `backend`: FastAPI app container with hot-reloading for development.
- [ ] Initialize Python project in `backend/`:
  - [ ] Create `pyproject.toml` or `requirements.txt` with: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`, `argon2-cffi`, `pyjwt`, `python-multipart`, `boto3`, `httpx`.
- [ ] Setup `app/core/config.py` with Pydantic `BaseSettings`.
- [ ] Setup `app/core/database.py` with SQLAlchemy 2.0 `create_async_engine` and `async_sessionmaker`.
- [ ] Configure Alembic async environment (`alembic/env.py`) and initialize first migration script.

### Phase 2: Domain 1 — Identity & Authentication Service (10 APIs)
- [ ] **SQLAlchemy Models (`app/models/identity.py`)**:
  - [ ] `Identity`: id, email, password_hash, role, status, timestamps.
  - [ ] `RefreshSession`: id, identity_id, family_id, token_hash, expires_at, revoked_at.
  - [ ] `SocialAccount`: provider, provider_user_id.
  - [ ] `PasswordResetToken` & `EmailVerificationToken`.
- [ ] **Service & Repositories (`app/services/auth_service.py`)**:
  - [ ] Argon2id password hashing and verification.
  - [ ] Token family rotation with anti-replay detection.
- [ ] **API Endpoints (`app/api/v1/endpoints/auth.py`, `users.py`)**:
  - [ ] `POST /v1/auth/login/` (Verify credentials, issue JWT + HttpOnly refresh cookie).
  - [ ] `POST /v1/auth/refresh/` (Rotate refresh token and issue new JWT).
  - [ ] `POST /v1/auth/logout/` (Revoke refresh session and clear cookie).
  - [ ] `POST /v1/auth/social-login/` (OAuth exchange for Google, Facebook, LinkedIn).
  - [ ] `POST /v1/users/register/` (Atomically create identity + candidate profile).
  - [ ] `GET /v1/users/exists/email/?email=` & `GET /v1/users/exists/username/?username=`.
  - [ ] `POST /v1/auth/registration/verify-email/` & `POST /v1/users/verify-resend/`.
  - [ ] `POST /v1/auth/password/reset/` & `POST /v1/auth/password/reset/confirm/`.

### Phase 3: Domain 2 & 4 — Candidate Profile & Media Storage (20 APIs)
- [ ] **SQLAlchemy Models (`app/models/profile.py`)**:
  - [ ] `CandidateProfile`: id, identity_id, username, first_name, last_name, headline, bio, location, phone, search_vector (TSVECTOR).
  - [ ] `ProfileMedia`: id, profile_id, category, file_url, mime_type, file_size_bytes.
- [ ] **Service & Repositories (`app/services/profile_service.py`, `media_service.py`)**:
  - [ ] Full profile hydration (profile + media + timeline + skills).
  - [ ] S3/MinIO upload handler for avatar, resume PDF, and video pitch.
- [ ] **API Endpoints**:
  - [ ] `GET /v1/profile/me/` (Get current candidate profile).
  - [ ] `PATCH /v1/profile/me/` (Update headline, bio, location, phone).
  - [ ] `PATCH /v1/profile/hidden/` & `PATCH /v1/users/fresh/`.
  - [ ] `POST /v1/users/email/change/` & `POST /v1/auth/password/change/`.
  - [ ] `DELETE /v1/users/` (Cascade delete account & all associated data).
  - [ ] `PATCH /v1/profile/avatar/` (Multipart avatar upload).
  - [ ] `PATCH /v1/profile/resume/` & `DELETE /v1/profile/resume/` (Resume PDF).
  - [ ] `PATCH /v1/profile/cover-video/` & `DELETE ...` (0:30 Video Pitch).
  - [ ] `GET /v1/profile/video-status/` (Video transcode status polling).

### Phase 4: Domain 3 — Timeline Sections CRUD & Concurrency Reordering (15 APIs)
- [ ] **SQLAlchemy Models (`app/models/timeline.py`)**:
  - [ ] `JobExperience`: profile_id, title, company_name, dates, description, logo_url, display_order.
  - [ ] `EducationExperience`: profile_id, school_name, degree_name, gpa, dates, logo_url, display_order.
  - [ ] `AwardCertification`: profile_id, title, location_name, dates, logo_url, display_order.
- [ ] **Service & Concurrency Control (`app/services/timeline_service.py`)**:
  - [ ] Implement `SELECT ... FOR UPDATE` pessimistic locking during reorder batch updates.
  - [ ] Automatic re-indexing when an item is deleted.
- [ ] **API Endpoints (5 endpoints per section: Jobs, Education, Awards)**:
  - [ ] `GET /v1/profile/{section}/?page=1&limit=100` (Sorted by `display_order ASC`).
  - [ ] `POST /v1/profile/{section}/` (Insert at end of list).
  - [ ] `PUT /v1/profile/{section}/{id}/` & `PATCH ...` (Update fields).
  - [ ] `DELETE /v1/profile/{section}/{id}/` (Delete and compact order indices).
  - [ ] `POST /v1/profile/{section}/order/` (Batch reorder with array of IDs).

### Phase 5: Domain 5 & 6 — WebRTC Studio & Talent Search (8 APIs)
- [ ] **Domain 5 (WebRTC Studio)**:
  - [ ] `VideoArchive` model for tracking session and archive status.
  - [ ] `GET /v1/profile/opentok/session/` (Generate WebRTC session and token).
  - [ ] `POST /v1/profile/opentok/start-archive/` & `stop-archive/`.
  - [ ] `POST /v1/profile/opentok/save-archive/` & `confirm-archive/`.
  - [ ] Webhook receiver `/v1/webhooks/opentok` for transcoding notifications.
- [ ] **Domain 6 (Talent Discovery & Search)**:
  - [ ] Full-text search with `tsvector` and `ts_rank` ranking.
  - [ ] `GET /v1/profile/search/?key=&page=&limit=` (Candidate search results).
  - [ ] `GET /v1/profile/search/suggest/?key=` (Trigram fuzzy autocomplete top 5).

### Phase 6: Domain 7 & 8 — Master Catalogs & Public CMS (19 APIs)
- [ ] **Domain 7 (Taxonomy Catalogs)**:
  - [ ] Models: `Skill`, `Language`, `Interest`, `CatalogCompany`, `CatalogSchool`, `CatalogLocation`.
  - [ ] APIs: `GET /v1/profile/company`, `school`, `interest/interests`, `location/*`.
- [ ] **Domain 8 (Public CMS & Support)**:
  - [ ] `GET /v1/profile/{username}` (Public candidate CV view).
  - [ ] `GET /v1/profile/{user_id}/export/` (PDF export stream).
  - [ ] `POST /v1/contact/` (Contact inquiry form).
  - [ ] `GET /v1/career/jobs/` & `POST /v1/career/applicant/{job_id}/`.
  - [ ] `GET /v1/faqs` & `GET /v1/setting/*`.
  - [ ] `POST /v1/profile/{user_id}/report/` (Candidate moderation report).

---

## 4. Definition of Done (DoD)
- [ ] All 19 database tables created with foreign keys, cascading rules, and GIN indexes.
- [ ] All 72 endpoints operational and visible in Swagger UI at `http://localhost:8000/docs`.
- [ ] Zero race conditions on timeline reordering verified under concurrent tests.
- [ ] Replay attack detection test passes (revoked refresh token revokes entire family).
- [ ] Health check probe `/health` returns `{"status": "ok", "db": "healthy"}`.
