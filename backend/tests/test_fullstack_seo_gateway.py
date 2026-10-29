"""Tests for BEL-509..BEL-513: Full-Stack CMS Blog, CV Studio Drafts, Analytics Range, SEO & API Gateway."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cms_blog_posts_list_and_slug_detail(client: AsyncClient):
    """
    BEL-509: Verify GET /v1/blog/posts/ and GET /v1/blog/posts/{slug}/ serve
    CMS blog articles with full editorial content for /blog and /blog/[slug].
    """
    list_res = await client.get("/v1/blog/posts/")
    assert list_res.status_code == 200
    posts = list_res.json()
    assert len(posts) >= 3
    slugs = {p["slug"] for p in posts}
    assert "how-to-master-the-30-second-pitch" in slugs

    detail_res = await client.get("/v1/blog/posts/how-to-master-the-30-second-pitch/")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["slug"] == "how-to-master-the-30-second-pitch"
    assert len(detail["content"]) >= 2
    assert len(detail["key_takeaways"]) >= 3

    missing_res = await client.get("/v1/blog/posts/unknown-article-slug/")
    assert missing_res.status_code == 404


@pytest.mark.asyncio
async def test_cv_studio_draft_load_and_cloud_save_with_idor_guard(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
):
    """
    BEL-510: Verify GET /v1/profile/{username}/cv-draft/ loads candidate profile data into CV Studio
    and PUT /v1/profile/{username}/cv-draft/ persists cloud draft updates with IDOR protection.
    """
    username_a = test_candidate_a["username"]
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    headers_b = {"Authorization": f"Bearer {test_candidate_b['token']}"}

    # 1. Load initial CV Studio draft from candidate profile
    get_res = await client.get(f"/v1/profile/{username_a}/cv-draft/", headers=headers_a)
    assert get_res.status_code == 200
    initial_draft = get_res.json()
    assert "full_name" in initial_draft
    assert "headline" in initial_draft
    assert "experience" in initial_draft

    # 2. Save updated CV Studio draft to cloud
    payload = {
        "full_name": "Alex Nguyen Staff",
        "email": test_candidate_a["email"],
        "phone": "+84 909 111 222",
        "headline": "Principal Distributed Systems Architect",
        "summary": "Architected high-throughput payment gateways handling 45,000 RPS with 99.99% SLA.",
        "skills": "Golang, Rust, PostgreSQL 16, Kubernetes, Redis",
        "font_size": 9.8,
        "line_height": 1.25,
        "margin_size": 0.55,
        "snap_one_page": True,
        "experience": [
            {
                "company": "Belooga Cloud",
                "role": "Principal Architect",
                "period": "2024 - Present",
                "bullets": ["Reduced p99 API latency by 62% across 12 microservices."],
            }
        ],
    }
    put_res = await client.put(
        f"/v1/profile/{username_a}/cv-draft/",
        json=payload,
        headers=headers_a,
    )
    assert put_res.status_code == 200
    saved = put_res.json()
    assert saved["headline"] == "Principal Distributed Systems Architect"
    assert saved["font_size"] == 9.8

    # 3. IDOR check: Candidate B cannot overwrite Candidate A's CV Studio draft
    idor_res = await client.put(
        f"/v1/profile/{username_a}/cv-draft/",
        json=payload,
        headers=headers_b,
    )
    assert idor_res.status_code == 403


@pytest.mark.asyncio
async def test_analytics_time_range_and_expert_order_feedback_scorecard(
    client: AsyncClient,
    test_candidate_a: dict,
    test_admin: dict,
):
    """
    BEL-511: Verify GET /v1/analytics/dashboard?range=30D scales telemetry by range
    and GET /v1/expert-review/orders/{order_id}/feedback/ returns a live scorecard for paid orders.
    """
    client.headers.update(test_admin["headers"])
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Create and checkout an expert review order
    ord_res = await client.post(
        "/v1/expert-review/orders/",
        json={
            "package_slug": "pro",
            "resume_url": "https://belooga.com/cv/alex.pdf",
            "target_role": "Principal Backend Engineer",
            "target_companies": "Stripe, Datadog",
        },
        headers=headers_a,
    )
    assert ord_res.status_code == 201
    order_id = ord_res.json()["id"]

    pay_res = await client.post(
        f"/v1/expert-review/orders/{order_id}/checkout/",
        json={"payment_method": "card"},
        headers=headers_a,
    )
    assert pay_res.status_code == 200

    # 2. Fetch live Expert Review Feedback Scorecard for the paid order
    fb_res = await client.get(
        f"/v1/expert-review/orders/{order_id}/feedback/",
        headers=headers_a,
    )
    assert fb_res.status_code == 200
    fb = fb_res.json()
    assert fb["order_id"] == order_id
    assert fb["score_overall"] >= 80
    assert len(fb["strengths"]) >= 2

    # 3. Verify Analytics Dashboard supports ?range=7D vs ?range=30D
    dash_7d = (await client.get("/v1/analytics/dashboard?range=7D")).json()
    dash_30d = (await client.get("/v1/analytics/dashboard?range=30D")).json()
    assert dash_30d["overview"]["total_gmv"] > dash_7d["overview"]["total_gmv"]


@pytest.mark.asyncio
async def test_seo_sitemap_feed_and_lighthouse_metadata_contracts(client: AsyncClient):
    """
    BEL-512: Verify GET /v1/seo/sitemap-data returns indexable public profiles/blog slugs
    and Next.js sitemap.ts, robots.ts, and JSON-LD structured data are configured.
    """
    from pathlib import Path

    seo_res = await client.get("/v1/seo/sitemap-data")
    assert seo_res.status_code == 200
    seo_data = seo_res.json()
    assert "public_usernames" in seo_data
    assert "blog_slugs" in seo_data
    assert len(seo_data["blog_slugs"]) >= 3

    root = Path(__file__).resolve().parents[2]
    assert (root / "frontend/src/app/sitemap.ts").exists()
    assert (root / "frontend/src/app/robots.ts").exists()
    layout_txt = (root / "frontend/src/app/layout.tsx").read_text()
    assert "application/ld+json" in layout_txt
    assert "openGraph" in layout_txt


@pytest.mark.asyncio
async def test_api_gateway_headers_rate_limiting_and_edge_proxy(client: AsyncClient, monkeypatch):
    """
    BEL-513: Verify Dual-Layer API Gateway middleware (X-Request-ID, X-Process-Time-Ms,
    X-RateLimit-*, Security Headers, 429 rate-limit enforcement, GET /v1/gateway/status)
    and Nginx / Next.js Edge Reverse-Proxy configuration.
    """
    from pathlib import Path

    # 1. Verify Gateway telemetry endpoint and response headers
    gw_res = await client.get("/v1/gateway/status")
    assert gw_res.status_code == 200
    assert gw_res.headers.get("x-gateway-service") == "belooga-api-gateway"
    assert "x-request-id" in gw_res.headers
    assert "x-process-time-ms" in gw_res.headers
    assert "x-ratelimit-limit" in gw_res.headers
    assert gw_res.headers.get("x-content-type-options") == "nosniff"
    assert gw_res.headers.get("x-frame-options") == "DENY"

    gw_data = gw_res.json()
    assert gw_data["status"] == "healthy"
    assert gw_data["upstreams"]["postgres"] == "connected"

    # 2. Verify sliding-window rate-limiting enforcement (429 Too Many Requests)
    # Limits come from settings (no client override header); trust the ASGI test peer as a proxy
    # so X-Forwarded-For isolates this test's bucket.
    import uuid
    from app.core.config import get_settings
    monkeypatch.setattr(get_settings(), "RATE_LIMIT_UPLOAD_RPM", 2)
    monkeypatch.setattr(get_settings(), "TRUSTED_PROXY_IPS", "127.0.0.1")
    rl_headers = {"X-Forwarded-For": f"203.0.113.{uuid.uuid4().int % 250 + 1}, 127.0.0.1"}
    r1 = await client.get("/health", headers=rl_headers)
    r2 = await client.get("/health", headers=rl_headers)
    r3 = await client.get("/health", headers=rl_headers)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 429
    assert "retry-after" in r3.headers

    # 3. Verify Edge Reverse-Proxy Gateway files exist
    root = Path(__file__).resolve().parents[2]
    assert (root / "nginx/gateway.conf").exists()
    next_cfg = (root / "frontend/next.config.ts").read_text()
    assert "rewrites" in next_cfg




