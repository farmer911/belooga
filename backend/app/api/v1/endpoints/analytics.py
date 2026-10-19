from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.analytics import AnalyticsDashboardResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Executive Analytics & Revenue"])


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_executive_analytics_dashboard(db: AsyncSession = Depends(get_db)):
    """SSOT Executive Analytics Engine delegating to AnalyticsService."""
    return await AnalyticsService(db).get_dashboard()
