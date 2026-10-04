"""Authentication and identity endpoints (Thin Controller).

Security Invariant:
- Concurrency & Replay Protection: Enforces FOR UPDATE lock on refresh_sessions,
  a 15s grace window for concurrent requests, and delete_cookie upon family revocation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.auth import (
    CheckAvailabilityResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileDTO,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/users/exists/email/", response_model=CheckAvailabilityResponse, tags=["Domain 1: Identity & Sessions"])
async def check_email_exists(
    email: str = Query(..., description="Email address to check"),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.check_email_availability(email)


@router.get("/users/exists/username/", response_model=CheckAvailabilityResponse, tags=["Domain 1: Identity & Sessions"])
async def check_username_exists(
    username: str = Query(..., description="Username to check"),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.check_username_availability(username)


@router.post("/users/register/", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 1: Identity & Sessions"])
async def register_user(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.register_user(payload, response)


@router.post("/auth/login/", response_model=TokenResponse, tags=["Domain 1: Identity & Sessions"])
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.login(payload, response)


@router.post("/auth/refresh/", response_model=TokenResponse, tags=["Domain 1: Identity & Sessions"])
async def refresh_tokens(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get("belooga_refresh_token")
    service = AuthService(db)
    return await service.refresh_tokens(refresh_token, response)


@router.get("/auth/me/", response_model=UserProfileDTO, tags=["Domain 1: Identity & Sessions"])
async def get_current_session_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.get_current_session_user(current_user.id)


@router.post("/auth/logout/", tags=["Domain 1: Identity & Sessions"])
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get("belooga_refresh_token")
    service = AuthService(db)
    return await service.logout(refresh_token, response)
