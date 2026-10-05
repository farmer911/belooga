"use client";

import React from "react";
import { OverviewMetrics } from "@/hooks/use-analytics-dashboard";

interface AnalyticsKpiCardsProps {
  overview: OverviewMetrics;
}

export function AnalyticsKpiCards({ overview }: AnalyticsKpiCardsProps) {
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
      {/* Total GMV */}
      <div className="p-3 rounded bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Tổng GMV Giao Dịch</span>
          <span className="text-cyan-400">💵</span>
        </div>
        <div data-testid="kpi-gmv" className="text-base font-bold text-slate-100 font-mono mt-1">
          {formatVND(overview.total_gmv)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Bao gồm Escrow & Micro-Pass</div>
      </div>

      {/* Net Platform Revenue */}
      <div className="p-3 rounded bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Doanh Thu Ròng Sàn</span>
          <span className="text-emerald-400">📈</span>
        </div>
        <div data-testid="kpi-net-rev" className="text-base font-bold text-emerald-400 font-mono mt-1">
          {formatVND(overview.platform_net_revenue)}
        </div>
        <div className="text-[10px] text-emerald-500/80 mt-0.5">Micro-Pass + 8% Take-Rate</div>
      </div>

      {/* Escrow Float */}
      <div className="p-3 rounded bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Quỹ Tạm Giữ Escrow</span>
          <span className="text-amber-400">🔒</span>
        </div>
        <div data-testid="kpi-escrow" className="text-base font-bold text-amber-300 font-mono mt-1">
          {formatVND(overview.escrow_float)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Tiền chờ nghiệm thu CV</div>
      </div>

      {/* Monthly Infra Burn */}
      <div className="p-3 rounded bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Chi Phí Hạ Tầng (COGS)</span>
          <span className="text-rose-400">⚡</span>
        </div>
        <div data-testid="kpi-infra" className="text-base font-bold text-rose-400 font-mono mt-1">
          {formatVND(overview.monthly_infra_cost)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">VPS + Cloudflare + AI Flash (~$15)</div>
      </div>

      {/* Net Profit & Margin */}
      <div className="p-3 rounded bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Lợi Nhuận Ròng (EBITDA)</span>
          <span className="text-cyan-300">💎</span>
        </div>
        <div data-testid="kpi-profit" className="text-base font-bold text-cyan-300 font-mono mt-1">
          {formatVND(overview.net_profit)}
        </div>
        <div className="text-[10px] text-cyan-500/80 mt-0.5">Tỷ suất lợi nhuận: {overview.net_margin_percent}%</div>
      </div>

      {/* Active Users Progress to 500 */}
      <div className="p-3 rounded bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Mục Tiêu 500 MAU</span>
          <span className="text-purple-400">🎯</span>
        </div>
        <div data-testid="kpi-users" className="text-base font-bold text-purple-300 font-mono mt-1">
          {overview.total_users} / 500
        </div>
        <div className="text-[10px] text-purple-400 mt-0.5">
          Đạt {Math.round((overview.total_users / 500) * 100)}% kế hoạch Horizon 1
        </div>
      </div>
    </div>
  );
}
