"""TDD Suite for BEL-169 (#90):
- GET /v1/catalogs/skills?q=... & POST /v1/catalogs/skills (dedup custom skill creation)
- GET /v1/search/candidates?skills=... & GET /v1/profile/search/?skills=... (multi-skill filtering + candidate skills array)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_custom_skill_catalog_and_multi_skill_candidate_search(client: AsyncClient):
    # 1. List initial skills from /v1/catalogs/skills
    list_res = await client.get("/v1/catalogs/skills")
    assert list_res.status_code == 200
    skills = list_res.json()
    assert isinstance(skills, list)
    assert len(skills) >= 5
    assert any(s["name"].lower() == "python" for s in skills)

    # 2. Create a custom skill via POST /v1/catalogs/skills (and verify deduplication)
    create_res = await client.post(
        "/v1/catalogs/skills",
        json={"name": "ZigLang", "category": "Systems Engineering"},
    )
    assert create_res.status_code in (200, 201)
    created_skill = create_res.json()
    assert created_skill["name"] == "ZigLang"
    assert "id" in created_skill

    dup_res = await client.post(
        "/v1/catalogs/skills",
        json={"name": "ziglang", "category": "Systems Engineering"},
    )
    assert dup_res.status_code in (200, 201)
    assert dup_res.json()["id"] == created_skill["id"]

    # 3. Query /v1/catalogs/skills?q=Zig
    q_res = await client.get("/v1/catalogs/skills?q=Zig")
    assert q_res.status_code == 200
    assert any(s["name"] == "ZigLang" for s in q_res.json())

    # 4. Search candidates with multi-skill filter via /v1/search/candidates
    search_res = await client.get("/v1/search/candidates?skills=Python,FastAPI")
    assert search_res.status_code == 200
    data = search_res.json()
    assert "results" in data
    assert len(data["results"]) >= 1
    first = data["results"][0]
    assert "skills" in first
    assert isinstance(first["skills"], list)
    assert any(sk.lower() in ("python", "fastapi") for sk in first["skills"])
