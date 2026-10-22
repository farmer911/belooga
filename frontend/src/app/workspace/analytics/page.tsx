"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Search, BookmarkCheck, CalendarCheck2, Sparkles, Target, Briefcase } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { CandidateAnalyticsPayload } from "@/components/features/analytics/multi-persona-analytics";

export default function CandidateCareerAnalyticsPage() {
  const [range, setRange] = useState<"7D" | "30D" | "ALL">("30D");

  const { data } = useQuery<CandidateAnalyticsPayload>({
    queryKey: ["candidate-analytics", range],
    queryFn: async () => {
      const res = await apiClient.get<CandidateAnalyticsPayload>("/v1/analytics/candidate", {
        params: { range },
      });
      return res.data;
    },
  });

  const funnel = data?.application_funnel ?? {
    saved_count: 0,
    applied_count: 0,
    interviewing_count: 0,
    offer_count: 0,
    rejected_count: 0,
    conversion_to_interview_pct: 0,
    conversion_to_offer_pct: 0,
  };
  const atsHistory = data?.ats_score_history ?? [];
  const skillRadar = data?.skill_gap_radar ?? [];

  return (
    <div data-testid="candidate-analytics-page" className="flex-1 bg-surface-page text-typography-main min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 text-xs">
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-primary" aria-hidden="true" />
              <h1 className="text-lg font-bold text-typography-main">
                Candidate Career & Profile Analytics Center
              </h1>
            </div>
            <p className="text-typography-muted">
              Đo lường lượt nhà tuyển dụng xem hồ sơ, tiến trình điểm ATS, phễu ứng tuyển và khoảng cách kỹ năng thị trường.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-surface-page border border-surface-border rounded-lg p-0.5">
              {(["7D", "30D", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  data-testid={`candidate-range-${r}`}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                    range === r ? "bg-brand-primary text-white" : "text-typography-muted hover:text-typography-main"
                  }`}
                >
                  {r === "7D" ? "7 Ngày" : r === "30D" ? "30 Ngày" : "Tất Cả"}
                </button>
              ))}
            </div>

            <Link href="/ats-diagnostics">
              <Button className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg gap-1">
                <Target className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Chẩn Đoán ATS</span>
              </Button>
            </Link>
            <Link href="/workspace/jobs">
              <Button variant="outline" className="text-xs h-8 px-3 rounded-lg gap-1">
                <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Job Tracker</span>
              </Button>
            </Link>
          </div>
        </div>

        <div data-testid="candidate-analytics-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-typography-muted">
              <span>Lượt Xem Hồ Sơ</span>
              <Eye className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            </div>
            <div className="text-2xl font-extrabold text-typography-main">{data?.profile_views_count ?? 0}</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Theo dõi thời gian thực</div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-typography-muted">
              <span>Hiển Thị Trong Tìm Kiếm</span>
              <Search className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            </div>
            <div className="text-2xl font-extrabold text-typography-main">{data?.search_appearances_count ?? 0}</div>
            <div className="text-[11px] text-typography-muted">Từ chỉ mục PostgreSQL TSVECTOR</div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-typography-muted">
              <span>Recruiter Shortlisted</span>
              <BookmarkCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">{data?.recruiter_shortlist_count ?? 0}</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Lưu trong B2B Pipeline</div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-typography-muted">
              <span>Lời Mời Phỏng Vấn</span>
              <CalendarCheck2 className="w-4 h-4 text-amber-500" aria-hidden="true" />
            </div>
            <div className="text-2xl font-extrabold text-typography-main">{data?.interview_invites_count ?? 0}</div>
            <div className="text-[11px] text-brand-primary font-semibold">Conversion: {funnel.conversion_to_interview_pct}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div
            data-testid="candidate-ats-history-chart"
            className="lg:col-span-7 p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-typography-main">Lịch Sử Tăng Trưởng Điểm ATS (CV Progression)</h2>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-2">
              {atsHistory.map((pt) => (
                <div key={pt.date} className="p-3 rounded-lg bg-surface-page border border-surface-border space-y-2">
                  <div className="text-[11px] text-typography-muted font-semibold">{pt.date}</div>
                  <div className="h-24 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-brand-primary transition-all"
                      style={{ height: `${Math.min(100, pt.score)}%` }}
                    />
                  </div>
                  <div className="font-mono text-sm font-extrabold text-typography-main">{pt.score}/100</div>
                  <div className="text-[10px] text-typography-muted truncate">{pt.target_role}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            data-testid="candidate-application-funnel"
            className="lg:col-span-5 p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-typography-main">Phễu Chuyển Đổi Ứng Tuyển (Job Funnel)</h2>
              <span className="font-mono font-bold text-brand-primary">
                Offer Rate: {funnel.conversion_to_offer_pct}%
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Đã Lưu (Saved)", count: funnel.saved_count, pct: 100 },
                { label: "Đã Ứng Tuyển (Applied)", count: funnel.applied_count, pct: 75 },
                { label: "Phỏng Vấn (Interviewing)", count: funnel.interviewing_count, pct: 39 },
                { label: "Nhận Offer (Offered)", count: funnel.offer_count, pct: 17 },
              ].map((step) => (
                <div key={step.label} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{step.label}</span>
                    <span className="font-mono">{step.count} jobs</span>
                  </div>
                  <div className="w-full h-2 bg-surface-page border border-surface-border rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full" style={{ width: `${step.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          data-testid="candidate-skill-gap-radar"
          className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-typography-main flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <span>Ma Trận Kỹ Năng Ứng Viên vs Nhu Cầu Thị Trường (Skill-to-Salary Radar)</span>
            </h2>
            <Link href="/salary-benchmark" className="text-brand-primary font-semibold underline">
              Xem Định Giá Lương Chi Tiết
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {skillRadar.map((sk) => (
              <div key={sk.skill_name} className="p-3.5 rounded-xl bg-surface-page border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-typography-main">{sk.skill_name}</span>
                  <span className="font-mono font-bold text-emerald-700">+${sk.salary_premium_usd}/mo</span>
                </div>
                <div className="text-[11px] text-typography-muted">
                  Năng lực CV: <strong className="text-typography-main">{sk.candidate_proficiency_pct}%</strong> · Thị trường:{" "}
                  <strong className="text-brand-primary">{sk.market_demand_pct}%</strong>
                </div>
                <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${sk.candidate_proficiency_pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
