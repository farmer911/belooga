"""TDD Integration Tests for BEL-163 (#84):
- GET /v1/blog/posts/ (filterable by type=all|user|editorial)
- POST /v1/blog/posts/ (create USER_STATUS post persisted in PostgreSQL)
- POST /v1/blog/posts/{post_id}/like (toggle like/unlike)
- POST /v1/blog/posts/{post_id}/comments (add comment & dispatch notification)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_community_social_feed_posts_likes_and_comments(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
):
    """Verify full lifecycle of community social feed: list, create status post, like toggle, and comment notification."""
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    headers_b = {"Authorization": f"Bearer {test_candidate_b['token']}"}

    # 1. List initial feed (includes auto-seeded EDITORIAL and USER_STATUS posts)
    res_all = await client.get("/v1/blog/posts/")
    assert res_all.status_code == 200
    posts_all = res_all.json()
    assert len(posts_all) >= 4
    assert any(p.get("post_type") == "EDITORIAL" for p in posts_all)
    assert any(p.get("post_type") == "USER_STATUS" for p in posts_all)

    # Filter by type=user
    res_user = await client.get("/v1/blog/posts/?type=user")
    assert res_user.status_code == 200
    assert all(p.get("post_type") == "USER_STATUS" for p in res_user.json())

    # 2. Candidate A creates a new USER_STATUS post
    create_res = await client.post(
        "/v1/blog/posts/",
        json={
            "title": "Đạt 95/100 điểm ATS cho vị trí Principal Backend @ Belooga!",
            "excerpt": "Vừa nâng cấp CV chuẩn STAR và đính kèm Video Pitch 30s trên Belooga.",
            "content": ["Vừa nâng cấp CV chuẩn STAR và đính kèm Video Pitch 30s trên Belooga."],
            "post_type": "USER_STATUS",
            "tags": ["Golang", "FastAPI", "ATSScore"],
            "ats_score_badge": 95,
        },
        headers=headers_a,
    )
    assert create_res.status_code == 201
    created = create_res.json()
    post_slug = created["slug"]
    assert created["post_type"] == "USER_STATUS"
    assert created["ats_score_badge"] == 95
    assert created["author_username"] == test_candidate_a["username"]

    # 3. Candidate B likes Candidate A's post
    like_res = await client.post(
        f"/v1/blog/posts/{post_slug}/like",
        json={},
        headers=headers_b,
    )
    assert like_res.status_code == 200
    liked = like_res.json()
    assert liked["likes_count"] == created["likes_count"] + 1
    assert liked["is_liked_by_me"] is True

    # Toggle unlike
    unlike_res = await client.post(
        f"/v1/blog/posts/{post_slug}/like",
        json={},
        headers=headers_b,
    )
    assert unlike_res.status_code == 200
    assert unlike_res.json()["likes_count"] == created["likes_count"]

    # 4. Candidate B comments on Candidate A's post -> dispatches notification to Candidate A
    comment_res = await client.post(
        f"/v1/blog/posts/{post_slug}/comments",
        json={"content": "Chúc mừng bạn! Điểm ATS 95/100 quá ấn tượng."},
        headers=headers_b,
    )
    assert comment_res.status_code == 200
    commented = comment_res.json()
    assert commented["comments_count"] == 1
    assert commented["comments"][-1]["content"] == "Chúc mừng bạn! Điểm ATS 95/100 quá ấn tượng."

    # Verify Candidate A received a notification
    notif_res = await client.get("/v1/notifications/", headers=headers_a)
    assert notif_res.status_code == 200
    items = notif_res.json()["items"]
    assert any("bình luận" in i["title"].lower() or "comment" in i["event_type"].lower() for i in items)
