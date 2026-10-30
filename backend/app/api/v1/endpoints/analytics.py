from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, require_role
from app.modules.analytics import AnalyticsService
from app.schemas.analytics import (
    AnalyticsDashboardResponse,
    BIStarSchemaExportResponse,
    CandidateAnalyticsResponse,
    ExpertAnalyticsResponse,
    RecruiterAnalyticsResponse,
    UnitEconomicsResponse,
)

router = APIRouter(prefix="/analytics", tags=["Executive Analytics & Revenue"])

# Executive views expose platform revenue, buyer names of paid orders and raw fact tables -> admin only.
AdminUser = Depends(require_role("admin"))
# Persona dashboards are platform-wide aggregates (no per-user rows) but include business KPIs -> any signed-in user.
SignedInUser = Depends(get_current_user)


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_executive_analytics_dashboard(
    range: str = Query("7D", description="Time window: 7D, 30D, or ALL"),
    _admin: AuthenticatedUser = AdminUser,
    db: AsyncSession = Depends(get_db),
):
    """SSOT Executive Analytics Engine delegating to AnalyticsService."""
    return await AnalyticsService(db).get_dashboard(time_range=range)


@router.get("/candidate", response_model=CandidateAnalyticsResponse)
async def get_candidate_analytics(_user: AuthenticatedUser = SignedInUser, db: AsyncSession = Depends(get_db)):
    """Return 360-degree Candidate Career & ATS Analytics."""
    return await AnalyticsService(db).get_candidate_analytics()


@router.get("/recruiter", response_model=RecruiterAnalyticsResponse)
async def get_recruiter_analytics(_user: AuthenticatedUser = SignedInUser, db: AsyncSession = Depends(get_db)):
    """Return 360-degree Recruiter Hiring Pipeline & Funnel Analytics."""
    return await AnalyticsService(db).get_recruiter_analytics()


@router.get("/expert", response_model=ExpertAnalyticsResponse)
async def get_expert_analytics(_user: AuthenticatedUser = SignedInUser, db: AsyncSession = Depends(get_db)):
    """Return 360-degree Expert Reviewer SLA, Earnings & ATS Lift Analytics."""
    return await AnalyticsService(db).get_expert_analytics()



@router.get("/unit-economics", response_model=UnitEconomicsResponse)
async def get_executive_unit_economics(_admin: AuthenticatedUser = AdminUser, db: AsyncSession = Depends(get_db)):
    """Compute LTV/CAC ratio, CAC payback days, and D30/D90 cohort retention telemetry."""
    return await AnalyticsService(db).get_unit_economics()


@router.get("/bi-export", response_model=BIStarSchemaExportResponse)
async def export_bi_star_schema(
    limit: int = Query(100, ge=5, le=500, description="Max rows per fact table"),
    _admin: AuthenticatedUser = AdminUser,
    db: AsyncSession = Depends(get_db),
):
    """Export PostgreSQL 16 OLAP Star-Schema facts & dimensions for Power BI Web Connector and DuckDB."""
    return await AnalyticsService(db).get_bi_export(limit=limit)
