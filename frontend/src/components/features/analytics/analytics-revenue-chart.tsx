"use client";

import React from "react";
import { RevenueSeriesPoint } from "@/hooks/use-analytics-dashboard";

interface AnalyticsRevenueChartProps {
  data: RevenueSeriesPoint[];
}

export function AnalyticsRevenueChart({ data }: AnalyticsRevenueChartProps) {
  const maxVal = Math.max(...data.map((d) => d.total), 2000000);

  const formatShortVND = (val: number) => {
    return `${(val / 1000).toFixed(0)}k`;
  };

  return (
    <div className="p-5 rounded-xl bg-white border border-surface-border space-y-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-divider pb-3">
        <div>
          <h4 className="font-bold text-typography-main text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <span>📊</span> Diễn Biến Doanh Thu 7 Ngày Gần Nhất
          </h4>
          <p className="text-[11px] text-typography-muted mt-0.5">
            Tách biệt dòng tiền Micro-Pass 29k/59k vs Phí sàn Expert 8%
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-brand-primary"></span>
            <span className="text-typography-heading">Micro-Pass (100% Thu)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></span>
            <span className="text-typography-heading">Phí Sàn Expert (8%)</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart with Zero Dead-Space */}
      <div className="h-44 w-full flex items-end gap-2 sm:gap-4 pt-4 px-2">
        {data.map((item, idx) => {
          const microHeight = (item.micro_pass_rev / maxVal) * 100;
          const expertHeight = (item.expert_fee_rev / maxVal) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-neutral-900 border border-neutral-700 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg pointer-events-none z-10 whitespace-nowrap font-mono">
                Tổng: {item.total.toLocaleString("vi-VN")}đ (Micro: {item.micro_pass_rev.toLocaleString("vi-VN")}đ, Sàn: {item.expert_fee_rev.toLocaleString("vi-VN")}đ)
              </div>

              {/* Stacked Bars */}
              <div className="w-full max-w-[36px] flex flex-col justify-end h-full">
                <div
                  style={{ height: `${expertHeight}%` }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-t-sm transition-all"
                  title={`Phí sàn: ${item.expert_fee_rev}đ`}
                ></div>
                <div
                  style={{ height: `${microHeight}%` }}
                  className="w-full bg-brand-primary hover:bg-brand-hover transition-all border-t border-white"
                  title={`Micro-pass: ${item.micro_pass_rev}đ`}
                ></div>
              </div>

              {/* Day Label */}
              <span className="text-[10px] text-typography-muted font-mono mt-1.5">{item.date}</span>
              <span className="text-[9px] text-brand-primary font-mono font-bold">
                {formatShortVND(item.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
