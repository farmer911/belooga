---
name: belooga-backend-engineering
description: Authoritative technical architecture and implementation guide for the Belooga Backend using Python 3.12+, FastAPI, PostgreSQL 16, SQLAlchemy 2.0 Async, Alembic, and Docker. Contains complete schema definitions for all 24 tables, 8 service domain designs, 36 API endpoint contracts, concurrency locking rules, and token vault rotation.
---

# ⚡ Belooga Backend Engineering Skill & Architecture Guide

This skill serves as the single source of truth for the **Backend Sub-Agent**. It defines the verified database schema (24 tables in `initdb.sql`), service domain contracts, concurrency controls, IDOR ownership guards, and API endpoints for the FastAPI modular monolith.

> [!IMPORTANT]
> **Architecture Transition Baseline:**
> - **AS-IS (Active Monolith):** 36 domain endpoints + 2 root probes across 7 endpoint files in `app/api/v1/endpoints/`, security and IDOR guards in `app/core/security.py`, async session in `app/core/database.py`.
> - **TO-BE (Clean 4-Layer Architecture):** Gradual migration to Router -> Schemas -> Domain Services -> Repositories -> SQLAlchemy 2.0 Mapped Models, with zero regressions to the 36 active endpoint contracts.

---

## 1. Technical Stack & Architecture

- **Language & Runtime:** `Python 3.12+` with strict type annotations.
- **Web Framework:** `FastAPI` (Async request lifecycle, Dependency Injection, automatic OpenAPI v3 schema generation).
- **Database Engine:** `PostgreSQL 16` with `uuid-ossp`, `pg_trgm` (trigram fuzzy matching), and `btree_gin` extensions.
- **ORM & Migrations:** `SQLAlchemy 2.0` (Declarative Base, Mapped types, `asyncpg` driver) + `Alembic`.
- **DTOs & Settings:** `Pydantic v2` (`BaseModel`, `Field`, `ConfigDict(from_attributes=True)`), `pydantic-settings`.
- **Authentication & Security:** `Argon2id` (Password hashing via `pwdlib`), `PyJWT` (HMAC HS256 access tokens), Secure `HttpOnly` refresh token family cookies with replay protection.
- **Storage & Transcoding:** Local filesystem `/app/uploads` volume (avatars, resumes, videos, chunks), non-blocking disk I/O via `asyncio.to_thread`, FFmpeg faststart streaming MP4 transcoding.
- **Containerization:** `Docker` & `Docker Compose` with volume hot-reloading (`./backend:/app`).

### Directory Layout
```
backend/
├── alembic/                      # Database migrations
│   ├── versions/
│   └── env.py
├── app/
│   ├── api/                      # Routing & Controller layer
│   │   └── v1/
│   │       └── endpoints/        # AS-IS: 7 Domain endpoint files (36 active routes)
│   │           ├── auth.py       # Domain 1: Auth, refresh token family rotation, me
│   │           ├── profile.py    # Domain 2: Candidate Profile, skills CRUD (IDOR guarded)
│   │           ├── timeline.py   # Domain 3: Work experience, education, reordering (IDOR guarded)
│   │           ├── media.py      # Domain 4: Chunked upload, ReportLab PDF, FFmpeg (IDOR guarded)
│   │           ├── search.py     # Domain 6: TSVECTOR ranking & Trigram autocomplete
│   │           ├── catalogs.py   # Domain 7: Skills, companies, schools, locations
│   │           └── cms.py        # Domain 8: Contact, FAQs, careers, reporting
│   ├── core/                     # Configuration, database engine, security
│   │   ├── database.py           # SQLAlchemy async_engine & async_sessionmaker (get_db)
│   │   └── security.py           # Argon2id, JWT encode/decode, get_current_user, IDOR guards
│   ├── schemas/                  # Pydantic v2 DTOs (Request & Response)
│   │   └── auth.py
│   ├── models/                   # TO-BE: SQLAlchemy 2.0 ORM Declarative Mapped Models
│   ├── repositories/             # TO-BE: Clean data access layer
│   ├── services/                 # TO-BE: Business logic layer
│   └── main.py                   # FastAPI Application Factory, CORS & static file mounts
├── initdb.sql                    # Verified Ground Truth Database Schema (24 Tables)
├── requirements.txt
└── Dockerfile
```

---

## 2. Complete Database Schema (24 Core Tables in `initdb.sql`)

### Domain 1: Identity & Authentication Vault
```sql
-- 1. identities
CREATE TABLE identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'candidate', -- 'candidate', 'employer', 'admin'
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_identities_email ON identities(email);

-- 2. refresh_sessions (Token Family Rotation & Replay Protection)
CREATE TABLE refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    family_id UUID NOT NULL, -- Rotates with initial login; all children share family_id
    token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of refresh token
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_sessions_lookup ON refresh_sessions(token_hash, revoked_at);
CREATE INDEX idx_refresh_sessions_family ON refresh_sessions(family_id);

-- 3. social_accounts
CREATE TABLE social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL, -- 'facebook', 'google', 'linkedin'
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_provider UNIQUE (provider, provider_user_id)
);

-- 4. password_reset_tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

-- 5. email_verification_tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
```

### Domain 2 & 4: Candidate Profile & Media
```sql
-- 6. candidate_profiles
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID UNIQUE NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    headline VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    phone VARCHAR(50),
    employment_status VARCHAR(64),
    seeking_status VARCHAR(64),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    is_fresh BOOLEAN NOT NULL DEFAULT TRUE,
    submitted BOOLEAN NOT NULL DEFAULT FALSE,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(headline, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(bio, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(location, '')), 'D')
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_candidate_profiles_username ON candidate_profiles(username);
CREATE INDEX idx_candidate_profiles_search_vector ON candidate_profiles USING GIN(search_vector);

-- 7. profile_media
CREATE TABLE profile_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL, -- 'avatar', 'resume_pdf', 'pitch_video', 'pitch_video_poster', 'job_video', 'school_video'
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_profile_media_category UNIQUE (profile_id, category)
);
```

### Domain 3: CV Timeline Sections
```sql
-- 8. job_experiences
CREATE TABLE job_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_id UUID,
    from_date_month INT,
    from_date_year INT,
    currently_work_here BOOLEAN NOT NULL DEFAULT FALSE,
    to_date_month INT,
    to_date_year INT,
    description TEXT,
    logo_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_exp_order ON job_experiences(profile_id, display_order ASC);

-- 9. education_experiences
CREATE TABLE education_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    school_name VARCHAR(255) NOT NULL,
    school_id UUID,
    degree_name VARCHAR(255),
    gpa VARCHAR(50),
    from_date_month INT,
    from_date_year INT,
    currently_work_here BOOLEAN NOT NULL DEFAULT FALSE,
    to_date_month INT,
    to_date_year INT,
    description TEXT,
    logo_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_edu_exp_order ON education_experiences(profile_id, display_order ASC);

-- 10. award_certifications
CREATE TABLE award_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    location_name VARCHAR(255),
    from_date_month INT,
    from_date_year INT,
    currently_work_here BOOLEAN NOT NULL DEFAULT FALSE,
    to_date_month INT,
    to_date_year INT,
    description TEXT,
    logo_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_award_cert_order ON award_certifications(profile_id, display_order ASC);
```

### Domain 7: Catalogs & Taxonomies
```sql
-- 11. skills & profile_skills
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);
CREATE INDEX idx_skills_name_trgm ON skills USING gin (name gin_trgm_ops);

CREATE TABLE profile_skills (
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, skill_id)
);

-- 12. languages & profile_languages
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE profile_languages (
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) DEFAULT 'Fluent',
    PRIMARY KEY (profile_id, language_id)
);

-- 13. interests & profile_interests
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE profile_interests (
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, interest_id)
);

-- 14. catalog_companies & catalog_schools
CREATE TABLE catalog_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT
);
CREATE INDEX idx_companies_trgm ON catalog_companies USING gin (name gin_trgm_ops);

CREATE TABLE catalog_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT
);
CREATE INDEX idx_schools_trgm ON catalog_schools USING gin (name gin_trgm_ops);

-- 15. catalog_locations
CREATE TABLE catalog_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL
);
```

### Domain 5 & 8: Video Studio, CMS & Support
```sql
-- 16. video_archives
CREATE TABLE video_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    opentok_session_id VARCHAR(255) NOT NULL,
    opentok_archive_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'started',
    video_url TEXT,
    duration_seconds INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. contact_inquiries
CREATE TABLE contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. profile_reports
CREATE TABLE profile_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    reporter_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. career_postings & career_applications
CREATE TABLE career_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE career_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES career_postings(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    resume_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Service Layer Design & Business Logic

### 3.1 AuthService (`app/services/auth_service.py`)
- **Login:**
  - Verify email & Argon2id password hash.
  - If valid, issue access token (JWT, 15m lifetime).
  - Generate cryptographically secure random refresh token. Store SHA-256 hash in `refresh_sessions` with new `family_id`. Set as HttpOnly cookie.
- **Refresh (Token Rotation with Replay Protection):**
  - Hash presented refresh token and lookup session.
  - If token does not exist or was ALREADY `revoked_at`: **Security Breach Detected!** Revoke ALL sessions sharing that `family_id` immediately.
  - If valid: Mark old session `revoked_at = NOW()`, create new session in same `family_id`, and return new JWT + new refresh cookie.
- **Logout:**
  - Mark current refresh session as revoked and clear cookie.

### 3.2 TimelineService (`app/services/timeline_service.py`)
- **Concurrency Control on Reordering:**
  - When updating `display_order` array `[{"id": "...", "order": 0}, ...]`:
  - Execute inside an explicit async transaction.
  - Apply pessimistic lock:
    ```python
    stmt = (
        select(JobExperience)
        .where(JobExperience.profile_id == profile_id)
        .with_for_update()
    )
    items = await session.scalars(stmt)
    # Apply new display_order indices and commit atomically
    ```

### 3.3 SearchService (`app/services/search_service.py`)
- **Full-Text Talent Search:**
  - Query: `select(CandidateProfile).where(CandidateProfile.search_vector.op('@@')(plainto_tsquery('english', query))).order_by(ts_rank(CandidateProfile.search_vector, plainto_tsquery('english', query)).desc())`
- **Autocomplete Suggestions:**
  - Trigram similarity query with threshold 0.3 on candidate names and catalog entities for sub-10ms response.

---

## 4. Docker Environment Specification (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: belooga-postgres
    restart: always
    environment:
      POSTGRES_USER: belooga
      POSTGRES_PASSWORD: belooga_secret_password
      POSTGRES_DB: belooga_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U belooga -d belooga_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: belooga-redis
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: belooga-backend
    restart: always
    environment:
      DATABASE_URL: postgresql+asyncpg://belooga:belooga_secret_password@postgres:5432/belooga_db
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET: dev_jwt_secret_key_change_in_production
      ALGORITHM: HS256
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```
