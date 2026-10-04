---
name: belooga-backend-services
description: Authoritative Technical Architecture Skill for Backend Service Domains. Covers Clean 4-Layer Architecture (Router -> DTO Schemas -> Domain Services -> Repositories -> 19 SQLAlchemy 2.0 Async Models), async transactions, and OpenAPI contracts.
---

# ⚡ Belooga Backend Architecture & 8 Service Domains Skill

> **Scope:** `backend/app/`  
> **Pattern:** Clean 4-Layer Architecture (Modular Monolith)  
> **Runtime:** Python 3.12+ | FastAPI | PostgreSQL 16 | SQLAlchemy 2.0 Async | Pydantic v2  

---

## 1. Clean 4-Layer Architecture (Strict Separation of Concerns)

```
HTTP Request
     │
     ▼
[Layer 1: Thin API Routers] (`backend/app/api/v1/endpoints/*.py`)
• Exclusive Responsibility: Receive HTTP requests, parse inputs, inject Services, return `response_model`.
• STRICTLY FORBIDDEN: Writing raw SQL text(), executing direct file I/O, or embedding business rules.
     │
     ▼
[Layer 2: Pydantic v2 DTO Schemas] (`backend/app/schemas/*.py`)
• Strict Request & Response models with `ConfigDict(from_attributes=True)`.
• Enables 100% automated, accurate OpenAPI v3 Swagger documentation.
     │
     ▼
[Layer 3: Domain Services] (`backend/app/services/*.py`)
• Core Business Logic: Video chunk merging, Argon2id hashing, ReportLab PDF resume generation, business rules.
     │
     ▼
[Layer 4: Repositories] (`backend/app/repositories/*.py`)
• Data Access Layer: Encapsulates all SQLAlchemy queries (`select`, `insert`, `update`, `delete`).
• Transaction management (commit/rollback) and pessimistic concurrency locks (`with_for_update`).
     │
     ▼
[Layer 5: SQLAlchemy 2.0 Async Models] (`backend/app/models/*.py`)
• 19 standardized ORM models utilizing `Mapped[...]`, indexes, foreign keys, and cascading relationships.
```

---

## 2. 8 Service Domains & 19 Core Tables Inventory

| Domain | Business Responsibility | Core Database Tables (19 Tables) | DTO Schemas & Services |
| :--- | :--- | :--- | :--- |
| **Domain 1: Identity & Auth** | Registration, Login, JWT tokens, Refresh Token Family Rotation | `identities`, `refresh_sessions`, `social_accounts`, `password_reset_tokens`, `email_verification_tokens` | `AuthService`, `IdentityRepository` |
| **Domain 2: Candidate Profile** | Profile CRUD, Bio, Headline, Avatar mutations, Visibility toggles | `candidate_profiles`, `profile_media` | `ProfileService`, `ProfileRepository` |
| **Domain 3: Timeline & CRUD** | Work Experience, Education, Awards, HTML5 DnD Reordering | `job_experiences`, `education_experiences`, `awards_certifications` | `TimelineService`, `TimelineRepository` |
| **Domain 4: Media & Uploads** | Chunked video uploads, WebM/MP4 merging, Avatar I/O, PDF resume generation | Filesystem / S3 bucket, `profile_media` | `MediaService`, `PdfService` |
| **Domain 5: Video Studio** | WebRTC Studio session coordination, recording telemetry | Ephemeral state, `profile_media` | `StudioService` |
| **Domain 6: Discovery & Search** | Full-Text Search TSVECTOR, Trigram autocomplete suggestions | `candidate_profiles.search_vector`, `search_queries` | `SearchService`, `SearchRepository` |
| **Domain 7: Master Catalogs** | Master Skills catalog, company & university suggestions | `skills_catalog`, `candidate_skills` | `CatalogService`, `CatalogRepository` |
| **Domain 8: CMS & Moderation** | Blog posts, Contact inquiries, Candidate reporting logs | `contact_inquiries`, `cms_posts`, `moderation_logs` | `CmsService`, `CmsRepository` |

---

## 3. Production Code Implementation Standards

### 3.1. Standard SQLAlchemy 2.0 Mapped Model:
```python
# app/models/profile.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    identity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("identities.id", ondelete="CASCADE"), unique=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    headline: Mapped[str | None] = mapped_column(String(255))
    bio: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255))
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    jobs: Mapped[list["JobExperience"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
```

### 3.2. Standard Pydantic v2 DTO Schema:
```python
# app/schemas/profile.py
from pydantic import BaseModel, ConfigDict
import uuid

class CandidateProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    first_name: str
    last_name: str
    headline: str | None = None
    bio: str | None = None
    location: str | None = None
    is_hidden: bool = False
```

### 3.3. Standard Thin API Router:
```python
# app/api/v1/endpoints/profile.py
@router.get("/profile/{username}", response_model=CandidateProfileResponse, tags=["Domain 2: Candidate Profile"])
async def get_candidate_profile(
    username: str,
    profile_service: ProfileService = Depends(get_profile_service)
):
    profile = await profile_service.get_by_username(username)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return profile
```

---

## 4. QC Guardrails & API Consistency
* All API endpoints `/v1/...` must preserve exact URL paths, parameter names, and HTTP status codes to guarantee 100% regression-free compatibility with Playwright E2E suites.
