"""TDD Test Suite for BEL-515: ConnectRPC Multiplexed Batching, Protobuf-Varint Framing & Shared Dossier Hydration."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.rpc import (
    decode_protobuf_envelope,
    decode_varint,
    encode_protobuf_envelope,
    encode_varint,
)
from app.main import app


def test_protobuf_varint_and_binary_envelope_roundtrip():
    """Verify Base-128 Protobuf varint and binary envelope lossless round-trip and size reduction."""
    for num in (0, 1, 127, 128, 300, 16384, 1_000_000):
        encoded = encode_varint(num)
        decoded, offset = decode_varint(encoded, 0)
        assert decoded == num
        assert offset == len(encoded)

    sample = {
        "results": [
            {"id": str(i), "skill": "FastAPI", "category": "Backend Engineering", "demand": "+34%"}
            for i in range(30)
        ]
    }
    binary_frame = encode_protobuf_envelope(sample, compress=True)
    restored = decode_protobuf_envelope(binary_frame)
    assert restored == sample
    assert len(binary_frame) < 400  # Compressed binary frame is drastically smaller than raw JSON


@pytest.mark.asyncio
async def test_rpc_reflection_and_multiplexed_batch_json_and_protobuf():
    """Verify GET /v1/rpc/methods reflection and POST /v1/rpc/batch in both JSON and binary Protobuf modes."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Server reflection
        refl = await client.get("/v1/rpc/methods")
        assert refl.status_code == 200
        refl_data = refl.json()
        assert "profile.get" in refl_data["supported_methods"]
        assert "profile.trustScore" in refl_data["supported_methods"]
        assert "profile.trajectory" in refl_data["supported_methods"]
        assert "catalogs.skills" in refl_data["supported_methods"]

        # 2. Multiplexed Batch RPC (JSON Compact mode)
        batch_payload = {
            "calls": [
                {"id": "c1", "method": "catalogs.skills", "params": {}},
                {"id": "c2", "method": "search.trending", "params": {}},
                {"id": "c3", "method": "cms.blogPosts", "params": {}},
            ]
        }
        res_json = await client.post("/v1/rpc/batch", json=batch_payload)
        assert res_json.status_code == 200
        assert res_json.headers.get("X-RPC-Batch-Size") == "3"
        assert res_json.headers.get("X-RPC-Wire-Format") == "json-compact"
        body = res_json.json()
        assert len(body["results"]) == 3
        assert body["results"][0]["id"] == "c1"
        assert body["results"][0]["status"] == 200
        assert isinstance(body["results"][0]["data"], list)
        assert body["results"][1]["id"] == "c2"
        assert "trending_queries" in body["results"][1]["data"]
        assert body["results"][2]["id"] == "c3"
        assert len(body["results"][2]["data"]) >= 1

        # 3. Multiplexed Batch RPC (Binary Protobuf-Varint Envelope mode via Accept header)
        res_bin = await client.post(
            "/v1/rpc/batch",
            json=batch_payload,
            headers={"Accept": "application/x-protobuf"},
        )
        assert res_bin.status_code == 200
        assert res_bin.headers.get("X-RPC-Wire-Format") == "protobuf-varint"
        assert "application/x-protobuf" in (res_bin.headers.get("content-type") or "")
        decoded_bin = decode_protobuf_envelope(res_bin.content)
        assert decoded_bin["results"] == body["results"]
        assert len(res_bin.content) < len(res_json.content)


@pytest.mark.asyncio
async def test_rpc_candidate_full_dossier_multiplexing():
    """Verify profile.get, profile.trustScore, and profile.trajectory can be multiplexed in 1 trip."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First find an existing candidate or use search
        search_res = await client.get("/v1/profile/search/?key=&page=1&limit=1")
        assert search_res.status_code == 200
        candidates = search_res.json().get("results", [])
        if not candidates:
            return
        username = candidates[0]["username"]

        batch_res = await client.post(
            "/v1/rpc/batch",
            json={
                "calls": [
                    {"id": "prof", "method": "profile.get", "params": {"username": username}},
                    {"id": "trust", "method": "profile.trustScore", "params": {"username": username}},
                    {"id": "traj", "method": "profile.trajectory", "params": {"username": username}},
                ]
            },
        )
        assert batch_res.status_code == 200
        results = {item["id"]: item for item in batch_res.json()["results"]}
        assert results["prof"]["status"] == 200
        assert results["trust"]["status"] == 200
        assert results["traj"]["status"] == 200
        assert results["prof"]["data"]["username"].lower() == username.lower()
        assert "trust_score" in results["trust"]["data"]
        assert "current_inferred_level" in results["traj"]["data"]
