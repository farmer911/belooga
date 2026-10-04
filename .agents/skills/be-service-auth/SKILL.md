---
name: be-service-auth
description: Authoritative Backend Department Skill for Identity & Authentication Vault (Domain 1). Covers Argon2id password hashing, JWT token rotation, refresh session replay protection, and user availability queries.
---

# 🛡️ Backend Department Skill: Identity & Authentication Vault (Domain 1)

> **Department:** Backend Systems Engineering — Identity & Cryptography Division  
> **Target Files:** `backend/app/api/v1/endpoints/auth.py`, `backend/app/services/auth_service.py`, `backend/app/models/identity.py`  
> **Database Tables:** `identities`, `refresh_sessions`, `social_accounts`, `password_reset_tokens`, `email_verification_tokens`  

---

## 1. Department Role & Mission

This department owns the security perimeter of Belooga: credentials management, password hashing via Argon2id, cryptographically secure JWT issuance, and **Token Family Refresh Vault** with automated token reuse/replay detection.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Downstream (Outputs to)** | `be-service-profile` | Identity creation automatically provisions a row in `candidate_profiles` linked via `identity_id` |
| **Downstream (Outputs to)** | `fe-page-auth` | Serves `/v1/auth/login/`, `/v1/users/register/`, `/v1/auth/refresh/` |
| **Upstream (Depends on)** | `identities` table | Master primary key UUID identifying all actors in the platform |

---

## 3. Database Models Specification (SQLAlchemy 2.0 Async)

```python
# backend/app/models/identity.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Identity(Base):
    __tablename__ = "identities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="candidate")
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(back_populates="identity", cascade="all, delete-orphan")
    profile: Mapped["CandidateProfile"] = relationship(back_populates="identity", uselist=False)

class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    identity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("identities.id", ondelete="CASCADE"), index=True)
    family_id: Mapped[uuid.UUID] = mapped_column(index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    identity: Mapped["Identity"] = relationship(back_populates="refresh_sessions")
```

---

## 4. Token Family Rotation & Replay Protection Protocol

To prevent token theft and replay attacks:
1. Every login allocates a new `family_id` (UUID).
2. Refreshing an access token revokes the previous refresh token and issues a child token sharing the same `family_id`.
3. If an already-revoked refresh token is ever submitted, **the entire token family is immediately revoked**, invalidating all sessions across all devices for that user.
