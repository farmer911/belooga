"""Identity and session repository (Vertical Module: auth).

Data access layer for identities, refresh sessions, password reset, and email verification tokens.
"""

from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import delete, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity import (
    EmailVerificationToken,
    Identity,
    PasswordResetToken,
    RefreshSession,
)


class IdentityRepository:
    """Repository handling database operations for Identity and RefreshSession entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[Identity]:
        stmt = select(Identity).where(Identity.email == email.lower().strip())
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_id(self, identity_id: uuid.UUID) -> Optional[Identity]:
        stmt = select(Identity).where(Identity.id == identity_id)
        return (await self.db.execute(stmt)).scalar_one_or_none()

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
                   p.username, p.first_name, p.last_name, p.avatar_url
            FROM identities i
            LEFT JOIN candidate_profiles p ON p.identity_id = i.id
            WHERE i.email = :email
            LIMIT 1
        """)
        return (await self.db.execute(query, {"email": email.lower().strip()})).fetchone()

    async def get_identity_with_profile_by_id(self, identity_id: uuid.UUID):
        query = text("""
            SELECT i.id, i.email, i.role, i.status,
                   p.username, p.first_name, p.last_name, p.avatar_url
            FROM identities i
            LEFT JOIN candidate_profiles p ON p.identity_id = i.id
            WHERE i.id = :uid
            LIMIT 1
        """)
        return (await self.db.execute(query, {"uid": identity_id})).fetchone()

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
        return (await self.db.execute(query, {"hash": token_hash})).fetchone()

    async def revoke_session(self, session_id: uuid.UUID) -> None:
        await self.db.execute(
            update(RefreshSession)
            .where(RefreshSession.id == session_id)
            .values(revoked_at=datetime.now(timezone.utc))
        )

    async def revoke_family(self, family_id: uuid.UUID) -> None:
        await self.db.execute(
            update(RefreshSession)
            .where(RefreshSession.family_id == family_id, RefreshSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )

    async def revoke_by_token_hash(self, token_hash: str) -> None:
        await self.db.execute(
            update(RefreshSession)
            .where(RefreshSession.token_hash == token_hash)
            .values(revoked_at=datetime.now(timezone.utc))
        )

    async def create_password_reset_token(
        self, identity_id: uuid.UUID, token_hash: str, expires_at: datetime
    ) -> PasswordResetToken:
        reset_row = PasswordResetToken(
            id=uuid.uuid4(),
            identity_id=identity_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(reset_row)
        await self.db.flush()
        return reset_row

    async def get_reset_token_for_update(self, token_hash: str):
        query = text("""
            SELECT id, identity_id, expires_at, used_at
            FROM password_reset_tokens
            WHERE token_hash = :hash
            FOR UPDATE
        """)
        return (await self.db.execute(query, {"hash": token_hash})).fetchone()

    async def mark_reset_token_used_and_rotate_password(
        self, token_id: uuid.UUID, identity_id: uuid.UUID, new_password_hash: str
    ) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(PasswordResetToken).where(PasswordResetToken.id == token_id).values(used_at=now)
        )
        await self.rotate_password_and_revoke_sessions(identity_id, new_password_hash)

    async def rotate_password_and_revoke_sessions(
        self, identity_id: uuid.UUID, new_password_hash: str
    ) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(Identity).where(Identity.id == identity_id).values(password_hash=new_password_hash, updated_at=now)
        )
        await self.db.execute(
            update(RefreshSession)
            .where(RefreshSession.identity_id == identity_id, RefreshSession.revoked_at.is_(None))
            .values(revoked_at=now)
        )

    async def create_email_verification_token(
        self, identity_id: uuid.UUID, token_hash: str, expires_at: datetime
    ) -> EmailVerificationToken:
        row = EmailVerificationToken(
            id=uuid.uuid4(),
            identity_id=identity_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def consume_email_verification_token(self, token_hash: str):
        query = text("""
            DELETE FROM email_verification_tokens
            WHERE token_hash = :hash
            RETURNING id, identity_id, expires_at
        """)
        row = (await self.db.execute(query, {"hash": token_hash})).fetchone()
        if row:
            await self.db.execute(
                update(Identity)
                .where(Identity.id == row.identity_id)
                .values(status="active", updated_at=datetime.now(timezone.utc))
            )
        return row

    async def delete_identity(self, identity_id: uuid.UUID) -> None:
        await self.db.execute(delete(Identity).where(Identity.id == identity_id))

    async def get_identity_by_social_account(self, provider: str, provider_user_id: str):
        query = text("""
            SELECT i.id, i.email, i.role, i.status,
                   p.username, p.first_name, p.last_name, p.avatar_url
            FROM social_accounts s
            JOIN identities i ON i.id = s.identity_id
            LEFT JOIN candidate_profiles p ON p.identity_id = i.id
            WHERE s.provider = :provider AND s.provider_user_id = :puid
            LIMIT 1
        """)
        return (
            await self.db.execute(query, {"provider": provider.lower().strip(), "puid": provider_user_id})
        ).fetchone()

    async def link_social_account(
        self, identity_id: uuid.UUID, provider: str, provider_user_id: str
    ) -> None:
        await self.db.execute(
            text("""
                INSERT INTO social_accounts (id, identity_id, provider, provider_user_id)
                VALUES (:id, :uid, :provider, :puid)
                ON CONFLICT (provider, provider_user_id) DO NOTHING
            """),
            {"id": uuid.uuid4(), "uid": identity_id, "provider": provider.lower().strip(), "puid": provider_user_id},
        )
