"use client";

import React from "react";
import { FunnelStage } from "@/hooks/use-analytics-dashboard";

interface AnalyticsFunnelCardProps {
  funnel: FunnelStage[];
}

export function AnalyticsFunnelCard({ funnel }: AnalyticsFunnelCardProps) {
  return (
    <div className="p-5 rounded-xl bg-white border border-surface-border space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-surface-divider pb-3">
        <h4 className="font-bold text-typography-main text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <span>🎯</span> Phễu Chuyển Đổi Tự Nguyện (PLG Conversion Funnel)
        </h4>
        <span className="text-[10px] text-brand-dark font-mono font-semibold bg-teal-50/50 px-2 py-0.5 rounded-md border border-teal-200">
          Tỷ lệ trả phí: 27.0%
        </span>
      </div>

      <div className="space-y-3">
        {funnel.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-typography-heading font-medium text-[11px]">{item.stage}</span>
              <span className="font-mono text-brand-primary text-[11px] font-bold">
                {item.count} users ({item.conversion_rate}%)
              </span>
            </div>
            <div className="w-full bg-surface-divider rounded-full h-2 overflow-hidden border border-surface-border">
              <div
                style={{ width: `${item.conversion_rate}%` }}
                className={`h-full transition-all duration-300 rounded-full ${
                  idx === 0
                    ? "bg-blue-500"
                    : idx === 1
                    ? "bg-brand-primary"
                    : idx === 2
                    ? "bg-emerald-600"
                    : "bg-purple-600"
                }`}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-surface-page border border-surface-border text-[11px] text-typography-heading leading-relaxed">
        💡 <strong>Chiến lược "Aha-Moment":</strong> Sau khi xem lỗi quét ATS miễn phí, 21% ứng viên chủ động trả 29k để tự động tối ưu form STAR và lề trang, 6% tiếp tục book Chuyên gia chấm bài sâu.
      </div>
    </div>
  );
}
