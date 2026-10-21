"""Integration Tests for Domain 12: Executive Analytics & Platform Revenue."""

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_executive_analytics_dashboard(client: AsyncClient):
    """Test retrieving platform executive analytics, financial metrics, and funnel."""
    response = await client.get("/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()

    # 1. Assert Overview Metrics
    assert "overview" in data
    overview = data["overview"]
    assert "total_users" in overview
    assert "total_scans" in overview
    assert "total_gmv" in overview
    assert "platform_net_revenue" in overview
    assert "monthly_infra_cost" in overview
    assert "net_profit" in overview
    assert overview["total_gmv"] >= 0
    assert overview["monthly_infra_cost"] == 375000.0  # ~$15 infra cap

    # 2. Assert Time Series Chart Data
    assert "revenue_chart" in data
    chart = data["revenue_chart"]
    assert len(chart) == 7
    for point in chart:
        assert "date" in point
        assert "total" in point
        assert point["total"] >= 0

    # 3. Assert Funnel Stages
    assert "funnel" in data
    funnel = data["funnel"]
    assert len(funnel) == 4
    assert funnel[0]["stage"].startswith("1. Khách truy cập")
    assert funnel[0]["conversion_rate"] == 100.0

    # 4. Assert Recent Transactions
    assert "recent_transactions" in data
    txns = data["recent_transactions"]
    assert len(txns) > 0
    assert txns[0]["payment_method"] == "MoMo QR"


@pytest.mark.asyncio
async def test_bi_star_schema_export_and_olap_cte_telemetry(client: AsyncClient):
    """Verify GET /v1/analytics/bi-export returns Power BI / DuckDB Star-Schema facts & dimensions from PostgreSQL OLAP CTEs."""
    # Seed a real ATS scan so fact_ats_scans & dim_skills_demand reflect live DB rows
    scan_res = await client.post(
        "/v1/match/ats-scan",
        json={
            "job_title": "Principal Data & Golang Architect",
            "company_name": "Belooga Data Cloud",
            "jd_text": "Required skills: Golang, PostgreSQL, Kubernetes, Kafka, Redis for high-scale OLAP.",
            "cv_text": "- Architected Golang and PostgreSQL pipelines handling 50,000 rps and reducing p95 latency by 65%.",
        },
    )
    assert scan_res.status_code == 200

    res = await client.get("/v1/analytics/bi-export?limit=50")
    assert res.status_code == 200
    payload = res.json()

    assert payload["schema_version"] == "belooga-star-v1"
    assert "Json.Document(Web.Contents(" in payload["power_bi_m_query_snippet"]
    assert "/v1/analytics/bi-export" in payload["power_bi_m_query_snippet"]
    assert "read_json_auto" in payload["duckdb_sql_snippet"]

    # Fact 1: ATS Scans
    assert isinstance(payload["fact_ats_scans"], list)
    assert len(payload["fact_ats_scans"]) >= 1
    assert any(r["job_title"] == "Principal Data & Golang Architect" for r in payload["fact_ats_scans"])
    first_scan = payload["fact_ats_scans"][0]
    assert "ats_score" in first_scan
    assert "matched_skills_count" in first_scan
    assert "missing_skills_count" in first_scan

    # Fact 2: Review Orders
    assert isinstance(payload["fact_review_orders"], list)

    # Fact 3: Job Pipeline Stage OLAP Aggregations
    assert isinstance(payload["fact_job_pipeline"], list)
    assert len(payload["fact_job_pipeline"]) >= 1
    assert "status" in payload["fact_job_pipeline"][0]
    assert "job_count" in payload["fact_job_pipeline"][0]
    assert "avg_match_score" in payload["fact_job_pipeline"][0]

    # Dimension: Skills Supply vs Demand OLAP
    assert isinstance(payload["dim_skills_demand"], list)
    assert len(payload["dim_skills_demand"]) >= 1
    first_dim = payload["dim_skills_demand"][0]
    assert "skill_name" in first_dim
    assert "jd_demand_count" in first_dim
    assert "candidate_supply_count" in first_dim
    assert "demand_gap_index" in first_dim

