"""Integration, Security and IDOR Tests for Domain 11: Candidate Job Applications Tracker (Kanban)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_job_tracker_lifecycle_and_idor(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
):
    """Test full Kanban tracker lifecycle: Create -> List -> Move Status -> Delete with IDOR guard."""
    token_a = test_candidate_a["token"]
    token_b = test_candidate_b["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Unauthenticated creation must be rejected with 401
    res_unauth = await client.post(
        "/v1/tracker/jobs/",
        json={"company_name": "VNG", "position_title": "Backend Engineer"}
    )
    assert res_unauth.status_code == 401

    # 2. Candidate A creates a tracked job card
    payload = {
        "company_name": "VNG Corporation",
        "position_title": "Senior Golang Backend Engineer",
        "status": "TARGETING",
        "expected_salary": "$2,500 - $3,200",
        "match_score": 92,
        "notes": "Target payment gateway team"
    }
    res_create = await client.post("/v1/tracker/jobs/", json=payload, headers=headers_a)
    assert res_create.status_code == 201
    job_data = res_create.json()
    job_id = job_data["id"]
    assert job_data["company_name"] == "VNG Corporation"
    assert job_data["status"] == "TARGETING"

    # 3. List tracked jobs for Candidate A
    res_list = await client.get("/v1/tracker/jobs/", headers=headers_a)
    assert res_list.status_code == 200
    jobs = res_list.json()
    assert any(j["id"] == job_id for j in jobs)

    # 4. Move status along Kanban (TARGETING -> TAILORED -> APPLIED -> INTERVIEW)
    res_move = await client.patch(
        f"/v1/tracker/jobs/{job_id}/status",
        json={"status": "INTERVIEW"},
        headers=headers_a
    )
    assert res_move.status_code == 200
    assert res_move.json()["status"] == "INTERVIEW"

    # 5. IDOR Guard: Candidate B cannot move Candidate A's job card
    res_idor_move = await client.patch(
        f"/v1/tracker/jobs/{job_id}/status",
        json={"status": "OFFER"},
        headers=headers_b
    )
    assert res_idor_move.status_code == 403

    # 6. IDOR Guard: Candidate B cannot delete Candidate A's job card
    res_idor_delete = await client.delete(f"/v1/tracker/jobs/{job_id}", headers=headers_b)
    assert res_idor_delete.status_code == 403

    # 7. Candidate A successfully deletes their job card
    res_delete = await client.delete(f"/v1/tracker/jobs/{job_id}", headers=headers_a)
    assert res_delete.status_code == 204

    # 8. Verify job is gone from Candidate A's list
    res_list_after = await client.get("/v1/tracker/jobs/", headers=headers_a)
    assert all(j["id"] != job_id for j in res_list_after.json())
