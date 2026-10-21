from pydantic import BaseModel
from typing import List


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


class UnitEconomicsResponse(BaseModel):
    ltv_vnd: float
    cac_vnd: float
    ltv_to_cac_ratio: float
    payback_period_days: int
    cohort_retention_d30_pct: float
    cohort_retention_d90_pct: float
    arr_run_rate_vnd: float
    strategic_growth_insight: str


class FactATSScanRow(BaseModel):
    scan_id: str
    job_title: str
    company_name: str
    ats_score: int
    matched_skills_count: int
    missing_skills_count: int
    scanned_at: str


class FactReviewOrderRow(BaseModel):
    order_id: str
    target_role: str
    order_status: str
    amount_vnd: float
    platform_fee_vnd: float
    created_at: str


class FactJobPipelineRow(BaseModel):
    status: str
    job_count: int
    avg_match_score: float


class DimSkillDemandRow(BaseModel):
    skill_name: str
    jd_demand_count: int
    candidate_supply_count: int
    demand_gap_index: float


class BIStarSchemaExportResponse(BaseModel):
    schema_version: str
    generated_at: str
    power_bi_m_query_snippet: str
    duckdb_sql_snippet: str
    fact_ats_scans: List[FactATSScanRow]
    fact_review_orders: List[FactReviewOrderRow]
    fact_job_pipeline: List[FactJobPipelineRow]
    dim_skills_demand: List[DimSkillDemandRow]
