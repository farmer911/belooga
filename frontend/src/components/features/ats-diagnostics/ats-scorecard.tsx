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
    if (score >= 80) return "text-emerald-700 border-emerald-400 bg-emerald-50";
    if (score >= 60) return "text-amber-700 border-amber-400 bg-amber-50";
    return "text-rose-700 border-rose-400 bg-rose-50";
  };

  return (
    <div className="border border-surface-border rounded-xl bg-white p-4 space-y-4 shadow-xs">
      {/* Score Header */}
      <div className="flex items-center justify-between border-b border-surface-divider pb-3.5">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-typography-muted font-semibold">
            ATS COMPATIBILITY SCORE
          </div>
          <div className="text-xs text-typography-heading mt-0.5">
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
          <span className="text-[9px] font-normal text-typography-muted -mt-1">/100</span>
        </div>
      </div>

      {/* Sub-Score Breakdown */}
      <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
        <div className="p-2.5 bg-surface-page rounded-lg border border-surface-border">
          <div className="text-[10px] text-typography-muted font-medium">Kỹ Năng Cứng</div>
          <div className="font-bold text-brand-primary text-sm">
            {result.breakdown?.hard_skills_score ?? 0}/60
          </div>
        </div>
        <div className="p-2.5 bg-surface-page rounded-lg border border-surface-border">
          <div className="text-[10px] text-typography-muted font-medium">Số Liệu STAR</div>
          <div className="font-bold text-amber-700 text-sm">
            {result.breakdown?.impact_score ?? 0}/25
          </div>
        </div>
        <div className="p-2.5 bg-surface-page rounded-lg border border-surface-border">
          <div className="text-[10px] text-typography-muted font-medium">Chuẩn Format</div>
          <div className="font-bold text-emerald-700 text-sm">
            {result.breakdown?.formatting_score ?? 0}/15
          </div>
        </div>
      </div>

      {/* Diagnostic Tabs */}
      <div className="flex border-b border-surface-border text-xs">
        <button
          onClick={() => setActiveTab("skills")}
          className={`px-3 py-2 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "skills"
              ? "border-brand-primary text-brand-primary font-bold"
              : "border-transparent text-typography-muted hover:text-typography-main"
          }`}
        >
          Từ Khóa Thiếu ({result.missing_skills.length})
        </button>
        <button
          onClick={() => setActiveTab("star")}
          className={`px-3 py-2 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "star"
              ? "border-brand-primary text-brand-primary font-bold"
              : "border-transparent text-typography-muted hover:text-typography-main"
          }`}
        >
          STAR Audit ({result.star_analysis.length})
        </button>
        <button
          onClick={() => setActiveTab("warnings")}
          className={`px-3 py-2 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "warnings"
              ? "border-brand-primary text-brand-primary font-bold"
              : "border-transparent text-typography-muted hover:text-typography-main"
          }`}
        >
          Cảnh Báo ({result.parse_warnings.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="text-xs space-y-3 max-h-56 overflow-y-auto pr-1">
        {activeTab === "skills" && (
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-rose-700 mb-1.5 flex items-center gap-1">
                <span>❌ Kỹ năng cốt lõi trong JD nhưng CV chưa có:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missing_skills.length > 0 ? (
                  result.missing_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1 font-medium"
                    >
                      <span>+</span> {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-emerald-700 text-xs font-medium">🎉 Tuyệt vời! Bạn đã bao phủ 100% kỹ năng trong JD.</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-emerald-700 mb-1.5">
                ✓ Kỹ năng đã khớp thành công:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.matched_skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "star" && (
          <div className="space-y-2.5">
            {result.star_analysis.length > 0 ? (
              result.star_analysis.map((item, i) => (
                <div key={i} className="p-2.5 bg-surface-page rounded-lg border border-surface-border space-y-1.5">
                  <div className="text-typography-muted font-mono text-[10px] line-clamp-1 italic">
                    "{item.original_text}"
                  </div>
                  <div className="text-amber-800 text-[11px] font-medium">⚠️ {item.critique}</div>
                  <div className="text-brand-dark text-[11px] bg-teal-50/50 p-2 rounded-md border border-teal-200">
                    💡 Gợi ý STAR: {item.suggested_star_rewrite}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-typography-muted">Các gạch đầu dòng của bạn đều có số liệu định lượng tốt.</div>
            )}
          </div>
        )}

        {activeTab === "warnings" && (
          <div className="space-y-2">
            {result.parse_warnings.length > 0 ? (
              result.parse_warnings.map((warn, i) => (
                <div key={i} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                  ⚠️ {warn}
                </div>
              ))
            ) : (
              <div className="text-emerald-700 text-xs font-medium">
                ✓ Không phát hiện lỗi cấu trúc bảng lồng hay font chữ lạ. Bot ATS đọc tốt.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1-Click Micro-Monetization Trigger */}
      <div className="pt-2 border-t border-surface-divider">
        <div className="p-3 bg-gradient-to-r from-teal-50/50 to-teal-100/40 border border-brand-primary/40 rounded-xl flex items-center justify-between gap-2 shadow-xs">
          <div>
            <div className="text-xs font-bold text-brand-dark">
              Tự động điền từ khóa & Chuẩn hóa STAR?
            </div>
            <div className="text-[10px] text-typography-heading mt-0.5">
              Gói 1-Click Tailor CV • Giá bằng Ly Cà Phê 29,000đ
            </div>
          </div>
          <Button
            data-testid="btn-pay-momo-29k"
            onClick={onPayClick}
            className="bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold px-3.5 h-8 rounded-lg shadow-xs transition-colors"
          >
            Sửa 29k Qua MoMo
          </Button>
        </div>
      </div>
    </div>
  );
}
