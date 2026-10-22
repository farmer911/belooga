import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { mobileApiClient } from "../services/api-client";

export type MobileApiClient = typeof mobileApiClient;

export const candidateAnalyticsSchema = z.object({
  range: z.enum(["7D", "30D", "ALL"]).default("30D"),
  profile_views: z.number().int().nonnegative(),
  profile_views_growth_pct: z.number().default(0),
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

export async function fetchMobileCandidateAnalytics(
  range: "7D" | "30D" | "ALL" = "30D",
  client: MobileApiClient = mobileApiClient
): Promise<MobileCandidateAnalytics> {
  const raw = await client.get<unknown>(`/v1/analytics/candidate?range=${encodeURIComponent(range)}`);
  return candidateAnalyticsSchema.parse(raw);
}

export async function fetchMobileRecruiterAnalytics(
  client: MobileApiClient = mobileApiClient
): Promise<MobileRecruiterAnalytics> {
  const raw = await client.get<unknown>("/v1/analytics/recruiter");
  return recruiterAnalyticsSchema.parse(raw);
}

export async function fetchMobileExpertAnalytics(
  client: MobileApiClient = mobileApiClient
): Promise<MobileExpertAnalytics> {
  const raw = await client.get<unknown>("/v1/analytics/expert");
  return expertAnalyticsSchema.parse(raw);
}

export async function fetchMobileExecutiveBiAnalytics(
  range: "7D" | "30D" | "ALL" = "30D",
  client: MobileApiClient = mobileApiClient
): Promise<MobileExecutiveBiAnalytics> {
  const raw = await client.get<unknown>(`/v1/analytics/dashboard?range=${encodeURIComponent(range)}`);
  return executiveBiAnalyticsSchema.parse(raw);
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
