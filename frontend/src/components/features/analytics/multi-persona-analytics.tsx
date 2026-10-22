"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Wallet, Award, ArrowUpRight, Flame } from "lucide-react";
import { apiClient } from "@/services/api-client";

export interface CandidateAnalyticsPayload {
  profile_views_count: number;
  search_appearances_count: number;
  recruiter_shortlist_count: number;
  interview_invites_count: number;
  ats_score_history: Array<{ date: string; score: number; target_role: string }>;
  application_funnel: {
    saved_count: number;
    applied_count: number;
    interviewing_count: number;
    offer_count: number;
    rejected_count: number;
    conversion_to_interview_pct: number;
    conversion_to_offer_pct: number;
  };
  skill_gap_radar: Array<{
    skill_name: string;
    candidate_proficiency_pct: number;
    market_demand_pct: number;
    salary_premium_usd: number;
  }>;
}

interface RecruiterAnalyticsPayload {
  open_roles_count: number;
  active_pipeline_candidates: number;
  avg_time_to_shortlist_hours: number;
  interview_acceptance_rate_pct: number;
  stage_funnel: Array<{ stage: string; count: number; conversion_pct: number }>;
}

interface ExpertAnalyticsPayload {
  completed_reviews_count: number;
  avg_rating: number;
  avg_ats_score_lift: number;
  avg_turnaround_hours: number;
  repeat_client_rate_pct: number;
  gross_earnings_vnd: number;
  net_payout_vnd: number;
}

export function CandidateAnalyticsWidget() {
  const { data } = useQuery<CandidateAnalyticsPayload>({
    queryKey: ["candidate-analytics", "30D"],
    queryFn: async () => {
      const res = await apiClient.get<CandidateAnalyticsPayload>("/v1/analytics/candidate", {
        params: { range: "30D" },
      });
      return res.data;
    },
  });

  const latestScore = data?.ats_score_history?.[data.ats_score_history.length - 1]?.score ?? 0;

  return (
    <div data-testid="candidate-analytics-widget" className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <BarChart3 className="w-4 h-4 text-brand-primary" aria-hidden="true" />
        <div>
          <div className="font-bold text-typography-main">Candidate Career & Profile Analytics</div>
          <div className="text-[11px] text-typography-muted">
            {data?.profile_views_count ?? 0} Lượt xem hồ sơ · {data?.recruiter_shortlist_count ?? 0} Recruiter Shortlist · {latestScore}/100 Điểm ATS hiện tại
          </div>
        </div>
      </div>
      <Link href="/workspace/analytics" className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-semibold inline-flex items-center gap-1">
        <span>Mở Career Analytics</span>
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function RecruiterAnalyticsPanel() {
  const { data } = useQuery<RecruiterAnalyticsPayload>({
    queryKey: ["recruiter-analytics"],
    queryFn: async () => {
      const res = await apiClient.get<RecruiterAnalyticsPayload>("/v1/analytics/recruiter");
      return res.data;
    },
  });

  const stageFunnel = data?.stage_funnel ?? [];

  return (
    <section data-testid="recruiter-analytics-panel" className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-primary" aria-hidden="true" />
          <h2 className="font-bold text-sm text-typography-main">Recruiter Hiring Funnel & Velocity Analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2.5 py-0.5 rounded-md bg-surface-page border border-surface-border font-semibold">Open Roles: <strong>{data?.open_roles_count ?? 0}</strong></span>
          <span className="px-2.5 py-0.5 rounded-md bg-surface-page border border-surface-border font-semibold">Time-to-Shortlist: <strong>{data?.avg_time_to_shortlist_hours ?? 0}h</strong></span>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">Interview Acceptance: {data?.interview_acceptance_rate_pct ?? 0}%</span>
        </div>
      </div>
      <div data-testid="recruiter-analytics-funnel" className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {stageFunnel.map((st) => (
          <div key={st.stage} className="p-2.5 rounded-lg bg-surface-page border border-surface-border space-y-1">
            <div className="text-[10px] font-bold text-typography-muted uppercase">{st.stage}</div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-extrabold text-typography-main">{st.count}</span>
              <span className="text-[11px] font-mono font-bold text-brand-primary">{st.conversion_pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.min(100, st.conversion_pct)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExpertAnalyticsPanel() {
  const { data } = useQuery<ExpertAnalyticsPayload>({
    queryKey: ["expert-analytics"],
    queryFn: async () => {
      const res = await apiClient.get<ExpertAnalyticsPayload>("/v1/analytics/expert");
      return res.data;
    },
  });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div data-testid="expert-analytics-panel" className="p-4 rounded-xl bg-surface-page border border-surface-border shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <h2 className="font-bold text-sm text-typography-main">Expert Reviewer Performance & Revenue Analytics</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
            Net Payout: {(data?.net_payout_vnd ?? 0).toLocaleString("vi-VN")}đ · Repeat Client: {data?.repeat_client_rate_pct ?? 0}%
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">Tổng CV Đã Review</div><div className="text-base font-extrabold text-typography-main">{data?.completed_reviews_count ?? 0} CVs</div></div>
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">Avg ATS Score Lift</div><div className="text-base font-extrabold text-emerald-700">+{data?.avg_ats_score_lift ?? 0} pts</div></div>
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">SLA Turnaround</div><div className="text-base font-extrabold text-brand-primary">{data?.avg_turnaround_hours ?? 0}h</div></div>
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">Gross Revenue</div><div className="text-base font-extrabold text-typography-main">{(data?.gross_earnings_vnd ?? 0).toLocaleString("vi-VN")}đ</div></div>
        </div>
      </div>
    </section>
  );
}

export function ExecutiveCashflowAndHeatmapPanels() {
  const { data } = useQuery<{
    wallet_topups_vnd?: number;
    ats_deductions_vnd?: number;
    expert_escrow_float_vnd?: number;
    net_take_rate_pct?: number;
    skill_shortages?: Array<{ skill: string; gap: string; salary: string }>;
  }>({
    queryKey: ["admin-cashflow-heatmap"],
    queryFn: async () => {
      const res = await apiClient.get("/v1/analytics/dashboard");
      return res.data;
    },
  });

  const shortages = data?.skill_shortages ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
      <div data-testid="admin-wallet-cashflow-panel" className="lg:col-span-6 p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Wallet Credit Velocity & Cashflow Breakdown</span>
          </span>
          <span className="font-mono font-bold text-emerald-700">Net Take-Rate: {data?.net_take_rate_pct ?? 0}%</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-surface-page border border-surface-border"><div className="text-[10px] text-typography-muted">Wallet Top-ups</div><div className="font-mono font-bold text-sm text-typography-main">{(data?.wallet_topups_vnd ?? 0).toLocaleString("vi-VN")}đ</div></div>
          <div className="p-2.5 rounded-lg bg-surface-page border border-surface-border"><div className="text-[10px] text-typography-muted">AI / ATS Deductions</div><div className="font-mono font-bold text-sm text-brand-primary">{(data?.ats_deductions_vnd ?? 0).toLocaleString("vi-VN")}đ</div></div>
          <div className="p-2.5 rounded-lg bg-surface-page border border-surface-border"><div className="text-[10px] text-typography-muted">Expert Escrow Float</div><div className="font-mono font-bold text-sm text-emerald-700">{(data?.expert_escrow_float_vnd ?? 0).toLocaleString("vi-VN")}đ</div></div>
        </div>
      </div>

      <div data-testid="admin-skill-heatmap-panel" className="lg:col-span-6 p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>Marketplace Skill Supply vs Demand Heatmap</span>
          </span>
          <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {shortages.map((item) => (
            <div key={item.skill} className="p-2.5 rounded-lg bg-surface-page border border-surface-border">
              <div className="font-bold text-typography-main truncate">{item.skill}</div>
              <div className="text-[10px] text-amber-700 font-semibold">{item.gap}</div>
              <div className="font-mono text-[11px] font-bold text-emerald-700">Avg: {item.salary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
