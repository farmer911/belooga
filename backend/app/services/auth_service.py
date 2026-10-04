"""Authentication service.

Business domain service orchestrating login, registration, JWT issuance,
and refresh token family rotation with replay attack mitigation.
"""

from datetime import datetime, timedelta, timezone
import os
from typing import Any, Optional, Union
import uuid

from fastapi import HTTPException, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    generate_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.repositories.identity_repo import IdentityRepository
from app.repositories.profile_repo import ProfileRepository
from app.schemas.auth import (
    CheckAvailabilityResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileDTO,
)

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() in ("production", "prod", "staging")


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key="belooga_refresh_token",
        value=raw_token,
        httponly=True,
        samesite="lax",
        secure=IS_PRODUCTION,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def _build_user_dto(row: Any, fallback_username: str = "", fallback_email: str = "") -> UserProfileDTO:
    return UserProfileDTO(
        id=row.id,
        email=getattr(row, "email", fallback_email) or fallback_email,
        username=getattr(row, "username", fallback_username) or fallback_username,
        first_name=getattr(row, "first_name", "") or "",
        last_name=getattr(row, "last_name", "") or "",
        role=getattr(row, "role", "candidate") or "candidate",
        avatar_url=getattr(row, "avatar_url", "/images/avatar.jpg") or "/images/avatar.jpg",
    )


class AuthService:
    """Service layer coordinating identity authentication and token vault lifecycle."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.identity_repo = IdentityRepository(db)
        self.profile_repo = ProfileRepository(db)

    async def check_email_availability(self, email: str) -> CheckAvailabilityResponse:
        existing = await self.identity_repo.get_by_email(email)
        exists = existing is not None
        return CheckAvailabilityResponse(exists=exists, available=not exists)

    async def check_username_availability(self, username: str) -> CheckAvailabilityResponse:
        existing = await self.profile_repo.get_by_username(username)
        exists = existing is not None
        return CheckAvailabilityResponse(exists=exists, available=not exists)

    async def register_user(self, payload: RegisterRequest, response: Response) -> TokenResponse:
        clean_email = payload.email.lower().strip()
        clean_username = payload.username.lower().strip()

        if await self.identity_repo.get_by_email(clean_email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
        if await self.profile_repo.get_by_username(clean_username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")

        identity_id = uuid.uuid4()
        profile_id = uuid.uuid4()
        family_id = uuid.uuid4()

        await self.identity_repo.create_identity(
            identity_id=identity_id,
            email=clean_email,
            password_hash=get_password_hash(payload.password),
            role="candidate",
            status="active",
        )
        await self.profile_repo.create_profile(
            profile_id=profile_id,
            identity_id=identity_id,
            username=clean_username,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        raw_refresh = generate_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        await self.identity_repo.create_refresh_session(
            identity_id=identity_id,
            family_id=family_id,
            token_hash=hash_token(raw_refresh),
            expires_at=expires_at,
        )
        await self.db.commit()

        access_token = create_access_token({
            "sub": str(identity_id), "username": clean_username, "email": clean_email, "role": "candidate"
        })
        _set_refresh_cookie(response, raw_refresh)

        user_dto = UserProfileDTO(
            id=identity_id, email=clean_email, username=clean_username,
            first_name=payload.first_name.strip(), last_name=payload.last_name.strip(),
            role="candidate", avatar_url="/images/avatar.jpg"
        )
        return TokenResponse(access_token=access_token, token_type="bearer", user=user_dto)

    async def login(self, payload: LoginRequest, response: Response) -> TokenResponse:
        clean_email = payload.email.lower().strip()
        user_row = await self.identity_repo.get_identity_with_profile_by_email(clean_email)

        if not user_row or not verify_password(payload.password, user_row.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        if user_row.status == "suspended":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been suspended")

        raw_refresh = generate_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        await self.identity_repo.create_refresh_session(
            identity_id=user_row.id,
            family_id=uuid.uuid4(),
            token_hash=hash_token(raw_refresh),
            expires_at=expires_at,
        )
        await self.db.commit()

        access_token = create_access_token({
            "sub": str(user_row.id), "username": user_row.username, "email": user_row.email, "role": user_row.role
        })
        _set_refresh_cookie(response, raw_refresh)
        user_dto = _build_user_dto(user_row)
        return TokenResponse(access_token=access_token, token_type="bearer", user=user_dto)

    async def refresh_tokens(
        self, refresh_token: Optional[str], response: Response
    ) -> Union[TokenResponse, JSONResponse]:
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing from cookies")

        token_hash_val = hash_token(refresh_token)
        session_row = await self.identity_repo.get_refresh_session_for_update(token_hash_val)
        if not session_row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        now = datetime.now(timezone.utc)
        if session_row.revoked_at is not None:
            revoked_at = session_row.revoked_at
            if revoked_at.tzinfo is None:
                revoked_at = revoked_at.replace(tzinfo=timezone.utc)
            if (now - revoked_at).total_seconds() > 15:
                await self.identity_repo.revoke_family(session_row.family_id)
                await self.db.commit()
                revoked_resp = JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Token reuse detected. Session family revoked."},
                )
                revoked_resp.delete_cookie("belooga_refresh_token", httponly=True, samesite="lax", secure=IS_PRODUCTION)
                return revoked_resp
            else:
                await self.db.commit()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token was recently refreshed. Please retry with current session.",
                )

        expires_at = session_row.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired")

        user_row = await self.identity_repo.get_identity_with_profile_by_id(session_row.identity_id)
        if not user_row or user_row.status == "suspended":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive or suspended")

        await self.identity_repo.revoke_session(session_row.id)
        new_raw_refresh = generate_refresh_token()
        new_expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        await self.identity_repo.create_refresh_session(
            identity_id=session_row.identity_id,
            family_id=session_row.family_id,
            token_hash=hash_token(new_raw_refresh),
            expires_at=new_expires_at,
        )
        await self.db.commit()

        username = user_row.username or ""
        access_token = create_access_token({
            "sub": str(user_row.id), "username": username, "email": user_row.email, "role": user_row.role
        })
        _set_refresh_cookie(response, new_raw_refresh)
        user_dto = _build_user_dto(user_row)
        return TokenResponse(access_token=access_token, token_type="bearer", user=user_dto)

    async def get_current_session_user(self, user_id: uuid.UUID) -> UserProfileDTO:
        row = await self.identity_repo.get_identity_with_profile_by_id(user_id)
        if not row:
            raise HTTPException(status_code=404, detail="User profile not found")
        return _build_user_dto(row)

    async def logout(self, refresh_token: Optional[str], response: Response) -> dict:
        if refresh_token:
            await self.identity_repo.revoke_by_token_hash(hash_token(refresh_token))
            await self.db.commit()
        response.delete_cookie("belooga_refresh_token", httponly=True, samesite="lax", secure=IS_PRODUCTION)
        return {"message": "Successfully logged out"}
