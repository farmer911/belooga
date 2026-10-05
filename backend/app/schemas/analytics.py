from pydantic import BaseModel
from typing import List, Dict, Any

class OverviewMetrics(BaseModel):
    total_users: int
    total_scans: int
    active_job_trackers: int
    total_gmv: float
    platform_net_revenue: float
    escrow_float: float
    monthly_infra_cost: float
    net_profit: float
    net_margin_percent: float

class RevenueSeriesPoint(BaseModel):
    date: str
    micro_pass_rev: float
    expert_fee_rev: float
    total: float

class FunnelStage(BaseModel):
    stage: str
    count: int
    conversion_rate: float

class TransactionRecord(BaseModel):
    id: str
    user_name: str
    package_name: str
    amount: float
    platform_fee: float
    payment_method: str
    status: str
    created_at: str

class AnalyticsDashboardResponse(BaseModel):
    overview: OverviewMetrics
    revenue_chart: List[RevenueSeriesPoint]
    funnel: List[FunnelStage]
    recent_transactions: List[TransactionRecord]
