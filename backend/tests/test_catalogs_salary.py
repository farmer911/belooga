"""Tests for Domain 7: Salary Benchmark & Market Skill Radar API."""

import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_salary_benchmark_api(client: AsyncClient):
    """Test retrieving salary percentiles and skills premium for Golang Senior."""
    res = await client.get("/v1/catalogs/salary-benchmark?tech_stack=Golang&level=Senior")
    assert res.status_code == 200
    data = res.json()

    assert data["tech_stack"] == "Golang"
    assert data["level"] == "Senior"
    assert data["p25_salary_vnd"] > 0
    assert data["p50_salary_vnd"] > data["p25_salary_vnd"]
    assert data["p75_salary_vnd"] > data["p50_salary_vnd"]
    assert len(data["top_paid_skills"]) >= 3
    assert data["market_demand"] in ["VERY_HIGH", "HIGH", "MODERATE"]
    assert "growth_rate_yoy" in data


@pytest.mark.asyncio
async def test_master_catalogs_db_backed_company_school_location_suggestions(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """
    BEL-504: Verify suggest_companies, suggest_schools, and suggest_locations query
    catalog_companies, catalog_schools, and catalog_locations tables in PostgreSQL.
    """
    tag = uuid.uuid4().hex[:6]
    comp_name = f"Anthropic Labs {tag}"
    school_name = f"ETH Zurich {tag}"
    loc_name = f"Singapore Hub {tag}"

    await db_session.execute(
        text("INSERT INTO catalog_companies (id, name, logo_url) VALUES (gen_random_uuid(), :n, '/images/logo.svg')"),
        {"n": comp_name},
    )
    await db_session.execute(
        text("INSERT INTO catalog_schools (id, name, logo_url) VALUES (gen_random_uuid(), :n, '/images/logo.svg')"),
        {"n": school_name},
    )
    await db_session.execute(
        text("INSERT INTO catalog_locations (id, name, state, country) VALUES (gen_random_uuid(), :n, 'Central', 'SG')"),
        {"n": loc_name},
    )
    await db_session.commit()

    c_res = await client.get(f"/v1/profile/company/?name={tag}")
    assert c_res.status_code == 200
    assert any(item["name"] == comp_name for item in c_res.json())

    s_res = await client.get(f"/v1/profile/school/?name={tag}")
    assert s_res.status_code == 200
    assert any(item["name"] == school_name for item in s_res.json())

    l_res = await client.get(f"/v1/profile/location/?name={tag}")
    assert l_res.status_code == 200
    assert any(loc_name in item["name"] for item in l_res.json())

