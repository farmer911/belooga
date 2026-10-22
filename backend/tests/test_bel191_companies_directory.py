"""TDD Suite for BEL-191 (#116):
- GET /v1/companies/search (q, tech_stack, industry, location, company_size, min_rating, hiring_only, sort_by)
- GET /v1/companies/ & POST /v1/companies/
- GET /v1/companies/{slug} & PATCH /v1/companies/{slug}
- POST /v1/companies/{slug}/reviews
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_companies_search_profile_crud_and_reviews(
    client: AsyncClient,
    test_candidate_a: dict,
):
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Search seeded companies by tech_stack & industry via GET /v1/companies/search
    search_res = await client.get("/v1/companies/search?q=VNG&tech_stack=Golang&hiring_only=true")
    assert search_res.status_code == 200
    items = search_res.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert any("VNG" in c["name"] for c in items)

    # 2. Create a new company profile via POST /v1/companies/
    create_res = await client.post(
        "/v1/companies/",
        json={
            "name": "Zalo AI Cloud Labs",
            "industry": "AI / Cloud",
            "company_size": "500-1000 nhân sự",
            "location": "Ho Chi Minh",
            "tech_stack": ["Golang", "Python", "Kubernetes", "PostgreSQL"],
            "description": "High-scale LLM and distributed cloud infrastructure team.",
        },
        headers=headers,
    )
    assert create_res.status_code in (200, 201)
    created = create_res.json()
    slug = created["slug"]
    assert created["name"] == "Zalo AI Cloud Labs"

    # 3. Get company profile by slug via GET /v1/companies/{slug}
    detail_res = await client.get(f"/v1/companies/{slug}")
    assert detail_res.status_code == 200
    assert detail_res.json()["slug"] == slug

    # 4. Update company profile via PATCH /v1/companies/{slug}
    patch_res = await client.patch(
        f"/v1/companies/{slug}",
        json={"avg_salary_usd": 3400, "open_jobs_count": 8},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["avg_salary_usd"] == 3400

    # 5. Add a review via POST /v1/companies/{slug}/reviews
    rev_res = await client.post(
        f"/v1/companies/{slug}/reviews",
        json={
            "author_role": "Staff AI Engineer",
            "rating": 5,
            "title": "Top-tier GPU & distributed systems engineering",
            "comment": "Strong technical mentorship and high engineering bar.",
        },
        headers=headers,
    )
    assert rev_res.status_code in (200, 201)
    rev_company = rev_res.json()
    assert any("Top-tier GPU" in r["title"] for r in rev_company["reviews"])
