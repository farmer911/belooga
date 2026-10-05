"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-400">Belooga Executive</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-medium">Financial Analytics & Monetization Terminal</span>
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800 bg-emerald-950/40">
            Realtime SSOT
          </Badge>
          <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-800">
            P&L Waterfall
          </Badge>
        </div>

        {/* Time range switcher & shortcuts */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setTimeRange("7D")}
              className={`px-2 py-0.5 rounded transition ${
                timeRange === "7D" ? "bg-cyan-500 text-black font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              7 Ngày
            </button>
            <button
              onClick={() => setTimeRange("30D")}
              className={`px-2 py-0.5 rounded transition ${
                timeRange === "30D" ? "bg-cyan-500 text-black font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              30 Ngày
            </button>
            <button
              onClick={() => setTimeRange("ALL")}
              className={`px-2 py-0.5 rounded transition ${
                timeRange === "ALL" ? "bg-cyan-500 text-black font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tất Cả
            </button>
          </div>

          <Link href="/workspace/jobs">
            <Button className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 h-7">
              💼 Kanban Jobs
            </Button>
          </Link>
          <Link href="/ats-diagnostics">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-3 h-7">
              🎯 Quét ATS
            </Button>
          </Link>
        </div>
      </div>

      {/* Main High-Density Workspace */}
      <main className="flex-1 p-4 space-y-4 max-w-[1600px] w-full mx-auto overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-cyan-500" />
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
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] text-slate-500 flex justify-between items-center">
        <div>Hệ thống đo lường tài chính: <strong>Belooga Executive Terminal</strong> (MoMo & Escrow Float Engine)</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-400">Đồng bộ doanh thu trực tiếp</span>
        </div>
      </footer>
    </div>
  );
}
