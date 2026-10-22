"""TDD Suite for BEL-203 (#132):
- POST /v1/expert-review/apply (Persist into expert_profiles & dispatch NotificationBell)
- GET /v1/expert-review/me
- Verify newly registered expert appears in GET /v1/expert-review/experts/ and GET /v1/expert-review/leaderboard
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_become_expert_reviewer_registration_and_persistence(
    client: AsyncClient,
    test_candidate_a: dict,
):
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Register as an Expert Reviewer via POST /v1/expert-review/apply
    apply_res = await client.post(
        "/v1/expert-review/apply",
        json={
            "full_name": "Nguyễn Minh Phúc",
            "role_title": "Principal Full-Stack & Distributed Systems Architect",
            "company_name": "VNG Cloud & AI",
            "years_experience": 8,
            "category": "backend",
            "specialties": ["Golang", "FastAPI", "PostgreSQL", "System Design"],
            "turnaround_hours": 24,
            "hourly_rate_vnd": 299000,
            "linkedin_url": "https://linkedin.com/in/phucnguyen",
            "bio": "8+ years scaling 25k CCU distributed architectures and hiring 200+ engineers.",
        },
        headers=headers,
    )
    assert apply_res.status_code in (200, 201)
    saved = apply_res.json()
    assert saved["full_name"] == "Nguyễn Minh Phúc"
    assert saved["company_name"] == "VNG Cloud & AI"

    # 2. Verify GET /v1/expert-review/me returns persisted profile
    me_res = await client.get("/v1/expert-review/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Nguyễn Minh Phúc"

    # 3. Verify expert appears in GET /v1/expert-review/experts/ and GET /v1/expert-review/leaderboard
    exp_res = await client.get("/v1/expert-review/experts/")
    assert exp_res.status_code == 200
    assert any(e["full_name"] == "Nguyễn Minh Phúc" for e in exp_res.json())

    lb_res = await client.get("/v1/expert-review/leaderboard")
    assert lb_res.status_code == 200
    assert any(e["full_name"] == "Nguyễn Minh Phúc" for e in lb_res.json())
