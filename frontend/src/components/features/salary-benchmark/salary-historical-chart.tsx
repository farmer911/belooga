"use client";

import React from "react";
import { Calendar, TrendingUp, ArrowUpRight } from "lucide-react";

export interface HistoricalSalaryPoint {
  period: string;
  year: string;
  p25_salary_vnd: number;
  p50_salary_vnd: number;
  p75_salary_vnd: number;
  yoy_change_pct: string;
  sample_count: number;
}

interface SalaryHistoricalChartProps {
  selectedYear: string;
  onSelectYear: (year: string) => void;
  series: HistoricalSalaryPoint[];
  techStack: string;
  level: string;
  location: string;
}

const YEAR_OPTIONS = [
  { key: "all", label: "Toàn bộ (2024 -> 2026)" },
  { key: "2024", label: "Năm 2024" },
  { key: "2025", label: "Năm 2025" },
  { key: "2026", label: "2026 (Hiện tại)" },
];

function formatMillions(vnd: number): string {
  return `${(vnd / 1_000_000).toFixed(1)}M`;
}

export function SalaryHistoricalChart({
  selectedYear,
  onSelectYear,
  series,
  techStack,
  level,
  location,
}: SalaryHistoricalChartProps) {
  const filteredSeries =
    selectedYear === "all"
      ? series
      : series.filter((pt) => pt.year === selectedYear || pt.period.startsWith(selectedYear));

  const maxP75 = Math.max(...filteredSeries.map((s) => s.p75_salary_vnd), 1);

  return (
    <div
      data-testid="salary-historical-chart"
      className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-sm font-bold text-typography-main">
            <TrendingUp className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Biểu Đồ Xu Hướng Lương Lịch Sử (2024 -&gt; 2026 Hiện Tại)</span>
          </div>
          <p className="text-xs text-typography-muted mt-0.5">
            Chuỗi phân vị P25 / P50 (Median) / P75 cho {level} {techStack} tại {location}
          </p>
        </div>

        <div
          data-testid="salary-year-selector"
          className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-surface-page border border-surface-border"
        >
          {YEAR_OPTIONS.map((opt) => {
            const active = selectedYear === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                data-testid={`salary-year-btn-${opt.key}`}
                onClick={() => onSelectYear(opt.key)}
                className={`min-h-[36px] px-3 py-1 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? "bg-brand-primary text-white font-bold shadow-xs"
                    : "bg-surface-page text-typography-heading border border-surface-border hover:border-brand-primary"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {filteredSeries.map((item) => {
          const p25Pct = Math.max(20, Math.round((item.p25_salary_vnd / maxP75) * 100));
          const p50Pct = Math.max(35, Math.round((item.p50_salary_vnd / maxP75) * 100));
          const p75Pct = Math.max(50, Math.round((item.p75_salary_vnd / maxP75) * 100));

          return (
            <div
              key={item.period}
              data-testid={`salary-history-point-${item.period}`}
              className="p-3 rounded-lg bg-surface-page border border-surface-border flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-typography-main">{item.period}</span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700">
                  <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                  <span>{item.yoy_change_pct}</span>
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-typography-muted">
                    <span>P25</span>
                    <span className="font-mono font-semibold text-typography-heading">{formatMillions(item.p25_salary_vnd)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden">
                    <div className="h-full rounded-full bg-brand-overlay border border-brand-primary/40" style={{ width: `${p25Pct}%` }} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-typography-main font-semibold">
                    <span>P50 Median</span>
                    <span className="font-mono text-brand-primary">{formatMillions(item.p50_salary_vnd)}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-subtle overflow-hidden">
                    <div className="h-full rounded-full bg-brand-primary" style={{ width: `${p50Pct}%` }} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-typography-muted">
                    <span>P75 Top 25%</span>
                    <span className="font-mono font-semibold text-brand-dark">{formatMillions(item.p75_salary_vnd)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden">
                    <div className="h-full rounded-full bg-brand-dark" style={{ width: `${p75Pct}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-1 border-t border-surface-border text-[10px] text-typography-muted flex justify-between">
                <span>Mẫu thu thập:</span>
                <span className="font-mono font-semibold text-typography-heading">{item.sample_count} JD</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
