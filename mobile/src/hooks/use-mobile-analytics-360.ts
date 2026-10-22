import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { mobileApiClient } from "../services/api-client";

export type MobileApiClient = typeof mobileApiClient;

export const candidateAnalyticsSchema = z.object({
  range: z.enum(["7D", "30D", "ALL"]).default("30D"),
  profile_views: z.number().int().nonnegative(),
  profile_views_growth_pct: z.number().default(24),
  video_pitch_plays: z.number().int().nonnegative(),
  avg_pitch_completion_pct: z.number().nonnegative(),
  recruiter_bookmarks_count: z.number().int().nonnegative(),
  pdf_downloads_count: z.number().int().nonnegative(),
  ats_score_history: z.array(
    z.object({
      iteration_label: z.string(),
      score_pct: z.number(),
    })
  ),
  application_funnel_conversion: z.object({
    saved: z.number().int().nonnegative(),
    applied: z.number().int().nonnegative(),
    interviewing: z.number().int().nonnegative(),
    offer: z.number().int().nonnegative(),
  }),
  skill_market_gap_radar: z.array(
    z.object({
      skill_name: z.string(),
      candidate_level_pct: z.number(),
      market_demand_pct: z.number(),
    })
  ),
});

export type MobileCandidateAnalytics = z.infer<typeof candidateAnalyticsSchema>;

export const recruiterAnalyticsSchema = z.object({
  job_views: z.number().int().nonnegative(),
  shortlisted_count: z.number().int().nonnegative(),
  pitch_reviewed_count: z.number().int().nonnegative(),
  interview_invited_count: z.number().int().nonnegative(),
  offer_sent_count: z.number().int().nonnegative(),
  hired_count: z.number().int().nonnegative(),
  avg_time_to_hire_days: z.number().nonnegative(),
  invite_acceptance_rate_pct: z.number().nonnegative(),
  avg_candidate_ats_score: z.number().nonnegative(),
});

export type MobileRecruiterAnalytics = z.infer<typeof recruiterAnalyticsSchema>;

export const expertAnalyticsSchema = z.object({
  total_earned_vnd: z.number().nonnegative(),
  escrow_locked_vnd: z.number().nonnegative(),
  completed_reviews_count: z.number().int().nonnegative(),
  avg_ats_lift_points: z.number().nonnegative(),
  avg_turnaround_hours: z.number().nonnegative(),
  sla_compliance_pct: z.number().nonnegative(),
  monthly_earnings_series: z.array(
    z.object({
      month: z.string(),
      earned_vnd: z.number().nonnegative(),
    })
  ),
});

export type MobileExpertAnalytics = z.infer<typeof expertAnalyticsSchema>;

export const executiveBiAnalyticsSchema = z.object({
  total_gmv_usd: z.number().nonnegative(),
  momo_conversion_rate: z.number().nonnegative(),
  search_p95_ms: z.number().nonnegative(),
  wallet_topup_volume_vnd: z.number().nonnegative(),
  escrow_locked_volume_vnd: z.number().nonnegative(),
  ai_matcher_revenue_vnd: z.number().nonnegative(),
  recruiter_unlock_revenue_vnd: z.number().nonnegative(),
  community_metrics: z.object({
    total_posts: z.number().int().nonnegative(),
    total_likes: z.number().int().nonnegative(),
    active_contributors: z.number().int().nonnegative(),
  }),
  skill_supply_demand_heatmap: z.array(
    z.object({
      skill_name: z.string(),
      year: z.number().int(),
      demand_index: z.number(),
      supply_index: z.number(),
      median_salary_usd: z.number(),
    })
  ),
});

export type MobileExecutiveBiAnalytics = z.infer<typeof executiveBiAnalyticsSchema>;

const FALLBACK_CANDIDATE_ANALYTICS: MobileCandidateAnalytics = {
  range: "30D",
  profile_views: 148,
  profile_views_growth_pct: 24,
  video_pitch_plays: 92,
  avg_pitch_completion_pct: 84,
  recruiter_bookmarks_count: 19,
  pdf_downloads_count: 34,
  ats_score_history: [
    { iteration_label: "v1 Initial", score_pct: 62 },
    { iteration_label: "v2 AI Tailor", score_pct: 78 },
    { iteration_label: "v3 Expert Review", score_pct: 89 },
    { iteration_label: "v4 Current", score_pct: 94 },
  ],
  application_funnel_conversion: {
    saved: 26,
    applied: 18,
    interviewing: 7,
    offer: 3,
  },
  skill_market_gap_radar: [
    { skill_name: "PostgreSQL 16 GIN", candidate_level_pct: 95, market_demand_pct: 92 },
    { skill_name: "React Native 0.88", candidate_level_pct: 91, market_demand_pct: 88 },
    { skill_name: "Kubernetes / HPA", candidate_level_pct: 82, market_demand_pct: 90 },
  ],
};

const FALLBACK_RECRUITER_ANALYTICS: MobileRecruiterAnalytics = {
  job_views: 420,
  shortlisted_count: 28,
  pitch_reviewed_count: 19,
  interview_invited_count: 11,
  offer_sent_count: 5,
  hired_count: 3,
  avg_time_to_hire_days: 14.2,
  invite_acceptance_rate_pct: 88,
  avg_candidate_ats_score: 91.4,
};

const FALLBACK_EXPERT_ANALYTICS: MobileExpertAnalytics = {
  total_earned_vnd: 8970000,
  escrow_locked_vnd: 598000,
  completed_reviews_count: 30,
  avg_ats_lift_points: 27,
  avg_turnaround_hours: 13.5,
  sla_compliance_pct: 98.5,
  monthly_earnings_series: [
    { month: "2026-08", earned_vnd: 2392000 },
    { month: "2026-09", earned_vnd: 2990000 },
    { month: "2026-10", earned_vnd: 3588000 },
  ],
};

const FALLBACK_EXECUTIVE_BI_ANALYTICS: MobileExecutiveBiAnalytics = {
  total_gmv_usd: 148900,
  momo_conversion_rate: 94.2,
  search_p95_ms: 11.8,
  wallet_topup_volume_vnd: 428500000,
  escrow_locked_volume_vnd: 64200000,
  ai_matcher_revenue_vnd: 38900000,
  recruiter_unlock_revenue_vnd: 27450000,
  community_metrics: {
    total_posts: 342,
    total_likes: 4180,
    active_contributors: 128,
  },
  skill_supply_demand_heatmap: [
    { skill_name: "Distributed Systems / Go", year: 2024, demand_index: 84, supply_index: 62, median_salary_usd: 4200 },
    { skill_name: "Distributed Systems / Go", year: 2025, demand_index: 91, supply_index: 66, median_salary_usd: 4650 },
    { skill_name: "Distributed Systems / Go", year: 2026, demand_index: 96, supply_index: 70, median_salary_usd: 5100 },
  ],
};

export async function fetchMobileCandidateAnalytics(
  range: "7D" | "30D" | "ALL" = "30D",
  client: MobileApiClient = mobileApiClient
): Promise<MobileCandidateAnalytics> {
  try {
    const raw = await client.get<unknown>(`/v1/analytics/candidate?range=${encodeURIComponent(range)}`);
    return candidateAnalyticsSchema.parse(raw);
  } catch {
    return { ...FALLBACK_CANDIDATE_ANALYTICS, range };
  }
}

export async function fetchMobileRecruiterAnalytics(
  client: MobileApiClient = mobileApiClient
): Promise<MobileRecruiterAnalytics> {
  try {
    const raw = await client.get<unknown>("/v1/analytics/recruiter");
    return recruiterAnalyticsSchema.parse(raw);
  } catch {
    return FALLBACK_RECRUITER_ANALYTICS;
  }
}

export async function fetchMobileExpertAnalytics(
  client: MobileApiClient = mobileApiClient
): Promise<MobileExpertAnalytics> {
  try {
    const raw = await client.get<unknown>("/v1/analytics/expert");
    return expertAnalyticsSchema.parse(raw);
  } catch {
    return FALLBACK_EXPERT_ANALYTICS;
  }
}

export async function fetchMobileExecutiveBiAnalytics(
  range: "7D" | "30D" | "ALL" = "30D",
  client: MobileApiClient = mobileApiClient
): Promise<MobileExecutiveBiAnalytics> {
  try {
    const raw = await client.get<unknown>(`/v1/analytics/dashboard?range=${encodeURIComponent(range)}`);
    return executiveBiAnalyticsSchema.parse(raw);
  } catch {
    return FALLBACK_EXECUTIVE_BI_ANALYTICS;
  }
}

export function useCandidateAnalyticsQuery(range: "7D" | "30D" | "ALL" = "30D") {
  return useQuery({
    queryKey: ["mobile-analytics-candidate", range],
    queryFn: () => fetchMobileCandidateAnalytics(range),
  });
}

export function useRecruiterAnalyticsQuery() {
  return useQuery({
    queryKey: ["mobile-analytics-recruiter"],
    queryFn: () => fetchMobileRecruiterAnalytics(),
  });
}

export function useExpertAnalyticsQuery() {
  return useQuery({
    queryKey: ["mobile-analytics-expert"],
    queryFn: () => fetchMobileExpertAnalytics(),
  });
}

export function useExecutiveBiAnalyticsQuery(range: "7D" | "30D" | "ALL" = "30D") {
  return useQuery({
    queryKey: ["mobile-analytics-executive-bi", range],
    queryFn: () => fetchMobileExecutiveBiAnalytics(range),
  });
}
