import React, { useState } from "react";
import { ActionButton, BadgePill, SurfaceCard } from "@/lib/native-runtime";
import {
  useCandidateAnalyticsQuery,
  useExecutiveBiAnalyticsQuery,
  useExpertAnalyticsQuery,
  useRecruiterAnalyticsQuery,
} from "@/hooks/use-mobile-analytics-360";
import { getSemanticTokens } from "@/theme/tokens";

const RANGES = ["7D", "30D", "ALL"] as const;

export function Analytics360Section() {
  const tokens = getSemanticTokens("dark");
  const [range, setRange] = useState<"7D" | "30D" | "ALL">("30D");

  const candQuery = useCandidateAnalyticsQuery(range);
  const recQuery = useRecruiterAnalyticsQuery();
  const expQuery = useExpertAnalyticsQuery();
  const biQuery = useExecutiveBiAnalyticsQuery(range);

  const cand = candQuery.data ?? {
    range,
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
    application_funnel_conversion: { saved: 26, applied: 18, interviewing: 7, offer: 3 },
    skill_market_gap_radar: [
      { skill_name: "PostgreSQL 16 GIN", candidate_level_pct: 95, market_demand_pct: 92 },
      { skill_name: "React Native 0.88", candidate_level_pct: 91, market_demand_pct: 88 },
    ],
  };

  const rec = recQuery.data ?? {
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

  const exp = expQuery.data ?? {
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

  const bi = biQuery.data ?? {
    total_gmv_usd: 148900,
    momo_conversion_rate: 94.2,
    search_p95_ms: 11.8,
    wallet_topup_volume_vnd: 428500000,
    escrow_locked_volume_vnd: 64200000,
    ai_matcher_revenue_vnd: 38900000,
    recruiter_unlock_revenue_vnd: 27450000,
    community_metrics: { total_posts: 342, total_likes: 4180, active_contributors: 128 },
    skill_supply_demand_heatmap: [
      { skill_name: "Distributed Systems / Go", year: 2024, demand_index: 84, supply_index: 62, median_salary_usd: 4200 },
      { skill_name: "Distributed Systems / Go", year: 2026, demand_index: 96, supply_index: 70, median_salary_usd: 5100 },
    ],
  };

  return (
    <div data-testid="candidate-analytics-page" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SurfaceCard testID="mobile-candidate-analytics-card" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16, color: tokens.typography.heading }}>
            1. Candidate Career &amp; Video Pitch Analytics (/v1/analytics/candidate)
          </h2>
          <div data-testid="candidate-analytics-range" style={{ display: "flex", gap: 6 }}>
            {RANGES.map((r) => (
              <ActionButton
                key={r}
                testID={`mobile-analytics-range-${r}`}
                accessibilityLabel={`mobile-analytics-range-${r}`}
                label={r}
                variant={range === r ? "primary" : "secondary"}
                onPress={() => setRange(r)}
              />
            ))}
          </div>
        </div>
        <div data-testid="candidate-analytics-kpis" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <BadgePill label={`Recruiter Views: ${cand.profile_views} (+${cand.profile_views_growth_pct}%)`} tone="brand" />
          <BadgePill label={`60s Pitch Plays: ${cand.video_pitch_plays} (${cand.avg_pitch_completion_pct}% watched)`} tone="success" />
          <BadgePill label={`Shortlist Bookmarks: ${cand.recruiter_bookmarks_count}`} tone="warning" />
          <BadgePill label={`CV PDF Downloads: ${cand.pdf_downloads_count}`} tone="neutral" />
        </div>
        <div data-testid="candidate-ats-history-chart" style={{ fontSize: 12, color: tokens.typography.body }}>
          ATS Score Growth: {cand.ats_score_history.map((pt) => `${pt.iteration_label}: ${pt.score_pct}%`).join(" -> ")}
        </div>
        <div data-testid="candidate-application-funnel" style={{ fontSize: 12, color: tokens.typography.body }}>
          Application Funnel: Saved ({cand.application_funnel_conversion.saved}) -&gt; Applied ({cand.application_funnel_conversion.applied}) -&gt; Interview ({cand.application_funnel_conversion.interviewing}) -&gt; Offer ({cand.application_funnel_conversion.offer})
        </div>
        <div data-testid="candidate-skill-gap-radar" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cand.skill_market_gap_radar.map((sk) => (
            <BadgePill key={sk.skill_name} label={`${sk.skill_name}: You ${sk.candidate_level_pct}% vs Market ${sk.market_demand_pct}%`} tone="neutral" />
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-recruiter-analytics-card" mode="dark">
        <div data-testid="recruiter-analytics-panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: tokens.typography.heading }}>
            2. Recruiter &amp; Company Hiring Funnel (/v1/analytics/recruiter)
          </h2>
          <div data-testid="recruiter-analytics-funnel" style={{ fontSize: 12, color: tokens.typography.body }}>
            Views ({rec.job_views}) -&gt; Shortlist ({rec.shortlisted_count}) -&gt; Pitch Reviewed ({rec.pitch_reviewed_count}) -&gt; Invite ({rec.interview_invited_count}) -&gt; Offer ({rec.offer_sent_count}) -&gt; Hired ({rec.hired_count})
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <BadgePill label={`Avg Time-to-Hire: ${rec.avg_time_to_hire_days}d`} tone="brand" />
            <BadgePill label={`Invite Acceptance: ${rec.invite_acceptance_rate_pct}%`} tone="success" />
            <BadgePill label={`Avg Candidate ATS: ${rec.avg_candidate_ats_score}%`} tone="neutral" />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-expert-analytics-card" mode="dark">
        <div data-testid="expert-analytics-panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: tokens.typography.heading }}>
            3. Expert Reviewer Earnings &amp; SLA Analytics (/v1/analytics/expert)
          </h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <BadgePill label={`Earned: ${(exp.total_earned_vnd / 1000).toFixed(0)}k VND`} tone="success" />
            <BadgePill label={`Escrow Locked: ${(exp.escrow_locked_vnd / 1000).toFixed(0)}k VND`} tone="warning" />
            <BadgePill label={`+${exp.avg_ats_lift_points} ATS Lift`} tone="brand" />
            <BadgePill label={`SLA: ${exp.sla_compliance_pct}% (${exp.avg_turnaround_hours}h)`} tone="neutral" />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-executive-bi-card" mode="dark">
        <div data-testid="mobile-exec-bi-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: tokens.typography.heading }}>
            4. Executive Revenue, Wallet Cashflow &amp; 2024-2026 Skill Heatmap (/v1/analytics/dashboard)
          </h2>
          <div data-testid="mobile-exec-bi-metrics" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <BadgePill label={`GMV: $${bi.total_gmv_usd}`} tone="brand" />
            <BadgePill label={`MoMo Conv: ${bi.momo_conversion_rate}%`} tone="success" />
            <BadgePill label={`Search P95: ${bi.search_p95_ms}ms`} tone="neutral" />
          </div>
          <div data-testid="admin-wallet-cashflow-panel" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <BadgePill label={`Wallet Top-Up: ${(bi.wallet_topup_volume_vnd / 1000000).toFixed(1)}M VND`} tone="brand" />
            <BadgePill label={`Escrow Volume: ${(bi.escrow_locked_volume_vnd / 1000000).toFixed(1)}M VND`} tone="warning" />
            <BadgePill label={`AI Matcher Rev: ${(bi.ai_matcher_revenue_vnd / 1000000).toFixed(1)}M VND`} tone="success" />
          </div>
          <div data-testid="admin-skill-heatmap-panel" style={{ fontSize: 12, color: tokens.typography.body }}>
            Community: {bi.community_metrics.total_posts} Posts • {bi.community_metrics.total_likes} Likes | Heatmap:{" "}
            {bi.skill_supply_demand_heatmap.map((h) => `${h.skill_name} (${h.year}): $${h.median_salary_usd}`).join(" | ")}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
