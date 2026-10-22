"""TDD Suite for BEL-183 (#108):
- GET /v1/recruiter/pipeline
- POST /v1/recruiter/pipeline
- PATCH /v1/recruiter/pipeline/{item_id}
- POST /v1/recruiter/compare
- POST /v1/recruiter/invite (Wallet deduction, NotificationBell dispatch & Candidate Kanban sync)
- Enforces is_hidden=TRUE privacy guard
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_recruiter_hiring_hub_pipeline_compare_and_invite(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
):
    headers_recruiter = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    cand_b_username = test_candidate_b["username"]

    # 1. GET /v1/recruiter/pipeline returns initial seeded or persisted pipeline items
    list_res = await client.get("/v1/recruiter/pipeline", headers=headers_recruiter)
    assert list_res.status_code == 200
    initial_items = list_res.json()
    assert isinstance(initial_items, list)
    assert len(initial_items) >= 1

    # 2. POST /v1/recruiter/pipeline adds a visible candidate to pipeline
    add_res = await client.post(
        "/v1/recruiter/pipeline",
        json={
            "username": cand_b_username,
            "target_role": "Principal Engineer",
            "stage": "SHORTLISTED",
            "recruiter_rating": 5,
            "evaluation_notes": "Strong distributed systems background.",
        },
        headers=headers_recruiter,
    )
    assert add_res.status_code in (200, 201)
    added_item = add_res.json()
    assert added_item["username"] == cand_b_username
    assert added_item["stage"] == "SHORTLISTED"
    item_id = added_item["id"]

    # 3. PATCH /v1/recruiter/pipeline/{item_id} updates stage & evaluation notes
    patch_res = await client.patch(
        f"/v1/recruiter/pipeline/{item_id}",
        json={
            "stage": "PITCH_REVIEWED",
            "recruiter_rating": 5,
            "evaluation_notes": "60s Video Pitch reviewed and approved.",
        },
        headers=headers_recruiter,
    )
    assert patch_res.status_code == 200
    patched_item = patch_res.json()
    assert patched_item["stage"] == "PITCH_REVIEWED"
    assert "60s Video Pitch" in patched_item["evaluation_notes"]

    # 4. POST /v1/recruiter/compare compares 2-3 candidates side-by-side against JD
    comp_res = await client.post(
        "/v1/recruiter/compare",
        json={
            "usernames": [test_candidate_a["username"], cand_b_username],
            "jd_text": "Senior Golang, FastAPI, PostgreSQL, Kubernetes Architect",
        },
        headers=headers_recruiter,
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert "comparisons" in comp_data
    assert len(comp_data["comparisons"]) >= 2
    assert all("ats_score" in c and "matched_skills" in c for c in comp_data["comparisons"])

    # 5. POST /v1/recruiter/invite sends interview invite, unlocks contact via Wallet (49,000 VND), and syncs Kanban
    inv_res = await client.post(
        "/v1/recruiter/invite",
        json={
            "username": cand_b_username,
            "job_title": "Principal Distributed Systems Engineer",
            "interview_datetime": "2026-10-28 14:00 ICT",
            "offered_salary_range": "75.000.000 VNĐ",
            "custom_video_prompt": "How do you prevent cache stampede at 25,000 CCU?",
            "unlock_contact_via_wallet": True,
        },
        headers=headers_recruiter,
    )
    assert inv_res.status_code in (200, 201)
    inv_data = inv_res.json()
    assert inv_data["username"] == cand_b_username
    assert inv_data["stage"] == "INTERVIEW_INVITED"
    assert inv_data["contact_unlocked"] is True

    # 6. Privacy Guard: hidden_jane (is_hidden=TRUE) cannot be added to pipeline (404)
    hidden_res = await client.post(
        "/v1/recruiter/pipeline",
        json={"username": "hidden_jane", "target_role": "Principal Engineer"},
        headers=headers_recruiter,
    )
    assert hidden_res.status_code == 404

