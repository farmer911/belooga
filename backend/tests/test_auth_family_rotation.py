import uuid
from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.security import generate_refresh_token, hash_token


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


@pytest.mark.asyncio
async def test_password_recovery_token_issuance_and_single_use_reset(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession,
):
    """
    BEL-501: Verify forgot-password issues a single-use token in password_reset_tokens,
    reset-password rotates password_hash & revokes active sessions, and replay is rejected.
    """
    email = test_candidate_a["email"]
    uid = test_candidate_a["id"]

    # 1. Request password reset token
    forgot_res = await client.post("/v1/auth/forgot-password/", json={"email": email})
    assert forgot_res.status_code == 200
    forgot_data = forgot_res.json()
    assert "reset_token" in forgot_data and forgot_data["reset_token"]
    raw_token = forgot_data["reset_token"]

    # Verify hashed token persisted in password_reset_tokens
    row_res = await db_session.execute(
        text("SELECT used_at FROM password_reset_tokens WHERE identity_id = :uid AND token_hash = :th"),
        {"uid": uid, "th": hash_token(raw_token)},
    )
    row = row_res.fetchone()
    assert row is not None and row.used_at is None

    # 2. Reset password using the token
    new_pw = "NewRecoveredPass999!"
    reset_res = await client.post(
        "/v1/auth/reset-password/",
        json={"token": raw_token, "new_password": new_pw},
    )
    assert reset_res.status_code == 200

    # 3. Verify token is now marked used_at and cannot be replayed
    replay_res = await client.post(
        "/v1/auth/reset-password/",
        json={"token": raw_token, "new_password": "AnotherPass123!"},
    )
    assert replay_res.status_code == 400

    # 4. Verify login works with the new password
    login_res = await client.post(
        "/v1/auth/login/",
        json={"email": email, "password": new_pw},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


@pytest.mark.asyncio
async def test_oauth_sso_callback_links_social_account_and_issues_session(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    POST /v1/auth/oauth/callback/ trusts only the identity Google returns for the code:
    links by Google `sub`, falls back to a verified email, and never trusts client-sent email.
    """
    from app.modules.auth import service as auth_service

    sub = f"google-sub-{uuid.uuid4().hex[:8]}"
    claims = {"sub": sub, "email": test_candidate_a["email"], "email_verified": True}
    seen: list[tuple] = []

    async def fake_google(code, redirect_uri, code_verifier):
        seen.append((code, redirect_uri, code_verifier))
        return claims

    monkeypatch.setattr(auth_service, "fetch_google_identity", fake_google)
    body = {"provider": "google", "code": "real-google-code", "redirect_uri": "http://localhost:3000/callback"}

    # 1. Verified Google email links to the existing identity
    res1 = await client.post("/v1/auth/oauth/callback/", json=body)
    assert res1.status_code == 200, res1.text
    assert res1.json()["user"]["username"] == test_candidate_a["username"]
    assert seen[0] == ("real-google-code", "http://localhost:3000/callback", None)
    sa_row = (await db_session.execute(
        text("SELECT provider_user_id FROM social_accounts WHERE identity_id = :uid AND provider = 'google'"),
        {"uid": test_candidate_a["id"]},
    )).fetchone()
    assert sa_row is not None and sa_row.provider_user_id == sub

    # 2. Repeat login resolves by `sub` even if Google later reports a different email
    claims["email"] = f"changed_{uuid.uuid4().hex[:6]}@example.com"
    res2 = await client.post("/v1/auth/oauth/callback/", json=body)
    assert res2.status_code == 200
    assert res2.json()["user"]["id"] == str(test_candidate_a["id"])

    # 3. Client-supplied email is ignored (schema no longer accepts it as identity)
    claims.update(sub=f"other-{uuid.uuid4().hex[:8]}", email="attacker@example.com")
    res3 = await client.post("/v1/auth/oauth/callback/", json={**body, "email": test_candidate_a["email"]})
    assert res3.status_code == 200
    assert res3.json()["user"]["id"] != str(test_candidate_a["id"])


@pytest.mark.asyncio
async def test_oauth_rejects_unverified_email_and_unknown_provider(
    client: AsyncClient,
    test_candidate_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    from app.modules.auth import service as auth_service

    async def unverified(code, redirect_uri, code_verifier):
        return {"sub": "x-1", "email": test_candidate_a["email"], "email_verified": False}

    monkeypatch.setattr(auth_service, "fetch_google_identity", unverified)
    body = {"provider": "google", "code": "abcd", "redirect_uri": "http://localhost:3000/callback"}
    assert (await client.post("/v1/auth/oauth/callback/", json=body)).status_code == 401
    assert (await client.post("/v1/auth/oauth/callback/", json={**body, "provider": "facebook"})).status_code == 400


@pytest.mark.asyncio
async def test_oauth_unconfigured_returns_503(client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    body = {"provider": "google", "code": "abcd", "redirect_uri": "http://localhost:3000/callback"}
    assert (await client.post("/v1/auth/oauth/callback/", json=body)).status_code == 503


@pytest.mark.asyncio
async def test_mobile_dual_mode_refresh_token_and_logout(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession,
):
    """
    BEL-132: Verify Native Mobile clients (without cookies) receive refresh_token in
    TokenResponse and can rotate/revoke sessions via JSON body or X-Refresh-Token header.
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
        {"uid": uid, "fid": family_id, "thash": token_hash_val, "exp": now + timedelta(days=30)},
    )
    await db_session.commit()

    # Ensure zero cookies on client (simulating React Native / Expo SecureStore client)
    client.cookies.clear()

    # 1. Rotate via JSON body {"refresh_token": ...} without cookies
    refresh_res = await client.post(
        "/v1/auth/refresh/",
        json={"refresh_token": raw_refresh},
    )
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.json()
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_data and refresh_data["refresh_token"]
    rotated_token = refresh_data["refresh_token"]
    assert rotated_token != raw_refresh

    # 2. Rotate again via X-Refresh-Token header without cookies
    client.cookies.clear()
    header_res = await client.post(
        "/v1/auth/refresh/",
        headers={"X-Refresh-Token": rotated_token},
    )
    assert header_res.status_code == 200
    header_data = header_res.json()
    second_rotated = header_data["refresh_token"]
    assert second_rotated and second_rotated != rotated_token

    # 3. Logout via JSON body without cookies revokes the mobile refresh session
    client.cookies.clear()
    logout_res = await client.post(
        "/v1/auth/logout/",
        json={"refresh_token": second_rotated},
    )
    assert logout_res.status_code == 200

    # Verify session is revoked in DB
    rev_res = await db_session.execute(
        text("SELECT revoked_at FROM refresh_sessions WHERE token_hash = :th"),
        {"th": hash_token(second_rotated)},
    )
    assert rev_res.scalar() is not None






@pytest.mark.asyncio
async def test_admin_without_candidate_profile_can_log_in(client: AsyncClient, db_session: AsyncSession):
    """Admins have no candidate_profiles row; login must not require one."""
    from app.core.security import get_password_hash

    email = f"admin_login_{uuid.uuid4().hex[:6]}@test.com"
    await db_session.execute(
        text("INSERT INTO identities (id, email, password_hash, role, status) VALUES (:id, :e, :h, 'admin', 'active')"),
        {"id": uuid.uuid4(), "e": email, "h": get_password_hash("AdminPass123!")},
    )
    await db_session.commit()
    res = await client.post("/v1/auth/login/", json={"email": email, "password": "AdminPass123!"})
    assert res.status_code == 200, res.text
    assert res.json()["user"]["role"] == "admin"
