import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_media_chunk_upload_path_traversal_rejection(client: AsyncClient, test_candidate_a: dict):
    """
    CRITICAL SECURITY TEST (§2.1):
    Assert that path traversal payloads in upload_id (e.g. '../../', '/app', '..')
    are strictly rejected with HTTP 400 Bad Request and never trigger directory traversal.
    """
    token = test_candidate_a["token"]
    username = test_candidate_a["username"]
    headers = {"Authorization": f"Bearer {token}"}

    traversal_payloads = [
        "../../",
        "../..",
        "/app",
        "/etc/nginx",
        "upload_123_../../",
        "upload_test/../traversal",
        "upload_!@#$%",
    ]

    for payload in traversal_payloads:
        dummy_file = ("chunk.bin", io.BytesIO(b"dummy chunk content"), "application/octet-stream")
        form_data = {
            "upload_id": payload,
            "chunk_index": "0",
            "total_chunks": "1",
            "username": username,
        }

        response = await client.post(
            "/v1/media/upload/chunk",
            data=form_data,
            files={"file": dummy_file},
            headers=headers,
        )

        assert response.status_code == 400, (
            f"Payload '{payload}' should have been rejected with 400 Bad Request, "
            f"got {response.status_code}: {response.text}"
        )
        assert "Invalid upload session" in response.text or "Path traversal" in response.text


@pytest.mark.asyncio
async def test_media_complete_upload_path_traversal_rejection(client: AsyncClient, test_candidate_a: dict):
    """
    Assert that complete upload endpoint rejects path traversal payloads without deleting parent dirs.
    """
    token = test_candidate_a["token"]
    username = test_candidate_a["username"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "upload_id": "../..",
        "total_chunks": 1,
        "username": username,
        "filename": "pitch.webm",
    }

    response = await client.post("/v1/media/upload/complete", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Invalid upload session" in response.text or "Path traversal" in response.text
