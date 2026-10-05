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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* Total GMV */}
      <div className="p-3.5 rounded-xl bg-white border border-surface-border flex flex-col justify-between shadow-xs">
        <div className="text-[10px] text-typography-muted uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Tổng GMV Giao Dịch</span>
          <span>💵</span>
        </div>
        <div data-testid="kpi-gmv" className="text-base font-bold text-typography-main font-mono mt-1">
          {formatVND(overview.total_gmv)}
        </div>
        <div className="text-[10px] text-typography-muted mt-0.5">Bao gồm Escrow & Micro-Pass</div>
      </div>

      {/* Net Platform Revenue */}
      <div className="p-3.5 rounded-xl bg-white border border-surface-border flex flex-col justify-between shadow-xs">
        <div className="text-[10px] text-typography-muted uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Doanh Thu Ròng Sàn</span>
          <span>📈</span>
        </div>
        <div data-testid="kpi-net-rev" className="text-base font-bold text-emerald-700 font-mono mt-1">
          {formatVND(overview.platform_net_revenue)}
        </div>
        <div className="text-[10px] text-emerald-700 mt-0.5">Micro-Pass + 8% Take-Rate</div>
      </div>

      {/* Escrow Float */}
      <div className="p-3.5 rounded-xl bg-white border border-surface-border flex flex-col justify-between shadow-xs">
        <div className="text-[10px] text-typography-muted uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Quỹ Tạm Giữ Escrow</span>
          <span>🔒</span>
        </div>
        <div data-testid="kpi-escrow" className="text-base font-bold text-amber-700 font-mono mt-1">
          {formatVND(overview.escrow_float)}
        </div>
        <div className="text-[10px] text-typography-muted mt-0.5">Tiền chờ nghiệm thu CV</div>
      </div>

      {/* Monthly Infra Burn */}
      <div className="p-3.5 rounded-xl bg-white border border-surface-border flex flex-col justify-between shadow-xs">
        <div className="text-[10px] text-typography-muted uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Chi Phí Hạ Tầng (COGS)</span>
          <span>⚡</span>
        </div>
        <div data-testid="kpi-infra" className="text-base font-bold text-rose-700 font-mono mt-1">
          {formatVND(overview.monthly_infra_cost)}
        </div>
        <div className="text-[10px] text-typography-muted mt-0.5">VPS + Cloudflare + AI (~$15)</div>
      </div>

      {/* Net Profit & Margin */}
      <div className="p-3.5 rounded-xl bg-white border border-surface-border flex flex-col justify-between shadow-xs">
        <div className="text-[10px] text-typography-muted uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Lợi Nhuận Ròng (EBITDA)</span>
          <span>💎</span>
        </div>
        <div data-testid="kpi-profit" className="text-base font-bold text-brand-dark font-mono mt-1">
          {formatVND(overview.net_profit)}
        </div>
        <div className="text-[10px] text-brand-primary mt-0.5">Tỷ suất: {overview.net_margin_percent}%</div>
      </div>

      {/* Active Users Progress to 500 */}
      <div className="p-3.5 rounded-xl bg-white border border-surface-border flex flex-col justify-between shadow-xs">
        <div className="text-[10px] text-typography-muted uppercase font-semibold tracking-wider flex items-center justify-between">
          <span>Mục Tiêu 500 MAU</span>
          <span>🎯</span>
        </div>
        <div data-testid="kpi-users" className="text-base font-bold text-purple-700 font-mono mt-1">
          {overview.total_users} / 500
        </div>
        <div className="text-[10px] text-purple-700 mt-0.5">
          Đạt {Math.round((overview.total_users / 500) * 100)}% Horizon 1
        </div>
      </div>
    </div>
  );
}
