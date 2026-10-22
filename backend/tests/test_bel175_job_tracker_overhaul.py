"""TDD Suite for BEL-175 (#97):
- GET /v1/tracker/jobs/ (server-side search q, status, min_score, sort_by)
- GET /v1/tracker/search-market-jobs?q=...&skills=...&location=...
- GET/POST /v1/tracker/goals (persisted Career Goals in PostgreSQL)
- POST /v1/tracker/goals/{goal_id}/ai-match (Paid AI Job Matcher deducting wallet & populating Kanban)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_job_tracker_search_persisted_goals_and_paid_ai_match(
    client: AsyncClient,
    test_candidate_a: dict,
):
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Persist a Career Goal via POST /v1/tracker/goals & verify GET /v1/tracker/goals
    goal_res = await client.post(
        "/v1/tracker/goals",
        json={
            "target_role": "Principal Golang Architect",
            "target_salary": "75.000.000 VNĐ",
            "preferred_skills": "Golang, PostgreSQL, Kubernetes",
            "location": "Ho Chi Minh / Remote",
        },
        headers=headers,
    )
    assert goal_res.status_code in (200, 201)
    saved_goal = goal_res.json()
    assert saved_goal["target_role"] == "Principal Golang Architect"
    goal_id = saved_goal["id"]

    get_goal_res = await client.get("/v1/tracker/goals", headers=headers)
    assert get_goal_res.status_code == 200
    assert get_goal_res.json()["target_role"] == "Principal Golang Architect"

    # 2. Search market jobs via GET /v1/tracker/search-market-jobs
    mkt_res = await client.get("/v1/tracker/search-market-jobs?q=Golang")
    assert mkt_res.status_code == 200
    mkt_jobs = mkt_res.json()
    assert isinstance(mkt_jobs, list)
    assert len(mkt_jobs) >= 1
    assert any("golang" in (j["position_title"] + " " + " ".join(j.get("skills", []))).lower() for j in mkt_jobs)

    # 3. Trigger Paid AI Job Matcher via POST /v1/tracker/goals/{goal_id}/ai-match
    ai_res = await client.post(
        f"/v1/tracker/goals/{goal_id}/ai-match",
        json={
            "target_role": "Principal Golang Architect",
            "preferred_skills": "Golang, PostgreSQL, Kubernetes",
        },
        headers=headers,
    )
    assert ai_res.status_code in (200, 201)
    ai_data = ai_res.json()
    assert ai_data["matched_count"] >= 2
    assert len(ai_data["matched_jobs"]) >= 2

    # 4. Verify server-side filtering & sorting on GET /v1/tracker/jobs/
    filter_res = await client.get(
        "/v1/tracker/jobs/?q=Grab&min_score=90&sort_by=match_score",
        headers=headers,
    )
    assert filter_res.status_code == 200
    filtered_jobs = filter_res.json()
    assert len(filtered_jobs) >= 1
    assert any("Grab" in j["company_name"] for j in filtered_jobs)
