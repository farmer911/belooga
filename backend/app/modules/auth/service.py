"""Authentication service (Vertical Module: auth).

Business domain service orchestrating login, registration, JWT issuance,
OAuth SSO linking, password recovery, email verification, and refresh token rotation.
"""

from datetime import datetime, timedelta, timezone
import os
from typing import Any, Optional, Union
import uuid

from fastapi import HTTPException, Response, status
import httpx
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    AuthenticatedUser,
    create_access_token,
    generate_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
    verify_profile_owner,
)
from app.modules.auth.repository import IdentityRepository
from app.modules.notifications import NotificationService
from app.modules.profile import ProfileService
from app.schemas.auth import (
    ChangePasswordRequest, CheckAvailabilityResponse, EmailVerificationRequestResponse,
    ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, OAuthCallbackRequest,
    RegisterRequest, ResetPasswordRequest, TokenResponse, UserProfileDTO,
    VerifyEmailRequest, VerifyEmailResponse,
)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() in ("production", "prod", "staging")


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key="belooga_refresh_token", value=raw_token, httponly=True,
        samesite="lax", secure=IS_PRODUCTION, max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def _build_user_dto(row: Any, fallback_username: str = "", fallback_email: str = "") -> UserProfileDTO:
    return UserProfileDTO(
        id=row.id, email=getattr(row, "email", fallback_email) or fallback_email,
        username=getattr(row, "username", fallback_username) or fallback_username,
        first_name=getattr(row, "first_name", "") or "", last_name=getattr(row, "last_name", "") or "",
        role=getattr(row, "role", "candidate") or "candidate",
        avatar_url=getattr(row, "avatar_url", None) or "/images/avatar.jpg",
    )


async def fetch_google_identity(code: str, redirect_uri: str, code_verifier: Optional[str]) -> dict:
    """Exchange a Google authorization code and return the verified OpenID userinfo claims."""
    client_id, client_secret = os.getenv("GOOGLE_CLIENT_ID"), os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google sign-in is not configured")
    form = {
        "code": code, "client_id": client_id, "client_secret": client_secret,
        "redirect_uri": redirect_uri, "grant_type": "authorization_code",
    }
    if code_verifier:
        form["code_verifier"] = code_verifier
    async with httpx.AsyncClient(timeout=10) as client:
        token_res = await client.post(GOOGLE_TOKEN_URL, data=form)
        if token_res.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google authorization code")
        info_res = await client.get(
            GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {token_res.json()['access_token']}"}
        )
    if info_res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google userinfo request failed")
    return info_res.json()


def _ensure_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class AuthService:
    """Service layer coordinating identity authentication and token vault lifecycle."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.identity_repo = IdentityRepository(db)
        self.profile_facade = ProfileService(db)

    async def _issue_session(
        self, user_dto: UserProfileDTO, response: Response, family_id: Optional[uuid.UUID] = None
    ) -> TokenResponse:
        raw_refresh = generate_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        await self.identity_repo.create_refresh_session(
            identity_id=user_dto.id, family_id=family_id or uuid.uuid4(),
            token_hash=hash_token(raw_refresh), expires_at=expires_at,
        )
        await self.db.commit()
        access_token = create_access_token({
            "sub": str(user_dto.id), "username": user_dto.username,
            "email": user_dto.email, "role": user_dto.role,
        })
        _set_refresh_cookie(response, raw_refresh)
        return TokenResponse(access_token=access_token, refresh_token=raw_refresh, token_type="bearer", user=user_dto)

    async def check_email_availability(self, email: str) -> CheckAvailabilityResponse:
        existing = await self.identity_repo.get_by_email(email)
        return CheckAvailabilityResponse(exists=existing is not None, available=existing is None)

    async def check_username_availability(self, username: str) -> CheckAvailabilityResponse:
        existing = await self.profile_facade.get_by_username(username)
        return CheckAvailabilityResponse(exists=existing is not None, available=existing is None)

    async def register_user(self, payload: RegisterRequest, response: Response) -> TokenResponse:
        clean_email = payload.email.lower().strip()
        clean_username = payload.username.lower().strip()
        if await self.identity_repo.get_by_email(clean_email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
        if await self.profile_facade.get_by_username(clean_username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")

        identity_id = uuid.uuid4()
        await self.identity_repo.create_identity(
            identity_id=identity_id, email=clean_email,
            password_hash=get_password_hash(payload.password), role="candidate", status="active",
        )
        await self.profile_facade.create_initial_profile(
            profile_id=uuid.uuid4(), identity_id=identity_id, username=clean_username,
            first_name=payload.first_name, last_name=payload.last_name,
        )
        raw_verify = generate_refresh_token()
        await self.identity_repo.create_email_verification_token(
            identity_id, hash_token(raw_verify), datetime.now(timezone.utc) + timedelta(hours=24)
        )
        user_dto = UserProfileDTO(
            id=identity_id, email=clean_email, username=clean_username,
            first_name=payload.first_name.strip(), last_name=payload.last_name.strip(),
            role="candidate", avatar_url="/images/avatar.jpg",
        )
        return await self._issue_session(user_dto, response)

    async def login(self, payload: LoginRequest, response: Response) -> TokenResponse:
        user_row = await self.identity_repo.get_identity_with_profile_by_email(payload.email.lower().strip())
        if not user_row or not verify_password(payload.password, user_row.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        if user_row.status == "suspended":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been suspended")
        return await self._issue_session(_build_user_dto(user_row), response)

    async def oauth_callback(self, payload: OAuthCallbackRequest, response: Response) -> TokenResponse:
        provider = payload.provider.lower().strip()
        if provider != "google":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported OAuth provider: {provider}")
        info = await fetch_google_identity(payload.code, payload.redirect_uri, payload.code_verifier)
        puid = str(info.get("sub") or "")
        email = str(info.get("email") or "").lower().strip()
        if not puid or not email or info.get("email_verified") is not True:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account has no verified email")

        user_row = await self.identity_repo.get_identity_by_social_account(provider, puid)
        if not user_row:
            user_row = await self.identity_repo.get_identity_with_profile_by_email(email)
        if user_row:
            if user_row.status == "suspended":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been suspended")
            await self.identity_repo.link_social_account(user_row.id, provider, puid)
            return await self._issue_session(_build_user_dto(user_row), response)

        identity_id = uuid.uuid4()
        username = f"user_{hash_token(f'{provider}:{puid}')[:10]}"
        first_name = str(info.get("given_name") or "Belooga")[:100]
        last_name = str(info.get("family_name") or "Candidate")[:100]
        await self.identity_repo.create_identity(
            identity_id=identity_id, email=email, password_hash="", role="candidate", status="active"
        )
        await self.profile_facade.create_initial_profile(
            profile_id=uuid.uuid4(), identity_id=identity_id, username=username,
            first_name=first_name, last_name=last_name,
        )
        await self.identity_repo.link_social_account(identity_id, provider, puid)
        user_dto = UserProfileDTO(
            id=identity_id, email=email, username=username, first_name=first_name, last_name=last_name,
            role="candidate", avatar_url="/images/avatar.jpg",
        )
        return await self._issue_session(user_dto, response)

    async def refresh_tokens(
        self, refresh_token: Optional[str], response: Response
    ) -> Union[TokenResponse, JSONResponse]:
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing from cookies")
        session_row = await self.identity_repo.get_refresh_session_for_update(hash_token(refresh_token))
        if not session_row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        now = datetime.now(timezone.utc)
        if session_row.revoked_at is not None:
            if (now - _ensure_utc(session_row.revoked_at)).total_seconds() > 15:
                await self.identity_repo.revoke_family(session_row.family_id)
                await self.db.commit()
                revoked_resp = JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Token reuse detected. Session family revoked."},
                )
                revoked_resp.delete_cookie("belooga_refresh_token", httponly=True, samesite="lax", secure=IS_PRODUCTION)
                return revoked_resp
            await self.db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token was recently refreshed. Please retry with current session.")

        if _ensure_utc(session_row.expires_at) < now:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired")

        user_row = await self.identity_repo.get_identity_with_profile_by_id(session_row.identity_id)
        if not user_row or user_row.status == "suspended":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive or suspended")

        await self.identity_repo.revoke_session(session_row.id)
        return await self._issue_session(_build_user_dto(user_row), response, family_id=session_row.family_id)

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

    async def request_password_reset(self, payload: ForgotPasswordRequest) -> ForgotPasswordResponse:
        identity = await self.identity_repo.get_by_email(payload.email)
        raw_token: Optional[str] = None
        if identity:
            raw_token = generate_refresh_token()
            await self.identity_repo.create_password_reset_token(
                identity.id, hash_token(raw_token), datetime.now(timezone.utc) + timedelta(minutes=30)
            )
            await NotificationService(self.db).dispatch_event(
                identity.id, "AUTH_PASSWORD_RESET", "Password Recovery Link Issued",
                "Use the secure token link below within 30 minutes to reset your Belooga password.",
                f"/forgot-password?token={raw_token}&email={identity.email}", True, "security", identity.email, False,
            )
            await self.db.commit()
        return ForgotPasswordResponse(
            message="If the email is registered, a password recovery token has been issued.",
            reset_token=None if IS_PRODUCTION else raw_token,
        )

    async def reset_password(self, payload: ResetPasswordRequest) -> dict[str, str]:
        row = await self.identity_repo.get_reset_token_for_update(hash_token(payload.token.strip()))
        if not row or row.used_at is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already used reset token")
        if _ensure_utc(row.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset token has expired")
        await self.identity_repo.mark_reset_token_used_and_rotate_password(
            row.id, row.identity_id, get_password_hash(payload.new_password)
        )
        await self.db.commit()
        return {"message": "Password has been reset successfully"}

    async def request_email_verification(self, current_user: AuthenticatedUser) -> EmailVerificationRequestResponse:
        raw_token = generate_refresh_token()
        await self.identity_repo.create_email_verification_token(
            current_user.id, hash_token(raw_token), datetime.now(timezone.utc) + timedelta(hours=24)
        )
        await NotificationService(self.db).dispatch_event(
            current_user.id, "AUTH_EMAIL_VERIFICATION", "Verify Your Belooga Email",
            "Confirm your email address to activate verified candidate badge.",
            f"/user/{current_user.username}/settings?verify_token={raw_token}", True, "security", current_user.email, False,
        )
        await self.db.commit()
        return EmailVerificationRequestResponse(
            message="Verification link dispatched to your registered email.",
            verification_token=None if IS_PRODUCTION else raw_token,
        )

    async def verify_email_token(self, payload: VerifyEmailRequest) -> VerifyEmailResponse:
        row = await self.identity_repo.consume_email_verification_token(hash_token(payload.token.strip()))
        if not row:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already used verification token")
        if _ensure_utc(row.expires_at) < datetime.now(timezone.utc):
            await self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token has expired")
        await self.db.commit()
        return VerifyEmailResponse(message="Email verified successfully", verified=True)

    async def change_user_password(
        self, username: str, payload: ChangePasswordRequest, current_user: AuthenticatedUser
    ) -> dict[str, str]:
        verify_profile_owner(current_user, username)
        identity = await self.identity_repo.get_by_id(current_user.id)
        if not identity or not verify_password(payload.current_password, identity.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        await self.identity_repo.rotate_password_and_revoke_sessions(
            current_user.id, get_password_hash(payload.new_password)
        )
        await NotificationService(self.db).dispatch_event(
            current_user.id, "AUTH_PASSWORD_CHANGED", "Security Alert: Password Updated",
            "Your account password was changed and active sessions were rotated.",
            f"/user/{username}/settings", True, "security", identity.email, False,
        )
        await self.db.commit()
        return {"message": "Password updated successfully"}

    async def delete_user_account(
        self, username: str, current_user: AuthenticatedUser, response: Response
    ) -> dict[str, str]:
        verify_profile_owner(current_user, username)
        await self.identity_repo.delete_identity(current_user.id)
        await self.db.commit()
        response.delete_cookie("belooga_refresh_token", httponly=True, samesite="lax", secure=IS_PRODUCTION)
        return {"message": "Account permanently deleted"}
