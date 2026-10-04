import io
import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_idor_cross_user_profile_mutation_forbidden(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict
):
    """
    Assert that User A cannot modify User B's profile (HTTP 403 Forbidden).
    """
    token_a = test_candidate_a["token"]
    user_b_username = test_candidate_b["username"]
    headers = {"Authorization": f"Bearer {token_a}"}

    # Attempt to update User B's profile
    patch_resp = await client.patch(
        f"/v1/profile/{user_b_username}",
        json={"headline": "Hacked headline"},
        headers=headers
    )
    assert patch_resp.status_code == 403
    assert "Forbidden" in patch_resp.text


@pytest.mark.asyncio
async def test_idor_cross_user_timeline_mutation_forbidden(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict
):
    """
    Assert that User A cannot add, reorder, or delete User B's timeline items.
    """
    token_a = test_candidate_a["token"]
    user_b_username = test_candidate_b["username"]
    headers = {"Authorization": f"Bearer {token_a}"}

    # 1. Create job experience on User B's profile
    create_resp = await client.post(
        f"/v1/profile/{user_b_username}/job-experiences/",
        json={
            "title": "Malicious Job",
            "company_name": "Evil Corp",
            "from_date_month": 1,
            "from_date_year": 2023,
            "currently_work_here": True
        },
        headers=headers
    )
    assert create_resp.status_code == 403

    # 2. Reorder User B's jobs
    reorder_resp = await client.post(
        f"/v1/profile/{user_b_username}/job-experiences/order/",
        json={"orders": [{"id": str(uuid.uuid4()), "order": 0}]},
        headers=headers
    )
    assert reorder_resp.status_code == 403

    # 3. Delete from User B's profile
    del_resp = await client.delete(
        f"/v1/profile/{user_b_username}/job-experiences/{uuid.uuid4()}/",
        headers=headers
    )
    assert del_resp.status_code == 403


@pytest.mark.asyncio
async def test_idor_cross_user_media_upload_forbidden(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict
):
    """
    Assert that User A cannot upload chunks or complete video uploads for User B.
    """
    token_a = test_candidate_a["token"]
    user_b_username = test_candidate_b["username"]
    headers = {"Authorization": f"Bearer {token_a}"}

    # Upload chunk targeting User B
    dummy_file = ("chunk.bin", io.BytesIO(b"data"), "application/octet-stream")
    chunk_resp = await client.post(
        "/v1/media/upload/chunk",
        data={
            "upload_id": "upload_123_abc456",
            "chunk_index": "0",
            "total_chunks": "1",
            "username": user_b_username,
        },
        files={"file": dummy_file},
        headers=headers
    )
    assert chunk_resp.status_code == 403

    # Complete upload targeting User B
    complete_resp = await client.post(
        "/v1/media/upload/complete",
        json={
            "upload_id": "upload_123_abc456",
            "total_chunks": 1,
            "username": user_b_username,
            "filename": "pitch.webm"
        },
        headers=headers
    )
    assert complete_resp.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_mutations_rejected(
    client: AsyncClient,
    test_candidate_a: dict
):
    """
    Assert that mutation endpoints without Bearer token return 401 Unauthorized.
    """
    username = test_candidate_a["username"]

    r1 = await client.patch(f"/v1/profile/{username}", json={"headline": "Test"})
    assert r1.status_code == 401

    r2 = await client.post(f"/v1/profile/{username}/job-experiences/order/", json={"orders": []})
    assert r2.status_code == 401

    r3 = await client.delete(f"/v1/profile/{username}/job-experiences/{uuid.uuid4()}/")
    assert r3.status_code == 401
