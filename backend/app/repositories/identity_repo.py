"""Identity and session repository.

Data access layer for identities, refresh sessions, and authentication tokens.
"""

from datetime import datetime, timezone
from typing import Optional, Tuple
import uuid

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity import Identity, RefreshSession
from app.models.profile import CandidateProfile


class IdentityRepository:
    """Repository handling database operations for Identity and RefreshSession entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[Identity]:
        stmt = select(Identity).where(Identity.email == email.lower().strip())
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_id(self, identity_id: uuid.UUID) -> Optional[Identity]:
        stmt = select(Identity).where(Identity.id == identity_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_identity(
        self,
        identity_id: uuid.UUID,
        email: str,
        password_hash: str,
        role: str = "candidate",
        status: str = "active",
    ) -> Identity:
        identity = Identity(
            id=identity_id,
            email=email.lower().strip(),
            password_hash=password_hash,
            role=role,
            status=status,
        )
        self.db.add(identity)
        await self.db.flush()
        return identity

    async def get_identity_with_profile_by_email(self, email: str):
        query = text("""
            SELECT i.id, i.email, i.password_hash, i.role, i.status,
                   p.username, p.first_name, p.last_name
            FROM identities i
            JOIN candidate_profiles p ON p.identity_id = i.id
            WHERE i.email = :email
            LIMIT 1
        """)
        res = await self.db.execute(query, {"email": email.lower().strip()})
        return res.fetchone()

    async def get_identity_with_profile_by_id(self, identity_id: uuid.UUID):
        query = text("""
            SELECT i.id, i.email, i.role, i.status,
                   p.username, p.first_name, p.last_name, p.avatar_url
            FROM identities i
            LEFT JOIN candidate_profiles p ON p.identity_id = i.id
            WHERE i.id = :uid
            LIMIT 1
        """)
        res = await self.db.execute(query, {"uid": identity_id})
        return res.fetchone()

    async def create_refresh_session(
        self,
        identity_id: uuid.UUID,
        family_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshSession:
        session = RefreshSession(
            id=uuid.uuid4(),
            identity_id=identity_id,
            family_id=family_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_refresh_session_for_update(self, token_hash: str):
        query = text("""
            SELECT id, identity_id, family_id, expires_at, revoked_at
            FROM refresh_sessions
            WHERE token_hash = :hash
            FOR UPDATE
        """)
        res = await self.db.execute(query, {"hash": token_hash})
        return res.fetchone()

    async def revoke_session(self, session_id: uuid.UUID) -> None:
        stmt = (
            update(RefreshSession)
            .where(RefreshSession.id == session_id)
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await self.db.execute(stmt)

    async def revoke_family(self, family_id: uuid.UUID) -> None:
        stmt = (
            update(RefreshSession)
            .where(RefreshSession.family_id == family_id, RefreshSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await self.db.execute(stmt)

    async def revoke_by_token_hash(self, token_hash: str) -> None:
        stmt = (
            update(RefreshSession)
            .where(RefreshSession.token_hash == token_hash)
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await self.db.execute(stmt)
