"""Tests for Domain 7: Salary Benchmark & Market Skill Radar API."""

import pytest
from httpx import AsyncClient

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
