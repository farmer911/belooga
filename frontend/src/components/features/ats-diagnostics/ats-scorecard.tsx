"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ATSScanResult } from "@/hooks/use-ats-diagnostics";

interface ATSScorecardProps {
  result: ATSScanResult;
  activeTab: "skills" | "star" | "warnings";
  setActiveTab: (tab: "skills" | "star" | "warnings") => void;
  onPayClick?: () => void;
}

export function ATSScorecard({ result, activeTab, setActiveTab, onPayClick }: ATSScorecardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500 bg-emerald-500/10";
    if (score >= 60) return "text-amber-500 border-amber-500 bg-amber-500/10";
    return "text-rose-500 border-rose-500 bg-rose-500/10";
  };

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-3 space-y-3">
      {/* Score Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            ATS COMPATIBILITY SCORE
          </div>
          <div className="text-xs text-slate-400">
            {result.ats_score >= 80
              ? "Khả năng vượt vòng lọc tự động: RẤT CAO"
              : result.ats_score >= 60
              ? "Cần khắc phục các từ khóa thiếu để an toàn"
              : "Nguy cơ cao bị bot ATS loại trước khi tới tay HR"}
          </div>
        </div>

        <div
          className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center font-bold text-lg ${getScoreColor(
            result.ats_score
          )}`}
        >
          {result.ats_score}
          <span className="text-[9px] font-normal text-slate-400 -mt-1">/100</span>
        </div>
      </div>

      {/* Sub-Score Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
          <div className="text-[10px] text-slate-500">Kỹ Năng Cứng</div>
          <div className="font-semibold text-cyan-400">
            {result.breakdown?.hard_skills_score ?? 0}/60
          </div>
        </div>
        <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
          <div className="text-[10px] text-slate-500">Số Liệu STAR</div>
          <div className="font-semibold text-amber-400">
            {result.breakdown?.impact_score ?? 0}/25
          </div>
        </div>
        <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
          <div className="text-[10px] text-slate-500">Chuẩn Format</div>
          <div className="font-semibold text-emerald-400">
            {result.breakdown?.formatting_score ?? 0}/15
          </div>
        </div>
      </div>

      {/* Diagnostic Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab("skills")}
          className={`px-3 py-1.5 font-medium transition border-b-2 ${
            activeTab === "skills"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Từ Khóa Thiếu ({result.missing_skills.length})
        </button>
        <button
          onClick={() => setActiveTab("star")}
          className={`px-3 py-1.5 font-medium transition border-b-2 ${
            activeTab === "star"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          STAR Audit ({result.star_analysis.length})
        </button>
        <button
          onClick={() => setActiveTab("warnings")}
          className={`px-3 py-1.5 font-medium transition border-b-2 ${
            activeTab === "warnings"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Cảnh Báo ({result.parse_warnings.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="text-xs space-y-2 max-h-56 overflow-y-auto pr-1">
        {activeTab === "skills" && (
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-rose-400 mb-1 flex items-center gap-1">
                <span>❌ Kỹ năng cốt lõi trong JD nhưng CV chưa có:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missing_skills.length > 0 ? (
                  result.missing_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1"
                    >
                      <span>+</span> {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-emerald-400 text-xs">🎉 Tuyệt vời! Bạn đã bao phủ 100% kỹ năng trong JD.</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-emerald-400 mb-1">
                ✓ Kỹ năng đã khớp thành công:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.matched_skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "star" && (
          <div className="space-y-2">
            {result.star_analysis.length > 0 ? (
              result.star_analysis.map((item, i) => (
                <div key={i} className="p-2 bg-slate-950/80 rounded border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-mono text-[10px] line-clamp-1">
                    "{item.original_text}"
                  </div>
                  <div className="text-amber-400 text-[11px]">⚠️ {item.critique}</div>
                  <div className="text-cyan-300 text-[11px] bg-cyan-950/40 p-1.5 rounded border border-cyan-800/40">
                    💡 Gợi ý STAR: {item.suggested_star_rewrite}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400">Các gạch đầu dòng của bạn đều có số liệu định lượng tốt.</div>
            )}
          </div>
        )}

        {activeTab === "warnings" && (
          <div className="space-y-2">
            {result.parse_warnings.length > 0 ? (
              result.parse_warnings.map((warn, i) => (
                <div key={i} className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-xs">
                  ⚠️ {warn}
                </div>
              ))
            ) : (
              <div className="text-emerald-400 text-xs">
                ✓ Không phát hiện lỗi cấu trúc bảng lồng hay font chữ lạ. Bot ATS đọc tốt.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1-Click Micro-Monetization Trigger */}
      <div className="pt-2 border-t border-slate-800">
        <div className="p-2.5 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 rounded-lg flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-cyan-300">
              Tự động điền từ khóa & Chuẩn hóa STAR?
            </div>
            <div className="text-[10px] text-slate-400">
              Gói 1-Click Tailor CV • Giá bằng Ly Cà Phê 29,000đ
            </div>
          </div>
          <Button
            data-testid="btn-pay-momo-29k"
            onClick={onPayClick}
            className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 h-7"
          >
            Sửa 29k Qua MoMo
          </Button>
        </div>
      </div>
    </div>
  );
}
