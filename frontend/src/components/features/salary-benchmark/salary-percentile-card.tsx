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
    <div className="p-4 rounded bg-slate-900/90 border border-slate-800 space-y-4">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>💵 Dải Lương Thị Trường:</span>
            <span className="text-cyan-400 font-mono">
              {techStack} — {level}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dựa trên phân tích {sampleSize} tin tuyển dụng thực tế tại {location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-800 text-[10px]">
            Nhu cầu: {marketDemand}
          </Badge>
          <span className="text-[11px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            Tăng trưởng: {growthRate} YoY
          </span>
        </div>
      </div>

      {/* 3 Percentile Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* P25 Lower Bound */}
        <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">P25 (Mức Sơ Khởi)</div>
          <div data-testid="salary-p25" className="text-lg font-bold text-slate-300 font-mono mt-1">
            {formatMillionVND(p25)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">25% công ty trả dưới mức này</div>
        </div>

        {/* P50 Median */}
        <div className="p-3 rounded bg-cyan-950/30 border border-cyan-500/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
            Trung Vị Thị Trường
          </div>
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">P50 (Median)</div>
          <div data-testid="salary-p50" className="text-xl font-bold text-cyan-300 font-mono mt-1">
            {formatMillionVND(p50)}
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Mức lương phổ biến nhất</div>
        </div>

        {/* P75 Top Tier */}
        <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-emerald-500/90 uppercase font-semibold">P75 (Top 25% Công Ty Trả Cao)</div>
          <div data-testid="salary-p75" className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {formatMillionVND(p75)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Yêu cầu thêm kỹ năng chuyên sâu</div>
        </div>
      </div>

      {/* Visual Range Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatMillionVND(p25)}</span>
          <span className="text-cyan-400 font-semibold">{formatMillionVND(p50)}</span>
          <span className="text-emerald-400 font-semibold">{formatMillionVND(p75)}</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 flex items-center">
          <div className="w-1/4 h-full bg-slate-700 rounded-l-full"></div>
          <div className="w-1/2 h-full bg-gradient-to-r from-cyan-500 to-emerald-400"></div>
          <div className="w-1/4 h-full bg-emerald-600 rounded-r-full"></div>
        </div>
      </div>

      {/* CTA to match CV with this benchmark */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-slate-950 border border-slate-800">
        <div className="text-xs text-slate-300">
          🎯 <strong>Bạn có đang nhận mức lương xứng đáng?</strong> Quét thử CV xem bạn đủ tiêu chuẩn nhận mức lương P75 chưa.
        </div>
        <Link href="/ats-diagnostics">
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-3 h-8">
            Quét CV So Khớp Ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
