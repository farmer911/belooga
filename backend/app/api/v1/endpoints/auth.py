"""Authentication and identity endpoints (Thin Controller).

Security Invariant:
- Concurrency & Replay Protection: Enforces FOR UPDATE lock on refresh_sessions,
  a 15s grace window for concurrent requests, and delete_cookie upon family revocation.
"""

from typing import Optional
from fastapi import APIRouter, Body, Depends, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.auth import (
    ChangePasswordRequest,
    CheckAvailabilityResponse,
    EmailVerificationRequestResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    OAuthCallbackRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserProfileDTO,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.modules.auth import AuthService

router = APIRouter()


def _extract_refresh_token(request: Request, payload: Optional[RefreshTokenRequest]) -> Optional[str]:
    if payload and payload.refresh_token:
        return payload.refresh_token.strip()
    return request.cookies.get("belooga_refresh_token") or request.headers.get("X-Refresh-Token")


@router.get("/users/exists/email/", response_model=CheckAvailabilityResponse, tags=["Domain 1: Identity & Sessions"])
async def check_email_exists(
    email: str = Query(..., description="Email address to check"),
    db: AsyncSession = Depends(get_read_db),
):
    return await AuthService(db).check_email_availability(email)


@router.get("/users/exists/username/", response_model=CheckAvailabilityResponse, tags=["Domain 1: Identity & Sessions"])
async def check_username_exists(
    username: str = Query(..., description="Username to check"),
    db: AsyncSession = Depends(get_read_db),
):
    return await AuthService(db).check_username_availability(username)


@router.post("/users/register/", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 1: Identity & Sessions"])
async def register_user(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).register_user(payload, response)


@router.post("/auth/login/", response_model=TokenResponse, tags=["Domain 1: Identity & Sessions"])
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).login(payload, response)


@router.post("/auth/refresh/", response_model=TokenResponse, tags=["Domain 1: Identity & Sessions"])
async def refresh_tokens(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = Body(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).refresh_tokens(_extract_refresh_token(request, payload), response)


@router.get("/auth/me/", response_model=UserProfileDTO, tags=["Domain 1: Identity & Sessions"])
async def get_current_session_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    return await AuthService(db).get_current_session_user(current_user.id)


@router.post("/auth/logout/", response_model=dict[str, str], tags=["Domain 1: Identity & Sessions"])
async def logout(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = Body(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).logout(_extract_refresh_token(request, payload), response)


@router.post("/auth/forgot-password/", response_model=ForgotPasswordResponse, tags=["Domain 1: Identity & Sessions"])
async def request_password_reset(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).request_password_reset(payload)


@router.post("/auth/reset-password/", response_model=dict[str, str], tags=["Domain 1: Identity & Sessions"])
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).reset_password(payload)


@router.post("/auth/verify-email/request/", response_model=EmailVerificationRequestResponse, tags=["Domain 1: Identity & Sessions"])
async def request_email_verification(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).request_email_verification(current_user)


@router.post("/auth/verify-email/", response_model=VerifyEmailResponse, tags=["Domain 1: Identity & Sessions"])
async def verify_email_token(
    payload: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).verify_email_token(payload)


@router.post("/users/{username}/password/", response_model=dict[str, str], tags=["Domain 1: Identity & Sessions"])
async def change_user_password(
    username: str,
    payload: ChangePasswordRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).change_user_password(username, payload, current_user)


@router.delete("/users/{username}/", response_model=dict[str, str], tags=["Domain 1: Identity & Sessions"])
async def delete_user_account(
    username: str,
    response: Response,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).delete_user_account(username, current_user, response)


@router.post("/auth/oauth/callback/", response_model=TokenResponse, tags=["Domain 1: Identity & Sessions"])
async def oauth_callback(
    payload: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService(db).oauth_callback(payload, response)
