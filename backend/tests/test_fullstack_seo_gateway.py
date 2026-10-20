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
):
    """
    BEL-511: Verify GET /v1/analytics/dashboard?range=30D scales telemetry by range
    and GET /v1/expert-review/orders/{order_id}/feedback/ returns a live scorecard for paid orders.
    """
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


