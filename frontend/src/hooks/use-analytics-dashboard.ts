"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";

export interface OverviewMetrics {
  total_users: number;
  total_scans: number;
  active_job_trackers: number;
  total_gmv: number;
  platform_net_revenue: number;
  escrow_float: number;
  monthly_infra_cost: number;
  net_profit: number;
  net_margin_percent: number;
}

export interface RevenueSeriesPoint {
  date: string;
  micro_pass_rev: number;
  expert_fee_rev: number;
  total: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversion_rate: number;
}

export interface TransactionRecord {
  id: string;
  user_name: string;
  package_name: string;
  amount: number;
  platform_fee: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface AnalyticsData {
  overview: OverviewMetrics;
  revenue_chart: RevenueSeriesPoint[];
  funnel: FunnelStage[];
  recent_transactions: TransactionRecord[];
}

export interface UnitEconomicsData {
  ltv_vnd: number;
  cac_vnd: number;
  ltv_to_cac_ratio: number;
  payback_period_days: number;
  cohort_retention_d30_pct: number;
  cohort_retention_d90_pct: number;
  arr_run_rate_vnd: number;
  strategic_growth_insight: string;
}

export interface DimSkillDemandRow {
  skill_name: string;
  jd_demand_count: number;
  candidate_supply_count: number;
  demand_gap_index: number;
}

export interface BIStarSchemaExportData {
  schema_version: string;
  generated_at: string;
  power_bi_m_query_snippet: string;
  powerquery_m_script?: string;
  duckdb_sql_snippet: string;
  fact_ats_scans: Array<{
    scan_id: string;
    job_title: string;
    company_name: string;
    ats_score: number;
    matched_skills_count: number;
    missing_skills_count: number;
    scanned_at: string;
  }>;
  fact_review_orders: Array<{
    order_id: string;
    target_role: string;
    order_status: string;
    amount_vnd: number;
    platform_fee_vnd: number;
    created_at: string;
  }>;
  fact_job_pipeline: Array<{
    status: string;
    job_count: number;
    avg_match_score: number;
  }>;
  dim_skills_demand: DimSkillDemandRow[];
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  overview: {
    total_users: 142,
    total_scans: 685,
    active_job_trackers: 310,
    total_gmv: 12955000,
    platform_net_revenue: 7385000,
    escrow_float: 5570000,
    monthly_infra_cost: 375000,
    net_profit: 7010000,
    net_margin_percent: 94.9,
  },
  revenue_chart: [
    { date: "29/09", micro_pass_rev: 450000, expert_fee_rev: 210000, total: 660000 },
    { date: "30/09", micro_pass_rev: 620000, expert_fee_rev: 280000, total: 900000 },
    { date: "01/10", micro_pass_rev: 780000, expert_fee_rev: 350000, total: 1130000 },
    { date: "02/10", micro_pass_rev: 890000, expert_fee_rev: 420000, total: 1310000 },
    { date: "03/10", micro_pass_rev: 950000, expert_fee_rev: 390000, total: 1340000 },
    { date: "04/10", micro_pass_rev: 1120000, expert_fee_rev: 480000, total: 1600000 },
    { date: "05/10", micro_pass_rev: 1240000, expert_fee_rev: 560000, total: 1800000 },
  ],
  funnel: [
    { stage: "1. Khách truy cập & Quét ATS Free", count: 685, conversion_rate: 100 },
    { stage: "2. Xem Phân tích Bot-Eye & Gap Kỹ Năng", count: 507, conversion_rate: 74 },
    { stage: "3. Mua Micro-Pass 29k/59k Tối Ưu Lề", count: 144, conversion_rate: 21 },
    { stage: "4. Đặt Chuyên Gia Review Chuyên Sâu (8% phí)", count: 41, conversion_rate: 6 },
  ],
  recent_transactions: [
    { id: "TXN-2026-091", user_name: "Nguyễn Văn An", package_name: "Micro-Pass 29k (1-Click ATS Tailor)", amount: 29000, platform_fee: 29000, payment_method: "MoMo QR", status: "SUCCESS", created_at: "16:21 05/10" },
    { id: "TXN-2026-090", user_name: "Trần Thị Mai", package_name: "Expert Review Senior Architect (Escrow)", amount: 350000, platform_fee: 28000, payment_method: "MoMo QR", status: "HELD_IN_ESCROW", created_at: "15:15 05/10" },
    { id: "TXN-2026-089", user_name: "Lê Hoàng Long", package_name: "Micro-Pass 59k (Full 3 Đợt Quét)", amount: 59000, platform_fee: 59000, payment_method: "MoMo QR", status: "SUCCESS", created_at: "13:30 05/10" },
    { id: "TXN-2026-088", user_name: "Đặng Quốc Huy", package_name: "Expert Review Mid Golang (Escrow)", amount: 250000, platform_fee: 20000, payment_method: "MoMo QR", status: "RELEASED", created_at: "11:10 05/10" },
  ],
};

const DEFAULT_BI_EXPORT: BIStarSchemaExportData = {
  schema_version: "belooga-star-v1",
  generated_at: "2026-10-21T06:00:00Z",
  power_bi_m_query_snippet:
    'let\n    Source = Json.Document(Web.Contents("http://localhost:8080/v1/analytics/bi-export?limit=200")),\n    FactATSScans = Table.FromRecords(Source[fact_ats_scans])\nin\n    FactATSScans',
  powerquery_m_script:
    'let\n    Source = Json.Document(Web.Contents("http://localhost:8080/v1/analytics/bi-export?limit=200")),\n    FactATSScans = Table.FromRecords(Source[fact_ats_scans])\nin\n    FactATSScans',
  duckdb_sql_snippet: "SELECT * FROM read_json_auto('http://localhost:8080/v1/analytics/bi-export?limit=200');",
  fact_ats_scans: [],
  fact_review_orders: [],
  fact_job_pipeline: [
    { status: "TARGETING", job_count: 14, avg_match_score: 76.5 },
    { status: "APPLIED", job_count: 9, avg_match_score: 82.0 },
    { status: "INTERVIEW", job_count: 4, avg_match_score: 88.5 },
  ],
  dim_skills_demand: [
    { skill_name: "Golang", jd_demand_count: 18, candidate_supply_count: 7, demand_gap_index: 22.5 },
    { skill_name: "Kubernetes", jd_demand_count: 14, candidate_supply_count: 5, demand_gap_index: 23.33 },
    { skill_name: "PostgreSQL", jd_demand_count: 21, candidate_supply_count: 11, demand_gap_index: 17.5 },
  ],
};

export function useAnalyticsDashboard(timeRange: "7D" | "30D" | "ALL" = "7D") {
  const { data = DEFAULT_ANALYTICS, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics-dashboard", timeRange],
    queryFn: async () => {
      const res = await apiClient.get<AnalyticsData>(`/v1/analytics/dashboard?range=${timeRange}`, { timeout: 3000 });
      return res.data;
    },
    placeholderData: DEFAULT_ANALYTICS,
  });

  const { data: unitEconomics = null } = useQuery<UnitEconomicsData>({
    queryKey: ["analytics-unit-economics"],
    queryFn: async () => {
      const res = await apiClient.get<UnitEconomicsData>("/v1/analytics/unit-economics", { timeout: 3000 });
      return res.data;
    },
  });

  const { data: biExport = DEFAULT_BI_EXPORT } = useQuery<BIStarSchemaExportData>({
    queryKey: ["analytics-bi-export"],
    queryFn: async () => {
      const res = await apiClient.get<BIStarSchemaExportData>("/v1/analytics/bi-export?limit=50", { timeout: 3000 });
      return res.data;
    },
    placeholderData: DEFAULT_BI_EXPORT,
  });

  return { data, unitEconomics, biExport, isLoading, error: null };
}
