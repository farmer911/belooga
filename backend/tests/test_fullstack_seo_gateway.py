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
