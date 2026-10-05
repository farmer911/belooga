"use client";

import React from "react";
import { FunnelStage } from "@/hooks/use-analytics-dashboard";

interface AnalyticsFunnelCardProps {
  funnel: FunnelStage[];
}

export function AnalyticsFunnelCard({ funnel }: AnalyticsFunnelCardProps) {
  return (
    <div className="p-4 rounded bg-slate-900/80 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <span>🎯</span> Phễu Chuyển Đổi Tự Nguyện (PLG Conversion Funnel)
        </h4>
        <span className="text-[10px] text-cyan-400 font-mono">Tỷ lệ trả phí: 27.0%</span>
      </div>

      <div className="space-y-2.5">
        {funnel.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium text-[11px]">{item.stage}</span>
              <span className="font-mono text-cyan-400 text-[11px]">
                {item.count} users ({item.conversion_rate}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                style={{ width: `${item.conversion_rate}%` }}
                className={`h-full transition-all duration-300 rounded-full ${
                  idx === 0
                    ? "bg-blue-500"
                    : idx === 1
                    ? "bg-cyan-500"
                    : idx === 2
                    ? "bg-emerald-500"
                    : "bg-purple-500"
                }`}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
        💡 <strong>Chiến lược "Aha-Moment":</strong> Sau khi xem lỗi quét ATS miễn phí, 21% ứng viên chủ động trả 29k để tự động tối ưu form STAR và lề trang, 6% tiếp tục book Chuyên gia chấm bài sâu.
      </div>
    </div>
  );
}
