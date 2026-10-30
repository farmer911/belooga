"""TDD Suite for BEL-187 (#112):
- POST /v1/posts/ (Create user post / technical article)
- GET /v1/posts/ & GET /v1/posts/user/{username} (List all & by user profile)
- PATCH /v1/posts/{post_id} (Edit post with author IDOR guard)
- DELETE /v1/posts/{post_id} (Delete post with author IDOR guard)
- POST /v1/posts/{post_id}/like & POST /v1/posts/{post_id}/comments
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_user_posts_crud_idor_like_and_comments(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
):
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    headers_b = {"Authorization": f"Bearer {test_candidate_b['token']}"}
    username_a = test_candidate_a["username"]

    # 1. Create a new user post via POST /v1/posts/
    create_res = await client.post(
        "/v1/posts/",
        json={
            "title": "High-Throughput FastAPI + PostgreSQL 16 GIN Architecture",
            "category": "Chia sẻ kiến thức",
            "body": "Combining Singleflight SWR caching and PostgreSQL 16 GIN TSVECTOR delivers sub-15ms P99 search.",
            "tags": ["Python", "FastAPI", "PostgreSQL"],
            "attachment_link": "https://github.com/farmer911/belooga",
        },
        headers=headers_a,
    )
    assert create_res.status_code in (200, 201)
    created = create_res.json()
    assert created["username"] == username_a
    assert created["title"] == "High-Throughput FastAPI + PostgreSQL 16 GIN Architecture"
    post_id = created["id"]

    # 2. List posts by author via GET /v1/posts/user/{username}
    user_list_res = await client.get(f"/v1/posts/user/{username_a}")
    assert user_list_res.status_code == 200
    user_posts = user_list_res.json()
    assert any(p["id"] == post_id for p in user_posts)

    # 3. IDOR Guard: Candidate B cannot edit Candidate A's post (403)
    idor_patch = await client.patch(
        f"/v1/posts/{post_id}",
        json={"title": "Hacked Title"},
        headers=headers_b,
    )
    assert idor_patch.status_code == 403

    # 4. Owner Candidate A can edit their own post via PATCH /v1/posts/{post_id}
    patch_res = await client.patch(
        f"/v1/posts/{post_id}",
        json={
            "title": "Updated: FastAPI + PostgreSQL 16 GIN Architecture (25k CCU)",
            "body": "Updated deep dive with 25,000 CCU benchmarks.",
        },
        headers=headers_a,
    )
    assert patch_res.status_code == 200
    assert "25k CCU" in patch_res.json()["title"]

    # 5. Like & Comment via POST /v1/posts/{post_id}/like and /comments
    like_res = await client.post(f"/v1/posts/{post_id}/like", headers=headers_b)
    assert like_res.status_code == 200
    assert like_res.json()["likes_count"] == 1  # only B liked it

    comment_res = await client.post(
        f"/v1/posts/{post_id}/comments",
        json={"content": "Great architectural write-up!"},
        headers=headers_b,
    )
    assert comment_res.status_code == 200
    assert any("Great architectural" in c["content"] for c in comment_res.json()["comments"])

    # 6. IDOR Guard: Candidate B cannot delete Candidate A's post (403), then Candidate A deletes it (200)
    idor_del = await client.delete(f"/v1/posts/{post_id}", headers=headers_b)
    assert idor_del.status_code == 403

    del_res = await client.delete(f"/v1/posts/{post_id}", headers=headers_a)
    assert del_res.status_code in (200, 204)
