"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SalaryPercentileCardProps {
  techStack: string;
  level: string;
  location: string;
  p25: number;
  p50: number;
  p75: number;
  sampleSize: number;
  growthRate: string;
  marketDemand: string;
}

export function SalaryPercentileCard({
  techStack,
  level,
  location,
  p25,
  p50,
  p75,
  sampleSize,
  growthRate,
  marketDemand,
}: SalaryPercentileCardProps) {
  const formatMillionVND = (val: number) => {
    return `${(val / 1000000).toFixed(0)} triệu VNĐ`;
  };

  return (
    <div className="p-5 rounded-xl bg-white border border-surface-border space-y-4 shadow-xs">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-divider pb-3.5">
        <div>
          <h3 className="text-base font-bold text-typography-main flex items-center gap-2">
            <span>💵 Dải Lương Thị Trường:</span>
            <span className="text-brand-primary font-mono">
              {techStack} — {level}
            </span>
          </h3>
          <p className="text-xs text-typography-muted mt-0.5">
            Dựa trên phân tích {sampleSize} tin tuyển dụng thực tế tại {location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold">
            Nhu cầu: {marketDemand}
          </Badge>
          <span className="text-[11px] text-brand-dark font-mono bg-teal-50/50 px-2 py-0.5 rounded-md border border-teal-200 font-medium">
            Tăng trưởng: {growthRate} YoY
          </span>
        </div>
      </div>

      {/* 3 Percentile Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* P25 Lower Bound */}
        <div className="p-3.5 rounded-lg bg-surface-page border border-surface-border">
          <div className="text-[10px] text-typography-muted uppercase font-semibold">P25 (Mức Sơ Khởi)</div>
          <div data-testid="salary-p25" className="text-lg font-bold text-typography-heading font-mono mt-1">
            {formatMillionVND(p25)}
          </div>
          <div className="text-[10px] text-typography-muted mt-0.5">25% công ty trả dưới mức này</div>
        </div>

        {/* P50 Median */}
        <div className="p-3.5 rounded-lg bg-teal-50/50 border border-brand-primary/50 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 bg-brand-primary text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
            Trung Vị Thị Trường
          </div>
          <div className="text-[10px] text-brand-dark uppercase font-semibold">P50 (Median)</div>
          <div data-testid="salary-p50" className="text-xl font-bold text-brand-dark font-mono mt-1">
            {formatMillionVND(p50)}
          </div>
          <div className="text-[10px] text-brand-dark/80 mt-0.5">Mức lương phổ biến nhất</div>
        </div>

        {/* P75 Top Tier */}
        <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
          <div className="text-[10px] text-emerald-700 uppercase font-semibold">P75 (Top 25% Công Ty Trả Cao)</div>
          <div data-testid="salary-p75" className="text-lg font-bold text-emerald-800 font-mono mt-1">
            {formatMillionVND(p75)}
          </div>
          <div className="text-[10px] text-typography-muted mt-0.5">Yêu cầu thêm kỹ năng chuyên sâu</div>
        </div>
      </div>

      {/* Visual Range Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-typography-muted font-mono font-medium">
          <span>{formatMillionVND(p25)}</span>
          <span className="text-brand-primary font-bold">{formatMillionVND(p50)}</span>
          <span className="text-emerald-700 font-bold">{formatMillionVND(p75)}</span>
        </div>
        <div className="w-full bg-surface-divider rounded-full h-3 p-0.5 border border-surface-border flex items-center">
          <div className="w-1/4 h-full bg-surface-border rounded-l-full"></div>
          <div className="w-1/2 h-full bg-gradient-to-r from-brand-primary to-emerald-500"></div>
          <div className="w-1/4 h-full bg-emerald-600 rounded-r-full"></div>
        </div>
      </div>

      {/* CTA to match CV with this benchmark */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-page border border-surface-border">
        <div className="text-xs text-typography-heading">
          🎯 <strong className="text-typography-main">Bạn có đang nhận mức lương xứng đáng?</strong> Quét thử CV xem bạn đủ tiêu chuẩn nhận mức lương P75 chưa.
        </div>
        <Link href="/ats-diagnostics">
          <Button className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3.5 h-8 rounded-lg shadow-xs">
            Quét CV So Khớp Ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
