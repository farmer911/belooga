"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useAnalyticsDashboard } from "@/hooks/use-analytics-dashboard";
import { AnalyticsKpiCards } from "@/components/features/analytics/analytics-kpi-cards";
import { AnalyticsRevenueChart } from "@/components/features/analytics/analytics-revenue-chart";
import { AnalyticsFunnelCard } from "@/components/features/analytics/analytics-funnel-card";
import { AnalyticsTransactionsTable } from "@/components/features/analytics/analytics-transactions-table";

export default function AnalyticsDashboardPage() {
  const { data, isLoading } = useAnalyticsDashboard();
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "ALL">("7D");

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
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-page border border-surface-border rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setTimeRange("7D")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                timeRange === "7D" ? "bg-brand-primary text-white font-semibold shadow-xs" : "text-typography-muted hover:text-typography-main"
              }`}
            >
              7 Ngày
            </button>
            <button
              onClick={() => setTimeRange("30D")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                timeRange === "30D" ? "bg-brand-primary text-white font-semibold shadow-xs" : "text-typography-muted hover:text-typography-main"
              }`}
            >
              30 Ngày
            </button>
            <button
              onClick={() => setTimeRange("ALL")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                timeRange === "ALL" ? "bg-brand-primary text-white font-semibold shadow-xs" : "text-typography-muted hover:text-typography-main"
              }`}
            >
              Tất Cả
            </button>
          </div>

          <Link href="/workspace/jobs">
            <Button className="bg-surface-card hover:bg-surface-page text-typography-heading hover:text-typography-main border border-surface-border text-xs px-2.5 h-7 rounded-lg shadow-xs">
              💼 Kanban Jobs
            </Button>
          </Link>
          <Link href="/ats-diagnostics">
            <Button className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3 h-7 rounded-lg shadow-xs">
              🎯 Quét ATS
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
            {/* Top KPI Metrics Row */}
            <AnalyticsKpiCards overview={data.overview} />

            {/* Middle Grid: Revenue Charts & PLG Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7">
                <AnalyticsRevenueChart data={data.revenue_chart} />
              </div>
              <div className="lg:col-span-5">
                <AnalyticsFunnelCard funnel={data.funnel} />
              </div>
            </div>

            {/* Bottom Row: Transactions Ledger */}
            <AnalyticsTransactionsTable transactions={data.recent_transactions} />
          </>
        )}
      </main>

      {/* Terminal Status Bar */}
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
