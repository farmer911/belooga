import uuid
from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.security import generate_refresh_token, hash_token, REFRESH_TOKEN_EXPIRE_DAYS


@pytest.mark.asyncio
async def test_refresh_token_rotation_success(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession
):
    """
    Assert that refresh rotation issues a new access token and rotated refresh token
    within the same session family.
    """
    uid = test_candidate_a["id"]
    family_id = uuid.uuid4()
    raw_refresh = generate_refresh_token()
    token_hash_val = hash_token(raw_refresh)
    now = datetime.now(timezone.utc)

    await db_session.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at)
            VALUES (:uid, :fid, :thash, :exp)
        """),
        {"uid": uid, "fid": family_id, "thash": token_hash_val, "exp": now + timedelta(days=30)}
    )
    await db_session.commit()

    # Call /v1/auth/refresh/ with cookie
    client.cookies.set("belooga_refresh_token", raw_refresh)
    response = await client.post("/v1/auth/refresh/")

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_candidate_a["email"]

    # Verify original session is revoked
    res = await db_session.execute(
        text("SELECT revoked_at FROM refresh_sessions WHERE token_hash = :thash"),
        {"thash": token_hash_val}
    )
    assert res.scalar() is not None

    # Verify new session created in same family
    count_res = await db_session.execute(
        text("SELECT COUNT(*) FROM refresh_sessions WHERE family_id = :fid"),
        {"fid": family_id}
    )
    assert count_res.scalar() == 2


@pytest.mark.asyncio
async def test_refresh_token_replay_attack_revokes_entire_family(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession
):
    """
    CRITICAL SECURITY TEST (§2.4):
    If an attacker presents an already-revoked refresh token outside the grace window,
    the server must detect the replay, revoke the ENTIRE session family, delete the cookie,
    and return HTTP 401 Unauthorized.
    """
    uid = test_candidate_a["id"]
    family_id = uuid.uuid4()
    replayed_token = generate_refresh_token()
    replayed_hash = hash_token(replayed_token)
    now = datetime.now(timezone.utc)

    # Insert an old session revoked 60 seconds ago (> 15s grace window)
    revoked_time = now - timedelta(seconds=60)
    await db_session.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at, revoked_at)
            VALUES (:uid, :fid, :thash, :exp, :rev)
        """),
        {"uid": uid, "fid": family_id, "thash": replayed_hash, "exp": now + timedelta(days=30), "rev": revoked_time}
    )

    # Insert an active session in the same family
    active_token = generate_refresh_token()
    active_hash = hash_token(active_token)
    await db_session.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at)
            VALUES (:uid, :fid, :thash, :exp)
        """),
        {"uid": uid, "fid": family_id, "thash": active_hash, "exp": now + timedelta(days=30)}
    )
    await db_session.commit()

    # Attacker tries to use replayed token
    client.cookies.set("belooga_refresh_token", replayed_token)
    response = await client.post("/v1/auth/refresh/")

    assert response.status_code == 401
    assert "Token reuse detected" in response.text
    # Verify cookie deletion header was sent in response
    set_cookie = response.headers.get("set-cookie", "")
    assert "belooga_refresh_token=" in set_cookie or "Max-Age=0" in set_cookie

    # Verify that the active session in the family is NOW ALSO REVOKED
    chk_res = await db_session.execute(
        text("SELECT revoked_at FROM refresh_sessions WHERE token_hash = :thash"),
        {"thash": active_hash}
    )
    assert chk_res.scalar() is not None, "Active session should have been revoked upon replay attack detection!"


@pytest.mark.asyncio
async def test_refresh_token_grace_window_allows_concurrent_tabs(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession
):
    """
    If a token was revoked within the 15-second grace window (e.g. concurrent tabs refreshing simultaneously),
    it should NOT trigger catastrophic family revocation.
    """
    uid = test_candidate_a["id"]
    family_id = uuid.uuid4()
    recently_revoked_token = generate_refresh_token()
    recent_hash = hash_token(recently_revoked_token)
    now = datetime.now(timezone.utc)

    # Revoked only 3 seconds ago (well within 15s grace window)
    revoked_time = now - timedelta(seconds=3)
    await db_session.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at, revoked_at)
            VALUES (:uid, :fid, :thash, :exp, :rev)
        """),
        {"uid": uid, "fid": family_id, "thash": recent_hash, "exp": now + timedelta(days=30), "rev": revoked_time}
    )

    # Active session in family
    active_token = generate_refresh_token()
    active_hash = hash_token(active_token)
    await db_session.execute(
        text("""
            INSERT INTO refresh_sessions (identity_id, family_id, token_hash, expires_at)
            VALUES (:uid, :fid, :thash, :exp)
        """),
        {"uid": uid, "fid": family_id, "thash": active_hash, "exp": now + timedelta(days=30)}
    )
    await db_session.commit()

    # Call refresh with recently revoked token
    client.cookies.set("belooga_refresh_token", recently_revoked_token)
    response = await client.post("/v1/auth/refresh/")

    # Should return 401 with "Token was recently refreshed" but NOT revoke the family
    assert response.status_code == 401
    assert "recently refreshed" in response.text

    # The active session in the family must STILL BE ACTIVE (not revoked)
    chk_res = await db_session.execute(
        text("SELECT revoked_at FROM refresh_sessions WHERE token_hash = :thash"),
        {"thash": active_hash}
    )
    assert chk_res.scalar() is None, "Active session should NOT be revoked during grace window!"

