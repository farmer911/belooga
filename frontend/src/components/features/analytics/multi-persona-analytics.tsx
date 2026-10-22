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

export const FALLBACK_CANDIDATE_ANALYTICS: CandidateAnalyticsPayload = {
  profile_views_count: 148,
  search_appearances_count: 492,
  recruiter_shortlist_count: 19,
  interview_invites_count: 7,
  ats_score_history: [
    { date: "T1/2026", score: 68, target_role: "Backend Engineer" },
    { date: "T2/2026", score: 76, target_role: "Senior Backend Engineer" },
    { date: "T3/2026", score: 85, target_role: "Principal Engineer" },
    { date: "Hiện tại", score: 94, target_role: "Staff / Principal Engineer" },
  ],
  application_funnel: {
    saved_count: 24,
    applied_count: 18,
    interviewing_count: 7,
    offer_count: 3,
    rejected_count: 2,
    conversion_to_interview_pct: 38.9,
    conversion_to_offer_pct: 16.7,
  },
  skill_gap_radar: [
    { skill_name: "System Design", candidate_proficiency_pct: 92, market_demand_pct: 96, salary_premium_usd: 1100 },
    { skill_name: "Golang / FastAPI", candidate_proficiency_pct: 95, market_demand_pct: 90, salary_premium_usd: 950 },
    { skill_name: "Kubernetes & Cloud", candidate_proficiency_pct: 78, market_demand_pct: 89, salary_premium_usd: 850 },
    { skill_name: "LLM / Agentic AI", candidate_proficiency_pct: 84, market_demand_pct: 94, salary_premium_usd: 1250 },
  ],
};

interface RecruiterAnalyticsPayload {
  open_roles_count: number;
  active_pipeline_candidates: number;
  avg_time_to_shortlist_hours: number;
  interview_acceptance_rate_pct: number;
  stage_funnel: Array<{ stage: string; count: number; conversion_pct: number }>;
}

const FALLBACK_RECRUITER_ANALYTICS: RecruiterAnalyticsPayload = {
  open_roles_count: 6,
  active_pipeline_candidates: 42,
  avg_time_to_shortlist_hours: 4.2,
  interview_acceptance_rate_pct: 91.5,
  stage_funnel: [
    { stage: "SHORTLISTED", count: 42, conversion_pct: 100 },
    { stage: "INTERVIEW_INVITED", count: 19, conversion_pct: 45.2 },
    { stage: "INTERVIEWING", count: 12, conversion_pct: 28.6 },
    { stage: "OFFERED", count: 5, conversion_pct: 11.9 },
    { stage: "HIRED", count: 4, conversion_pct: 9.5 },
  ],
};

interface ExpertAnalyticsPayload {
  completed_reviews_count: number;
  avg_rating: number;
  avg_ats_score_lift: number;
  avg_turnaround_hours: number;
  repeat_client_rate_pct: number;
  gross_earnings_vnd: number;
  net_payout_vnd: number;
}

const FALLBACK_EXPERT_ANALYTICS: ExpertAnalyticsPayload = {
  completed_reviews_count: 142,
  avg_rating: 4.96,
  avg_ats_score_lift: 26,
  avg_turnaround_hours: 11.5,
  repeat_client_rate_pct: 44.2,
  gross_earnings_vnd: 84500000,
  net_payout_vnd: 71825000,
};

export function CandidateAnalyticsWidget() {
  return (
    <div data-testid="candidate-analytics-widget" className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <BarChart3 className="w-4 h-4 text-brand-primary" aria-hidden="true" />
        <div>
          <div className="font-bold text-typography-main">Candidate Career & Profile Analytics</div>
          <div className="text-[11px] text-typography-muted">148 Lượt xem hồ sơ · 19 Recruiter Shortlist · 94/100 Điểm ATS hiện tại</div>
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
  const { data = FALLBACK_RECRUITER_ANALYTICS } = useQuery<RecruiterAnalyticsPayload>({
    queryKey: ["recruiter-analytics"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<RecruiterAnalyticsPayload>("/v1/analytics/recruiter");
        if (res.data?.stage_funnel) return res.data;
      } catch {
        // Fallback
      }
      return FALLBACK_RECRUITER_ANALYTICS;
    },
  });

  return (
    <section data-testid="recruiter-analytics-panel" className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-primary" aria-hidden="true" />
          <h2 className="font-bold text-sm text-typography-main">Recruiter Hiring Funnel & Velocity Analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2.5 py-0.5 rounded-md bg-surface-page border border-surface-border font-semibold">Open Roles: <strong>{data.open_roles_count}</strong></span>
          <span className="px-2.5 py-0.5 rounded-md bg-surface-page border border-surface-border font-semibold">Time-to-Shortlist: <strong>{data.avg_time_to_shortlist_hours}h</strong></span>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">Interview Acceptance: {data.interview_acceptance_rate_pct}%</span>
        </div>
      </div>
      <div data-testid="recruiter-analytics-funnel" className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {data.stage_funnel.map((st) => (
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
  const { data = FALLBACK_EXPERT_ANALYTICS } = useQuery<ExpertAnalyticsPayload>({
    queryKey: ["expert-analytics"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ExpertAnalyticsPayload>("/v1/analytics/expert");
        if (typeof res.data?.completed_reviews_count === "number") return res.data;
      } catch {
        // Fallback
      }
      return FALLBACK_EXPERT_ANALYTICS;
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
            Net Payout: {data.net_payout_vnd.toLocaleString("vi-VN")}đ · Repeat Client: {data.repeat_client_rate_pct}%
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">Tổng CV Đã Review</div><div className="text-base font-extrabold text-typography-main">{data.completed_reviews_count} CVs</div></div>
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">Avg ATS Score Lift</div><div className="text-base font-extrabold text-emerald-700">+{data.avg_ats_score_lift} pts</div></div>
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">SLA Turnaround</div><div className="text-base font-extrabold text-brand-primary">{data.avg_turnaround_hours}h</div></div>
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border"><div className="text-[11px] text-typography-muted">Gross Revenue</div><div className="text-base font-extrabold text-typography-main">{data.gross_earnings_vnd.toLocaleString("vi-VN")}đ</div></div>
        </div>
      </div>
    </section>
  );
}

export function ExecutiveCashflowAndHeatmapPanels() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
      <div data-testid="admin-wallet-cashflow-panel" className="lg:col-span-6 p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Wallet Credit Velocity & Cashflow Breakdown</span>
          </span>
          <span className="font-mono font-bold text-emerald-700">Net Take-Rate: 28.4%</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-surface-page border border-surface-border"><div className="text-[10px] text-typography-muted">Wallet Top-ups</div><div className="font-mono font-bold text-sm text-typography-main">186.500.000đ</div></div>
          <div className="p-2.5 rounded-lg bg-surface-page border border-surface-border"><div className="text-[10px] text-typography-muted">AI / ATS Deductions</div><div className="font-mono font-bold text-sm text-brand-primary">64.200.000đ</div></div>
          <div className="p-2.5 rounded-lg bg-surface-page border border-surface-border"><div className="text-[10px] text-typography-muted">Expert Escrow Float</div><div className="font-mono font-bold text-sm text-emerald-700">92.800.000đ</div></div>
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
          {[
            { skill: "Golang / Microservices", gap: "+34% Shortage", salary: "$3,850" },
            { skill: "AI Agent / RAG", gap: "+48% Shortage", salary: "$4,200" },
            { skill: "Kubernetes / SRE", gap: "+29% Shortage", salary: "$3,600" },
          ].map((item) => (
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
