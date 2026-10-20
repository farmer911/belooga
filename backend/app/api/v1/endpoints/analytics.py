from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.analytics import AnalyticsService
from app.schemas.analytics import AnalyticsDashboardResponse, UnitEconomicsResponse

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

