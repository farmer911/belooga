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

export function useAnalyticsDashboard(timeRange: "7D" | "30D" | "ALL" = "7D") {
  const { data: rawData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics-dashboard", timeRange],
    queryFn: async () => {
      const res = await apiClient.get<AnalyticsData>(`/v1/analytics/dashboard?range=${timeRange}`);
      return res.data;
    },
  });

  const { data: unitEconomics = null } = useQuery<UnitEconomicsData>({
    queryKey: ["analytics-unit-economics"],
    queryFn: async () => {
      const res = await apiClient.get<UnitEconomicsData>("/v1/analytics/unit-economics");
      return res.data;
    },
  });

  const { data: rawBiExport } = useQuery<BIStarSchemaExportData>({
    queryKey: ["analytics-bi-export"],
    queryFn: async () => {
      const res = await apiClient.get<BIStarSchemaExportData>("/v1/analytics/bi-export?limit=50");
      return res.data;
    },
  });

  const data: AnalyticsData = rawData ?? {
    overview: {
      total_users: 0,
      total_scans: 0,
      active_job_trackers: 0,
      total_gmv: 0,
      platform_net_revenue: 0,
      escrow_float: 0,
      monthly_infra_cost: 0,
      net_profit: 0,
      net_margin_percent: 0,
    },
    revenue_chart: [],
    funnel: [],
    recent_transactions: [],
  };

  const biExport: BIStarSchemaExportData = rawBiExport ?? {
    schema_version: "belooga-star-v1",
    generated_at: "",
    power_bi_m_query_snippet: 'let Source = Json.Document(Web.Contents("http://localhost:8080/v1/analytics/bi-export")) in Source',
    duckdb_sql_snippet: "SELECT * FROM read_json_auto('http://localhost:8080/v1/analytics/bi-export');",
    fact_ats_scans: [],
    fact_review_orders: [],
    fact_job_pipeline: [],
    dim_skills_demand: [],
  };

  return { data, unitEconomics, biExport, isLoading, error: null };
}
