"""TDD Suite for BEL-166: Multi-Company Career Posting & Candidate 1-Click Job Application API (/v1/careers)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_careers_multi_company_crud_and_1click_apply(
    client: AsyncClient,
    test_candidate_a: dict,
):
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. List initial career postings via /v1/careers/
    res = await client.get("/v1/careers/")
    assert res.status_code == 200
    jobs = res.json()
    assert isinstance(jobs, list)
    assert len(jobs) >= 3
    assert "company_name" in jobs[0]
    assert "skills" in jobs[0]

    # 2. Create a new multi-company career posting via POST /v1/careers/
    create_payload = {
        "company_name": "VNG Cloud",
        "company_logo_url": "/images/companies/vng.png",
        "company_website": "https://vngcloud.vn",
        "title": "Principal Distributed Systems Architect",
        "department": "Cloud Infrastructure",
        "location": "Ho Chi Minh City / Hybrid",
        "salary_range": "$5,500 - $7,500 / month",
        "skills": ["Golang", "PostgreSQL", "Kubernetes", "Rust"],
        "description": "Design ultra-low-latency storage and container orchestration across APAC regions.",
        "is_partner": True,
    }
    post_res = await client.post("/v1/careers/", json=create_payload, headers=headers)
    assert post_res.status_code in (200, 201)
    created_job = post_res.json()
    assert created_job["company_name"] == "VNG Cloud"
    assert created_job["title"] == "Principal Distributed Systems Architect"
    assert "Golang" in created_job["skills"]
    job_id = created_job["id"]

    # 3. Filter career postings by company and query string
    filter_res = await client.get("/v1/careers/?company=VNG%20Cloud&q=Distributed")
    assert filter_res.status_code == 200
    filtered = filter_res.json()
    assert any(j["id"] == job_id for j in filtered)

    # 4. Apply 1-Click to the career posting via POST /v1/careers/{career_id}/apply
    apply_res = await client.post(
        f"/v1/careers/{job_id}/apply",
        json={
            "applicant_name": "Alex Nguyen",
            "applicant_email": "alex@belooga.com",
            "resume_url": "/uploads/resumes/alex_cv.pdf",
        },
        headers=headers,
    )
    assert apply_res.status_code in (200, 201)
    apply_data = apply_res.json()
    assert "id" in apply_data
    assert apply_data.get("tracker_synced") is True

    # 5. Verify Kanban Job Tracker (/v1/tracker/jobs/) has the auto-synced application card
    tracker_res = await client.get("/v1/tracker/jobs/", headers=headers)
    assert tracker_res.status_code == 200
    tracker_items = tracker_res.json()
    assert any(
        item.get("company_name") == "VNG Cloud"
        and item.get("position_title") == "Principal Distributed Systems Architect"
        for item in tracker_items
    )
