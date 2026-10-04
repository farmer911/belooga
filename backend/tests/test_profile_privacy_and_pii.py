import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy import text


@pytest.mark.asyncio
async def test_anonymous_profile_view_does_not_leak_pii(client: AsyncClient):
    """Anonymous visitors should see candidate profile but sensitive PII (email, phone) must be withheld."""
    res = await client.get("/v1/profile/alexnguyen")
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "alexnguyen"
    # PII Protection: email and phone MUST be None for anonymous callers
    assert data.get("email") is None, f"PII Leak: anonymous caller received email {data.get('email')}"
    assert data.get("phone") is None, f"PII Leak: anonymous caller received phone {data.get('phone')}"


@pytest.mark.asyncio
async def test_owner_profile_view_includes_pii(client: AsyncClient, db_session):
    """Candidate profile owner viewing their own profile should receive their email and phone."""
    # Obtain alexnguyen id
    res_db = await db_session.execute(
        text("SELECT identity_id FROM candidate_profiles WHERE username = 'alexnguyen'")
    )
    identity_id = res_db.scalar()

    from app.core.security import create_access_token
    token = create_access_token({"sub": str(identity_id), "username": "alexnguyen", "role": "candidate"})

    res = await client.get(
        "/v1/profile/alexnguyen",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "alex@belooga.com"
    assert data["phone"] == "+1 (555) 019-2834"


@pytest.mark.asyncio
async def test_hidden_profile_blocks_anonymous_and_other_users(client: AsyncClient, db_session):
    """Hidden profiles (is_hidden=TRUE) must return 404 for anonymous users and non-owners."""
    # 1. Anonymous request
    res_anon = await client.get("/v1/profile/hidden_jane")
    assert res_anon.status_code == 404, f"Hidden profile leaked to anonymous visitor: status {res_anon.status_code}"

    # 2. Other user request (alexnguyen)
    res_db = await db_session.execute(
        text("SELECT identity_id FROM candidate_profiles WHERE username = 'alexnguyen'")
    )
    alex_id = res_db.scalar()
    from app.core.security import create_access_token
    alex_token = create_access_token({"sub": str(alex_id), "username": "alexnguyen", "role": "candidate"})

    res_other = await client.get(
        "/v1/profile/hidden_jane",
        headers={"Authorization": f"Bearer {alex_token}"}
    )
    assert res_other.status_code == 404, "Hidden profile leaked to another candidate"

    # 3. Owner request (hidden_jane herself)
    res_jane = await db_session.execute(
        text("SELECT identity_id FROM candidate_profiles WHERE username = 'hidden_jane'")
    )
    jane_id = res_jane.scalar()
    jane_token = create_access_token({"sub": str(jane_id), "username": "hidden_jane", "role": "candidate"})

    res_owner = await client.get(
        "/v1/profile/hidden_jane",
        headers={"Authorization": f"Bearer {jane_token}"}
    )
    assert res_owner.status_code == 200, "Owner could not view their own hidden profile"
    assert res_owner.json()["username"] == "hidden_jane"


@pytest.mark.asyncio
async def test_hidden_profile_pdf_blocks_unauthorized_access(client: AsyncClient, db_session):
    """PDF download for hidden profiles must be forbidden/not found for anonymous users."""
    # Anonymous PDF request
    res_pdf_anon = await client.get("/v1/profile/hidden_jane/pdf/")
    assert res_pdf_anon.status_code == 404, "Hidden candidate PDF leaked to anonymous visitor"

    # Owner PDF request
    res_jane = await db_session.execute(
        text("SELECT identity_id FROM candidate_profiles WHERE username = 'hidden_jane'")
    )
    jane_id = res_jane.scalar()
    from app.core.security import create_access_token
    jane_token = create_access_token({"sub": str(jane_id), "username": "hidden_jane", "role": "candidate"})

    res_pdf_owner = await client.get(
        "/v1/profile/hidden_jane/pdf/",
        headers={"Authorization": f"Bearer {jane_token}"}
    )
    assert res_pdf_owner.status_code == 200
    assert "application/pdf" in res_pdf_owner.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_search_suggest_filters_hidden_profiles(client: AsyncClient):
    """Autocomplete suggestions must never surface hidden candidates."""
    res = await client.get("/v1/profile/search/suggest/?key=Jane")
    assert res.status_code == 200
    suggestions = res.json()
    usernames = [s["username"] for s in suggestions]
    assert "hidden_jane" not in usernames, f"Hidden candidate leaked in autocomplete: {usernames}"


@pytest.mark.asyncio
async def test_profile_has_zero_hardcoded_mock_fallbacks(client: AsyncClient, db_session):
    """Profiles without custom data must return null or empty lists, NOT hardcoded mock fallbacks."""
    clean_username = f"empty_{uuid.uuid4().hex[:8]}"
    clean_email = f"{clean_username}@example.com"

    # Insert empty profile
    res_id = await db_session.execute(
        text("INSERT INTO identities (email, password_hash, role) VALUES (:e, 'dummy', 'candidate') RETURNING id"),
        {"e": clean_email}
    )
    new_id = res_id.scalar()
    await db_session.execute(
        text("""
            INSERT INTO candidate_profiles (identity_id, username, first_name, last_name, is_hidden)
            VALUES (:id, :u, 'Empty', 'User', FALSE)
        """),
        {"id": new_id, "u": clean_username}
    )
    await db_session.commit()

    res = await client.get(f"/v1/profile/{clean_username}")
    assert res.status_code == 200
    data = res.json()

    # Must NOT have hardcoded mock fallbacks
    assert data["phone"] is None, "Should not return hardcoded mock phone"
    assert data["video_pitch_url"] is None, "Should not return hardcoded Ava's video"
    assert data["video_pitch_poster"] is None, "Should not return hardcoded matt-poster"
    assert data["skills"] == [], "Should return empty skills list, not hardcoded defaults"
    assert data["languages"] == [], "Should return empty languages list, not hardcoded English/Spanish"
    assert data["interests"] == [], "Should return empty interests list, not hardcoded interests"


@pytest.mark.asyncio
async def test_happy_path_chunked_upload_and_complete(client: AsyncClient, db_session):
    """Candidate can successfully upload a chunk and complete upload with valid credentials and upload_id."""
    res_db = await db_session.execute(
        text("SELECT identity_id FROM candidate_profiles WHERE username = 'alexnguyen'")
    )
    alex_id = res_db.scalar()
    from app.core.security import create_access_token
    token = create_access_token({"sub": str(alex_id), "username": "alexnguyen", "role": "candidate"})

    upload_id = f"upload_179111_validtest{uuid.uuid4().hex[:6]}"

    # Upload single chunk
    chunk_res = await client.post(
        "/v1/media/upload/chunk",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "upload_id": upload_id,
            "chunk_index": "0",
            "total_chunks": "1",
            "username": "alexnguyen",
        },
        files={
            "file": ("test.webm", b"\x1a\x45\xdf\xa3dummyvideocontent", "video/webm")
        }
    )
    assert chunk_res.status_code == 200
    assert chunk_res.json()["status"] == "chunk_received"

    # Complete upload
    complete_res = await client.post(
        "/v1/media/upload/complete",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "upload_id": upload_id,
            "total_chunks": 1,
            "username": "alexnguyen",
            "filename": "alex_pitch.webm"
        }
    )
    assert complete_res.status_code == 200
    complete_data = complete_res.json()
    assert complete_data["status"] == "completed"
    assert "video_url" in complete_data


@pytest.mark.asyncio
async def test_cross_user_upload_completion_rejection(client: AsyncClient, db_session):
    """User B cannot complete an upload session initiated by User A."""
    from app.core.security import create_access_token

    res_a = await db_session.execute(text("SELECT identity_id FROM candidate_profiles WHERE username = 'alexnguyen'"))
    user_a_id = res_a.scalar()
    token_a = create_access_token({"sub": str(user_a_id), "username": "alexnguyen", "role": "candidate"})

    # User B
    res_b = await db_session.execute(text("SELECT identity_id FROM candidate_profiles WHERE username = 'hidden_jane'"))
    user_b_id = res_b.scalar()
    token_b = create_access_token({"sub": str(user_b_id), "username": "hidden_jane", "role": "candidate"})

    upload_id = f"upload_179111_crossuser{uuid.uuid4().hex[:6]}"

    # User A uploads chunk
    chunk_res = await client.post(
        "/v1/media/upload/chunk",
        headers={"Authorization": f"Bearer {token_a}"},
        data={
            "upload_id": upload_id,
            "chunk_index": "0",
            "total_chunks": "1",
            "username": "alexnguyen",
        },
        files={
            "file": ("test.webm", b"dummychunk", "video/webm")
        }
    )
    assert chunk_res.status_code == 200

    # User B attempts to complete User A's upload
    res_tamper = await client.post(
        "/v1/media/upload/complete",
        headers={"Authorization": f"Bearer {token_b}"},
        json={
            "upload_id": upload_id,
            "total_chunks": 1,
            "username": "alexnguyen",
            "filename": "tampered.webm"
        }
    )
    assert res_tamper.status_code == 403, "Cross-user completion must be rejected with 403 Forbidden"
