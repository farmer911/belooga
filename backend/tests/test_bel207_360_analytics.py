"""TDD Suite for BEL-207 (#136):
- GET /v1/analytics/candidate
- GET /v1/analytics/recruiter
- GET /v1/analytics/expert
- GET /v1/analytics/dashboard
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_360_degree_analytics_candidate_recruiter_and_expert(
    client: AsyncClient,
    candidate_headers: dict,
):
    client.headers.update(candidate_headers)
    # 1. Candidate analytics
    cand_res = await client.get("/v1/analytics/candidate")
    assert cand_res.status_code == 200
    cand_data = cand_res.json()
    assert cand_data["profile_views_count"] > 0
    assert "application_funnel" in cand_data
    assert len(cand_data["ats_score_history"]) >= 2
    assert len(cand_data["skill_gap_radar"]) >= 2

    # 2. Recruiter analytics
    rec_res = await client.get("/v1/analytics/recruiter")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert rec_data["open_roles_count"] > 0
    assert len(rec_data["stage_funnel"]) >= 4

    # 3. Expert analytics
    exp_res = await client.get("/v1/analytics/expert")
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["completed_reviews_count"] > 0
    assert exp_data["gross_earnings_vnd"] > 0
    assert exp_data["net_payout_vnd"] > 0
