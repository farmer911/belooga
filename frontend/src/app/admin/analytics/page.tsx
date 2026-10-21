"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Briefcase, Check, Code2, Database, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useAnalyticsDashboard } from "@/hooks/use-analytics-dashboard";
import { AnalyticsKpiCards } from "@/components/features/analytics/analytics-kpi-cards";
import { AnalyticsRevenueChart } from "@/components/features/analytics/analytics-revenue-chart";
import { AnalyticsFunnelCard } from "@/components/features/analytics/analytics-funnel-card";
import { AnalyticsTransactionsTable } from "@/components/features/analytics/analytics-transactions-table";

export default function AnalyticsDashboardPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "ALL">("7D");
  const [showBiQuery, setShowBiQuery] = useState(false);
  const { data, unitEconomics, biExport, isLoading } = useAnalyticsDashboard(timeRange);

  return (
    <div className="flex-1 bg-surface-page text-typography-main flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-dark">
      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-surface-border bg-surface-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">Belooga Executive</span>
          <span className="text-surface-border">/</span>
          <span className="text-typography-heading font-medium">Financial Analytics & Monetization Terminal</span>
          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
            Realtime SSOT
          </Badge>
          <Badge variant="outline" className="text-[10px] text-brand-dark border-brand-primary/40 bg-teal-50/50">
            P&L Waterfall
          </Badge>
        </div>

        {/* Time range switcher & shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-surface-page border border-surface-border rounded-lg p-0.5 text-[11px]">
            {(["7D", "30D", "ALL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  timeRange === r ? "bg-brand-primary text-white font-semibold shadow-xs" : "text-typography-muted hover:text-typography-main"
                }`}
              >
                {r === "7D" ? "7 Ngày" : r === "30D" ? "30 Ngày" : "Tất Cả"}
              </button>
            ))}
          </div>

          <Link href="/workspace/jobs">
            <Button className="bg-surface-card hover:bg-surface-page text-typography-heading hover:text-typography-main border border-surface-border text-xs px-2.5 h-7 rounded-lg shadow-xs gap-1">
              <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kanban Jobs</span>
            </Button>
          </Link>
          <Link href="/ats-diagnostics">
            <Button className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3 h-7 rounded-lg shadow-xs gap-1">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Quét ATS</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main High-Density Workspace */}
      <main className="flex-1 p-4 space-y-4 max-w-[1600px] w-full mx-auto overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-brand-primary" />
          </div>
        ) : (
          <>
            <AnalyticsKpiCards overview={data.overview} />

            {/* Unit Economics & Cohort Retention Telemetry Banner */}
            {unitEconomics && (
              <div
                data-testid="unit-economics-banner"
                className="rounded-xl border border-teal-200 bg-teal-50/40 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-teal-900">SaaS Unit Economics:</span>
                  <Badge className="bg-teal-600 text-white border-none text-[11px]">
                    LTV/CAC: {unitEconomics.ltv_to_cac_ratio}x
                  </Badge>
                  <Badge variant="outline" className="bg-white border-teal-200 text-teal-800 text-[11px]">
                    Payback: {unitEconomics.payback_period_days} ngày
                  </Badge>
                  <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700 text-[11px]">
                    Retention D30: {unitEconomics.cohort_retention_d30_pct}% · D90: {unitEconomics.cohort_retention_d90_pct}%
                  </Badge>
                </div>
                <p className="text-[11px] font-medium text-slate-700">
                  {unitEconomics.strategic_growth_insight}
                </p>
              </div>
            )}

            {/* Power BI & DuckDB Star-Schema OLAP Connector */}
            <div
              data-testid="bi-star-schema-panel"
              className="rounded-xl border border-surface-border bg-surface-card p-3.5 space-y-2.5 text-xs shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Database className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                  <span className="font-bold text-typography-heading">
                    Power BI & DuckDB Star-Schema OLAP Feed ({biExport.schema_version})
                  </span>
                  <Badge variant="outline" className="text-[10px] border-surface-border text-typography-muted">
                    ATS Facts: {biExport.fact_ats_scans.length} · Orders: {biExport.fact_review_orders.length}
                  </Badge>
                  {biExport.dim_skills_demand.slice(0, 3).map((sk) => (
                    <Badge key={sk.skill_name} variant="outline" className="text-[10px] border-teal-200 bg-teal-50/40 text-teal-800">
                      {sk.skill_name}: Gap {sk.demand_gap_index} (JD {sk.jd_demand_count} / CV {sk.candidate_supply_count})
                    </Badge>
                  ))}
                </div>
                <Button
                  data-testid="btn-copy-powerbi-m"
                  onClick={() => setShowBiQuery((prev) => !prev)}
                  className="bg-surface-page hover:bg-surface-card text-typography-heading border border-surface-border text-[11px] px-2.5 h-7 rounded-lg gap-1"
                >
                  {showBiQuery ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code2 className="w-3.5 h-3.5" />}
                  <span>{showBiQuery ? "Ẩn PowerQuery M / DuckDB" : "Power BI Web Connector"}</span>
                </Button>
              </div>
              {showBiQuery && (
                <pre
                  data-testid="bi-query-codeblock"
                  className="rounded-lg bg-surface-page border border-surface-border p-2.5 text-[11px] font-mono text-typography-main overflow-x-auto"
                >
                  {`${biExport.power_bi_m_query_snippet}\n\n-- DuckDB Zero-Lock OLAP:\n${biExport.duckdb_sql_snippet}`}
                </pre>
              )}
            </div>

            {/* Middle Grid: Revenue Charts & PLG Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7">
                <AnalyticsRevenueChart data={data.revenue_chart} />
              </div>
              <div className="lg:col-span-5">
                <AnalyticsFunnelCard funnel={data.funnel} />
              </div>
            </div>

            <AnalyticsTransactionsTable transactions={data.recent_transactions} />
          </>
        )}
      </main>

      <footer className="border-t border-surface-border bg-surface-card px-4 py-2 text-[11px] text-typography-muted flex justify-between items-center shadow-xs">
        <div>Hệ thống đo lường tài chính: <strong className="text-typography-main">Belooga Executive Terminal</strong> (MoMo & Escrow Float Engine)</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-700 font-medium">Đồng bộ doanh thu trực tiếp</span>
        </div>
      </footer>
    </div>
  );
}
