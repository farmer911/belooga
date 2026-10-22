"""TDD Suite for BEL-195 (#121):
- GET /v1/search/top-candidates (category, skill, location, actively_looking_only, limit)
- Excludes hidden candidates (is_hidden=TRUE)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_top_high_potential_candidates_leaderboard_and_privacy(
    client: AsyncClient,
):
    # 1. GET /v1/search/top-candidates returns ranked candidates with potential_score & badge_tier
    res = await client.get("/v1/search/top-candidates")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 3
    assert items[0]["rank"] == 1
    assert items[0]["potential_score"] >= items[1]["potential_score"]
    assert items[0]["badge_tier"] in ("TOP_1_PCT", "TOP_5_PCT", "RISING_STAR")
    assert "highlight_reason" in items[0]
    assert all(c["username"] not in ("hidden_jane", "alexnguyen") for c in items)

    # 2. Filter by category=backend & actively_looking_only=true
    cat_res = await client.get("/v1/search/top-candidates?category=backend&actively_looking_only=true")
    assert cat_res.status_code == 200
    cat_items = cat_res.json()
    assert len(cat_items) >= 1
    assert all(c["category"] == "backend" and c["actively_looking"] is True for c in cat_items)
