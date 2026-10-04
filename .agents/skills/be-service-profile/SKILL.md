---
name: be-service-profile
description: Authoritative Backend Department Skill for Candidate Profiles (Domain 2). Covers candidate entity models, biographical updates, search vector indexing, and profile visibility controls.
---

# 👤 Backend Department Skill: Candidate Profiles (Domain 2)

> **Department:** Backend Systems Engineering — Candidate Domain Division  
> **Target Files:** `backend/app/api/v1/endpoints/profile.py`, `backend/app/services/profile_service.py`, `backend/app/models/profile.py`  
> **Database Tables:** `candidate_profiles`, `profile_media`  

---

## 1. Department Role & Mission

This department manages the primary entity in the system: `CandidateProfile`. It encapsulates candidate biographical information, search index generation, profile visibility toggles, and connects the candidate to their timeline, media, and skills.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-auth` | Linked to `identities.id` via foreign key constraint |
| **Downstream (Outputs to)** | `be-service-timeline` | Parent profile owning `job_experiences` and `education_experiences` |
| **Downstream (Outputs to)** | `be-service-media` | Stores media URLs (`avatar_url`, `video_pitch_url`, `resume_url`) |
| **Downstream (Outputs to)** | `be-service-search` | `search_vector` generated column drives candidate discovery |
| **Downstream (Outputs to)** | `fe-page-workspace` | Primary source for `GET /v1/profile/{username}` |

---

## 3. Database Model & Search Vector Architecture

```python
# backend/app/models/profile.py
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
    phone: Mapped[str | None] = mapped_column(String(50))
    employment_status: Mapped[str | None] = mapped_column(String(64))
    seeking_status: Mapped[str | None] = mapped_column(String(64))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    video_pitch_url: Mapped[str | None] = mapped_column(Text)
    video_pitch_poster: Mapped[str | None] = mapped_column(Text)
    resume_url: Mapped[str | None] = mapped_column(Text)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    is_fresh: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    identity: Mapped["Identity"] = relationship(back_populates="profile")
    jobs: Mapped[list["JobExperience"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    education: Mapped[list["EducationExperience"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
```
