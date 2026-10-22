"""TDD Suite for BEL-199 (#125):
- GET /v1/expert-review/leaderboard?sort_by=rank|ats_lift|rating|speed|reviews_count&category=...
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_expert_reviewer_leaderboard_sorting_and_filtering(
    client: AsyncClient,
):
    # 1. Default rank leaderboard
    res = await client.get("/v1/expert-review/leaderboard")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 3
    assert items[0]["ranking_score"] >= items[1]["ranking_score"]
    assert "avg_ats_lift_points" in items[0]
    assert "interview_callback_rate_pct" in items[0]

    # 2. Sort by ats_lift & filter by category=ai
    ai_res = await client.get("/v1/expert-review/leaderboard?category=ai&sort_by=ats_lift")
    assert ai_res.status_code == 200
    ai_items = ai_res.json()
    assert len(ai_items) >= 1
    assert all(e["category"] == "ai" for e in ai_items)
