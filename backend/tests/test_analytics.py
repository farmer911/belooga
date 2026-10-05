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
