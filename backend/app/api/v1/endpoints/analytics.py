from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.analytics import AnalyticsService
from app.schemas.analytics import (
    AnalyticsDashboardResponse,
    BIStarSchemaExportResponse,
    UnitEconomicsResponse,
)

router = APIRouter(prefix="/analytics", tags=["Executive Analytics & Revenue"])


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_executive_analytics_dashboard(
    range: str = Query("7D", description="Time window: 7D, 30D, or ALL"),
    db: AsyncSession = Depends(get_db),
):
    """SSOT Executive Analytics Engine delegating to AnalyticsService."""
    return await AnalyticsService(db).get_dashboard(time_range=range)


@router.get("/unit-economics", response_model=UnitEconomicsResponse)
async def get_executive_unit_economics(db: AsyncSession = Depends(get_db)):
    """Compute LTV/CAC ratio, CAC payback days, and D30/D90 cohort retention telemetry."""
    return await AnalyticsService(db).get_unit_economics()


@router.get("/bi-export", response_model=BIStarSchemaExportResponse)
async def export_bi_star_schema(
    limit: int = Query(100, ge=5, le=500, description="Max rows per fact table"),
    db: AsyncSession = Depends(get_db),
):
    """Export PostgreSQL 16 OLAP Star-Schema facts & dimensions for Power BI Web Connector and DuckDB."""
    return await AnalyticsService(db).get_bi_export(limit=limit)
