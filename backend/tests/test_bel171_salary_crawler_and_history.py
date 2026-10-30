"""TDD Suite for BEL-171 (#93):
- POST /v1/catalogs/salary-benchmark/crawl (Automated IT Salary Crawler persisted in PostgreSQL)
- GET /v1/catalogs/salary-benchmark?year=2024|2025|2026|all (Historical time-series 2024 -> 2026 & growth_since_2024_pct)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_salary_benchmark_historical_series_and_crawler(client: AsyncClient, test_admin: dict):
    client.headers.update(test_admin["headers"])
    # 1. Fetch full historical series (2024 -> 2026)
    res_all = await client.get(
        "/v1/catalogs/salary-benchmark?role=backend&tech_stack=Golang&level=Senior&location=Ho%20Chi%20Minh&year=all"
    )
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert "historical_series" in data_all
    assert len(data_all["historical_series"]) >= 6
    assert data_all["growth_since_2024_pct"] > 0
    assert "crawler_sources" in data_all
    assert len(data_all["crawler_sources"]) >= 4
    initial_samples = data_all["sample_size_jds"]

    # 2. Filter historical series by year=2024
    res_2024 = await client.get(
        "/v1/catalogs/salary-benchmark?role=backend&tech_stack=Golang&level=Senior&location=Ho%20Chi%20Minh&year=2024"
    )
    assert res_2024.status_code == 200
    series_2024 = res_2024.json()["historical_series"]
    assert len(series_2024) >= 1
    assert all(pt["year"] == "2024" for pt in series_2024)

    # 3. Trigger automated salary crawler via POST /v1/catalogs/salary-benchmark/crawl
    crawl_res = await client.post(
        "/v1/catalogs/salary-benchmark/crawl",
        json={"role": "backend", "tech_stack": "Golang", "level": "Senior", "location": "Ho Chi Minh"},
    )
    assert crawl_res.status_code in (200, 201)
    crawled = crawl_res.json()
    assert crawled["sample_size_jds"] > initial_samples
    assert crawled["last_crawled_at"]
    assert any(s["source_name"] == "ITviec" for s in crawled["crawler_sources"])
