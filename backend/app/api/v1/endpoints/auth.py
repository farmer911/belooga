import os
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() in ("production", "prod", "staging")

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_refresh_token,
    hash_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
    get_current_user,
    AuthenticatedUser,
)
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileDTO,
    CheckAvailabilityResponse,
)

router = APIRouter()

@router.get("/users/exists/email/", response_model=CheckAvailabilityResponse, tags=["Domain 1: Identity & Sessions"])
async def check_email_exists(
    email: str = Query(..., description="Email address to check"),
    db: AsyncSession = Depends(get_db)
):
    query = text("SELECT id FROM identities WHERE email = :email LIMIT 1")
    result = await db.execute(query, {"email": email.lower().strip()})
    row = result.fetchone()
    exists = row is not None
    return CheckAvailabilityResponse(exists=exists, available=not exists)

@router.get("/users/exists/username/", response_model=CheckAvailabilityResponse, tags=["Domain 1: Identity & Sessions"])
async def check_username_exists(
    username: str = Query(..., description="Username to check"),
    db: AsyncSession = Depends(get_db)
):
    query = text("SELECT id FROM candidate_profiles WHERE username = :username LIMIT 1")
    result = await db.execute(query, {"username": username.lower().strip()})
    row = result.fetchone()
    exists = row is not None
    return CheckAvailabilityResponse(exists=exists, available=not exists)

@router.post("/users/register/", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Domain 1: Identity & Sessions"])
async def register_user(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    clean_email = payload.email.lower().strip()
    clean_username = payload.username.lower().strip()

    # Check duplicate email
    chk_email = await db.execute(text("SELECT id FROM identities WHERE email = :email"), {"email": clean_email})
    if chk_email.fetchone():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    # Check duplicate username
    chk_user = await db.execute(text("SELECT id FROM candidate_profiles WHERE username = :username"), {"username": clean_username})
    if chk_user.fetchone():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")

    # Insert Identity
    identity_id = uuid.uuid4()
    hashed_pwd = get_password_hash(payload.password)
    
    await db.execute(
        text("""
            INSERT INTO identities (id, email, password_hash, role, status)
            VALUES (:id, :email, :password_hash, 'candidate', 'active')
        """),
        {"id": identity_id, "email": clean_email, "password_hash": hashed_pwd}
    )

    # Insert Candidate Profile
    profile_id = uuid.uuid4()
    await db.execute(
        text("""
            INSERT INTO candidate_profiles (
                id, identity_id, username, first_name, last_name,
                headline, bio, is_hidden, is_fresh, submitted
            )
            VALUES (
                :id, :identity_id, :username, :first_name, :last_name,
                'Candidate', '', FALSE, TRUE, FALSE
            )
        """),
        {
            "id": profile_id,
            "identity_id": identity_id,
            "username": clean_username,
            "first_name": payload.first_name.strip(),
            "last_name": payload.last_name.strip(),
        }
    )

    # Generate Token Pair with Family Vault
    family_id = uuid.uuid4()
    raw_refresh = generate_refresh_token()
    token_hash_val = hash_token(raw_refresh)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    await db.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at)
            VALUES (:identity_id, :family_id, :token_hash, :expires_at)
        """),
        {
            "identity_id": identity_id,
            "family_id": family_id,
            "token_hash": token_hash_val,
            "expires_at": expires_at,
        }
    )

    await db.commit()

    access_token = create_access_token({
        "sub": str(identity_id),
        "username": clean_username,
        "email": clean_email,
        "role": "candidate"
    })

    # Set HttpOnly Cookie
    response.set_cookie(
        key="belooga_refresh_token",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=IS_PRODUCTION,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

    user_dto = UserProfileDTO(
        id=identity_id,
        email=clean_email,
        username=clean_username,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        role="candidate",
        avatar_url="/images/avatar.jpg"
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_dto)

@router.post("/auth/login/", response_model=TokenResponse, tags=["Domain 1: Identity & Sessions"])
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    clean_email = payload.email.lower().strip()

    # Query identity and candidate profile
    query = text("""
        SELECT i.id, i.email, i.password_hash, i.role, i.status,
               p.username, p.first_name, p.last_name
        FROM identities i
        JOIN candidate_profiles p ON p.identity_id = i.id
        WHERE i.email = :email
        LIMIT 1
    """)
    res = await db.execute(query, {"email": clean_email})
    user_row = res.fetchone()

    if not user_row or not verify_password(payload.password, user_row.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if user_row.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended"
        )

    # Issue Refresh Token in new Family
    identity_id = user_row.id
    family_id = uuid.uuid4()
    raw_refresh = generate_refresh_token()
    token_hash_val = hash_token(raw_refresh)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    await db.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at)
            VALUES (:identity_id, :family_id, :token_hash, :expires_at)
        """),
        {
            "identity_id": identity_id,
            "family_id": family_id,
            "token_hash": token_hash_val,
            "expires_at": expires_at,
        }
    )
    await db.commit()

    access_token = create_access_token({
        "sub": str(identity_id),
        "username": user_row.username,
        "email": user_row.email,
        "role": user_row.role
    })

    response.set_cookie(
        key="belooga_refresh_token",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=IS_PRODUCTION,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

    user_dto = UserProfileDTO(
        id=identity_id,
        email=user_row.email,
        username=user_row.username,
        first_name=user_row.first_name,
        last_name=user_row.last_name,
        role=user_row.role,
        avatar_url="/images/avatar.jpg"
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_dto)

@router.post("/auth/refresh/", response_model=TokenResponse, tags=["Domain 1: Identity & Sessions"])
async def refresh_tokens(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("belooga_refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing from cookies"
        )

    token_hash_val = hash_token(refresh_token)

    # 1. Query existing session by token hash with pessimistic lock to prevent race conditions
    query = text("""
        SELECT id, identity_id, family_id, expires_at, revoked_at
        FROM refresh_sessions
        WHERE token_hash = :hash
        FOR UPDATE
    """)
    res = await db.execute(query, {"hash": token_hash_val})
    session_row = res.fetchone()

    if not session_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    now = datetime.now(timezone.utc)

    # 2. Replay Attack Detection with Grace Window for Concurrent Tabs
    if session_row.revoked_at is not None:
        revoked_at = session_row.revoked_at
        if revoked_at.tzinfo is None:
            revoked_at = revoked_at.replace(tzinfo=timezone.utc)
        elapsed = (now - revoked_at).total_seconds()
        
        # If token was revoked more than 15s ago, treat as malicious replay and revoke family
        if elapsed > 15:
            await db.execute(
                text("UPDATE refresh_sessions SET revoked_at = NOW() WHERE family_id = :fid AND revoked_at IS NULL"),
                {"fid": session_row.family_id}
            )
            await db.commit()
            revoked_resp = JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token reuse detected. Session family revoked."}
            )
            revoked_resp.delete_cookie(
                "belooga_refresh_token",
                httponly=True,
                samesite="lax",
                secure=IS_PRODUCTION
            )
            return revoked_resp
        else:
            # Grace window for concurrent requests from multiple tabs: do not revoke family
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token was recently refreshed. Please retry with current session."
            )

    # 3. Check expiration
    expires_at = session_row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired"
        )

    # 4. Fetch user identity & profile
    user_query = text("""
        SELECT i.id, i.email, i.role, i.status,
               p.username, p.first_name, p.last_name, p.avatar_url
        FROM identities i
        LEFT JOIN candidate_profiles p ON p.identity_id = i.id
        WHERE i.id = :uid
        LIMIT 1
    """)
    u_res = await db.execute(user_query, {"uid": session_row.identity_id})
    user_row = u_res.fetchone()

    if not user_row or user_row.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended"
        )

    # 5. Revoke current session (Rotation)
    await db.execute(
        text("UPDATE refresh_sessions SET revoked_at = NOW() WHERE id = :sid"),
        {"sid": session_row.id}
    )

    # 6. Issue new refresh token within SAME family
    new_raw_refresh = generate_refresh_token()
    new_token_hash = hash_token(new_raw_refresh)
    new_expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    await db.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at)
            VALUES (:identity_id, :family_id, :token_hash, :expires_at)
        """),
        {
            "identity_id": session_row.identity_id,
            "family_id": session_row.family_id,
            "token_hash": new_token_hash,
            "expires_at": new_expires_at,
        }
    )
    await db.commit()

    username = user_row.username or ""

    # 7. Generate new access token
    access_token = create_access_token({
        "sub": str(user_row.id),
        "username": username,
        "email": user_row.email,
        "role": user_row.role
    })

    # 8. Set rotated HttpOnly cookie
    response.set_cookie(
        key="belooga_refresh_token",
        value=new_raw_refresh,
        httponly=True,
        samesite="lax",
        secure=IS_PRODUCTION,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

    user_dto = UserProfileDTO(
        id=user_row.id,
        email=user_row.email,
        username=username,
        first_name=user_row.first_name or "",
        last_name=user_row.last_name or "",
        role=user_row.role,
        avatar_url=user_row.avatar_url or "/images/avatar.jpg"
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_dto)

@router.get("/auth/me/", response_model=UserProfileDTO, tags=["Domain 1: Identity & Sessions"])
async def get_current_session_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = text("""
        SELECT i.id, i.email, i.role,
               p.username, p.first_name, p.last_name, p.avatar_url
        FROM identities i
        LEFT JOIN candidate_profiles p ON p.identity_id = i.id
        WHERE i.id = :uid
        LIMIT 1
    """)
    res = await db.execute(query, {"uid": current_user.id})
    row = res.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User profile not found")

    return UserProfileDTO(
        id=row.id,
        email=row.email,
        username=row.username or "",
        first_name=row.first_name or "",
        last_name=row.last_name or "",
        role=row.role,
        avatar_url=row.avatar_url or "/images/avatar.jpg"
    )

@router.post("/auth/logout/", tags=["Domain 1: Identity & Sessions"])
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("belooga_refresh_token")
    if refresh_token:
        token_hash_val = hash_token(refresh_token)
        await db.execute(
            text("UPDATE refresh_sessions SET revoked_at = NOW() WHERE token_hash = :hash"),
            {"hash": token_hash_val}
        )
        await db.commit()

    response.delete_cookie(
        "belooga_refresh_token",
        httponly=True,
        samesite="lax",
        secure=IS_PRODUCTION
    )
    return {"message": "Successfully logged out"}
