"""Platform-core hardening: rate-limit bypasses, proxy trust, uploads, readiness, docs, 500 handler."""

import logging
import uuid

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core import gateway as gw_mod
from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.main import app, docs_kwargs, unhandled_exception_handler

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.4\n% test resume\n"


@pytest.fixture
def settings(monkeypatch):
    s = get_settings()
    gw_mod.clear_gateway_l1_state()
    yield lambda **kv: [monkeypatch.setattr(s, k, v) for k, v in kv.items()]
    gw_mod.clear_gateway_l1_state()


def auth(user):
    return {"Authorization": f"Bearer {user['token']}"}


# --- 1. Rate limiting ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_client_rate_limit_override_header_is_ignored(client, settings):
    settings(RATE_LIMIT_PUBLIC_RPM=50)
    for _ in range(3):
        r = await client.get("/v1/faqs", headers={"X-Test-Rate-Limit": "1"})
        assert r.status_code == 200
        assert r.headers["x-ratelimit-limit"] == "50"
        assert r.headers["x-ratelimit-policy"] == "public_read"


@pytest.mark.asyncio
async def test_spoofed_xff_from_untrusted_peer_does_not_change_bucket(client, settings):
    settings(RATE_LIMIT_PUBLIC_RPM=3, TRUSTED_PROXY_IPS="")
    codes = [(await client.get("/v1/faqs", headers={"X-Forwarded-For": f"198.51.100.{i}"})).status_code for i in range(4)]
    assert codes == [200, 200, 200, 429]


@pytest.mark.asyncio
async def test_xff_honoured_only_from_trusted_proxy(client, settings):
    settings(RATE_LIMIT_PUBLIC_RPM=4, TRUSTED_PROXY_IPS="127.0.0.0/8")
    a = {"X-Forwarded-For": "203.0.113.200, 10.9.9.9"}  # right-most untrusted hop (10.9.9.9) is the key
    codes_a = [(await client.get("/v1/faqs", headers=a)).status_code for _ in range(5)]
    assert codes_a == [200, 200, 200, 200, 429]
    b = {"X-Forwarded-For": "203.0.113.200, 10.9.9.10"}  # different client behind the proxy
    assert (await client.get("/v1/faqs", headers=b)).status_code == 200


def test_resolve_client_ip_rules():
    trusted = Settings(TRUSTED_PROXY_IPS="10.0.0.0/8, 127.0.0.1").trusted_proxies
    scope = lambda peer, xff: {"client": (peer, 1), "headers": [(b"x-forwarded-for", xff.encode())] if xff else []}
    assert gw_mod.resolve_client_ip(scope("8.8.8.8", "1.1.1.1"), trusted) == "8.8.8.8"      # untrusted peer
    assert gw_mod.resolve_client_ip(scope("10.0.0.5", "1.1.1.1, 2.2.2.2, 10.0.0.9"), trusted) == "2.2.2.2"
    assert gw_mod.resolve_client_ip(scope("10.0.0.5", ""), trusted) == "10.0.0.5"
    assert gw_mod.resolve_client_ip(scope("10.0.0.5", "1.1.1.1"), []) == "10.0.0.5"         # trust none


@pytest.mark.asyncio
async def test_auth_rate_limit_applies_outside_production(client, settings):
    assert get_settings().ENVIRONMENT == "testing"
    settings(RATE_LIMIT_AUTH_RPM=2)
    body = {"email": f"nobody_{uuid.uuid4().hex[:6]}@test.com", "password": "wrong-password"}
    codes = [(await client.post("/v1/auth/login", json=body)).status_code for _ in range(3)]
    assert codes[2] == 429 and 429 not in codes[:2]


# --- 2. Uploads ----------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_avatar_oversize_413_and_bad_magic_415(client, settings, test_candidate_a):
    settings(UPLOAD_MAX_AVATAR_BYTES=1024)
    url = f"/v1/profile/{test_candidate_a['username']}/avatar/"
    big = await client.patch(url, headers=auth(test_candidate_a), files={"file": ("a.png", PNG + b"\x00" * 2048, "image/png")})
    assert big.status_code == 413
    gif = await client.patch(url, headers=auth(test_candidate_a), files={"file": ("a.png", b"GIF89a" + b"\x00" * 32, "image/png")})
    assert gif.status_code == 415
    ok = await client.patch(url, headers=auth(test_candidate_a), files={"file": ("evil.php", PNG, "image/png")})
    assert ok.status_code == 200
    name = ok.json()["filename"]
    assert name.endswith(".png") and test_candidate_a["username"] not in name  # random server-side name
    assert (await client.get(f"/uploads/avatars/{name}")).status_code == 200    # avatars stay public


@pytest.mark.asyncio
async def test_resume_magic_415_and_chunk_oversize_413(client, settings, test_candidate_a):
    settings(UPLOAD_MAX_CHUNK_BYTES=1024)
    u = test_candidate_a["username"]
    bad = await client.patch(f"/v1/profile/{u}/resume/", headers=auth(test_candidate_a), files={"file": ("cv.pdf", PNG, "application/pdf")})
    assert bad.status_code == 415
    upload_id = f"upload_1_{uuid.uuid4().hex[:8]}"
    form = {"upload_id": upload_id, "chunk_index": "0", "total_chunks": "1", "username": u}
    big = await client.post("/v1/media/upload/chunk", headers=auth(test_candidate_a), data=form,
                            files={"file": ("c", b"\x1a\x45\xdf\xa3" + b"\x00" * 4096, "video/webm")})
    assert big.status_code == 413


@pytest.mark.asyncio
async def test_video_complete_rejects_non_video_415(client, test_candidate_a):
    u = test_candidate_a["username"]
    upload_id = f"upload_1_{uuid.uuid4().hex[:8]}"
    form = {"upload_id": upload_id, "chunk_index": "0", "total_chunks": "1", "username": u}
    up = await client.post("/v1/media/upload/chunk", headers=auth(test_candidate_a), data=form,
                           files={"file": ("c", b"just some plain text, not a video", "video/webm")})
    assert up.status_code == 200
    done = await client.post("/v1/media/upload/complete", headers=auth(test_candidate_a),
                             json={"upload_id": upload_id, "total_chunks": 1, "username": u, "filename": "x.webm"})
    assert done.status_code == 415


@pytest.mark.asyncio
async def test_resume_private_not_static_owner_only_download(client, test_candidate_a, test_candidate_b):
    u = test_candidate_a["username"]
    up = await client.patch(f"/v1/profile/{u}/resume/", headers=auth(test_candidate_a), files={"file": ("cv.pdf", PDF, "application/pdf")})
    assert up.status_code == 200
    resume_url = up.json()["resume_url"]
    filename = resume_url.rsplit("/", 1)[1]
    assert f"/v1/profile/{u}/resume/{filename}" in resume_url

    assert (await client.get(f"/uploads/resumes/{filename}")).status_code == 404     # not statically served
    assert (await client.get(f"/v1/profile/{u}/resume/{filename}")).status_code == 401  # anonymous
    assert (await client.get(f"/v1/profile/{u}/resume/{filename}", headers=auth(test_candidate_b))).status_code == 403
    assert (await client.get(f"/v1/profile/{u}/resume/other.pdf", headers=auth(test_candidate_a))).status_code == 404
    own = await client.get(f"/v1/profile/{u}/resume/{filename}", headers=auth(test_candidate_a))
    assert own.status_code == 200
    assert own.content == PDF
    assert own.headers["content-type"] == "application/pdf"


# --- 3. Health / docs / errors -------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ready_returns_503_when_db_down(client):
    class DeadSession:
        async def execute(self, *a, **kw):
            raise ConnectionRefusedError("db down")

    async def dead_db():
        yield DeadSession()

    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = dead_db
    try:
        r = await client.get("/health/ready")
    finally:
        app.dependency_overrides[get_db] = previous
    assert r.status_code == 503
    assert r.json()["checks"]["postgres"] == "error"


@pytest.mark.asyncio
async def test_docs_disabled_in_production_unless_enabled():
    async def get(a: FastAPI, path: str) -> int:
        async with AsyncClient(transport=ASGITransport(app=a), base_url="http://t") as c:
            return (await c.get(path)).status_code

    prod = FastAPI(**docs_kwargs(Settings(ENVIRONMENT="production")))
    assert [await get(prod, p) for p in ("/docs", "/redoc", "/openapi.json")] == [404, 404, 404]
    forced = FastAPI(**docs_kwargs(Settings(ENVIRONMENT="production", ENABLE_API_DOCS=True)))
    assert await get(forced, "/openapi.json") == 200
    assert await get(app, "/openapi.json") == 200  # non-production default


@pytest.mark.asyncio
async def test_unhandled_exception_returns_500_json_with_request_id_and_logs(caplog):
    boom_app = FastAPI()
    boom_app.add_exception_handler(Exception, unhandled_exception_handler)
    boom_app.add_middleware(gw_mod.APIGatewayMiddleware)

    @boom_app.get("/boom")
    async def boom():
        raise RuntimeError("secret internal detail")

    caplog.set_level(logging.INFO)
    async with AsyncClient(transport=ASGITransport(app=boom_app, raise_app_exceptions=False), base_url="http://t") as c:
        r = await c.get("/boom", headers={"X-Request-ID": "req-test-123"})
    assert r.status_code == 500
    assert r.json() == {"detail": "Internal Server Error", "request_id": "req-test-123"}
    assert "secret internal detail" not in r.text
    err = [rec for rec in caplog.records if rec.name == "belooga" and rec.levelno == logging.ERROR]
    assert err and err[0].exc_info and err[0].request_id == "req-test-123"
    access = [rec for rec in caplog.records if rec.name == "belooga.access"]
    assert access and access[-1].status == 500
