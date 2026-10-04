import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_refresh_token,
    hash_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
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
        secure=False, # True in HTTPS production
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
        secure=False,
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

    response.delete_cookie("belooga_refresh_token")
    return {"message": "Successfully logged out"}
