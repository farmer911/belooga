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

  const cand = candQuery.data;
  const rec = recQuery.data;
  const exp = expQuery.data;
  const bi = biQuery.data;

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
          {cand ? (
            <>
              <BadgePill label={`Recruiter Views: ${cand.profile_views} (+${cand.profile_views_growth_pct}%)`} tone="brand" />
              <BadgePill label={`60s Pitch Plays: ${cand.video_pitch_plays} (${cand.avg_pitch_completion_pct}% watched)`} tone="success" />
              <BadgePill label={`Shortlist Bookmarks: ${cand.recruiter_bookmarks_count}`} tone="warning" />
              <BadgePill label={`CV PDF Downloads: ${cand.pdf_downloads_count}`} tone="neutral" />
            </>
          ) : (
            <span style={{ fontSize: 12, color: tokens.typography.body }}>Syncing candidate KPIs from /v1/analytics/candidate...</span>
          )}
        </div>
        <div data-testid="candidate-ats-history-chart" style={{ fontSize: 12, color: tokens.typography.body }}>
          {cand ? `ATS Score Growth: ${cand.ats_score_history.map((pt) => `${pt.iteration_label}: ${pt.score_pct}%`).join(" -> ")}` : null}
        </div>
        <div data-testid="candidate-application-funnel" style={{ fontSize: 12, color: tokens.typography.body }}>
          {cand
            ? `Application Funnel: Saved (${cand.application_funnel_conversion.saved}) -> Applied (${cand.application_funnel_conversion.applied}) -> Interview (${cand.application_funnel_conversion.interviewing}) -> Offer (${cand.application_funnel_conversion.offer})`
            : null}
        </div>
        <div data-testid="candidate-skill-gap-radar" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(cand?.skill_market_gap_radar ?? []).map((sk) => (
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
            {rec
              ? `Views (${rec.job_views}) -> Shortlist (${rec.shortlisted_count}) -> Pitch Reviewed (${rec.pitch_reviewed_count}) -> Invite (${rec.interview_invited_count}) -> Offer (${rec.offer_sent_count}) -> Hired (${rec.hired_count})`
              : "Syncing recruiter funnel from /v1/analytics/recruiter..."}
          </div>
          {rec ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <BadgePill label={`Avg Time-to-Hire: ${rec.avg_time_to_hire_days}d`} tone="brand" />
              <BadgePill label={`Invite Acceptance: ${rec.invite_acceptance_rate_pct}%`} tone="success" />
              <BadgePill label={`Avg Candidate ATS: ${rec.avg_candidate_ats_score}%`} tone="neutral" />
            </div>
          ) : null}
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-expert-analytics-card" mode="dark">
        <div data-testid="expert-analytics-panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: tokens.typography.heading }}>
            3. Expert Reviewer Earnings &amp; SLA Analytics (/v1/analytics/expert)
          </h2>
          {exp ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <BadgePill label={`Earned: ${(exp.total_earned_vnd / 1000).toFixed(0)}k VND`} tone="success" />
              <BadgePill label={`Escrow Locked: ${(exp.escrow_locked_vnd / 1000).toFixed(0)}k VND`} tone="warning" />
              <BadgePill label={`+${exp.avg_ats_lift_points} ATS Lift`} tone="brand" />
              <BadgePill label={`SLA: ${exp.sla_compliance_pct}% (${exp.avg_turnaround_hours}h)`} tone="neutral" />
            </div>
          ) : (
            <span style={{ fontSize: 12, color: tokens.typography.body }}>Syncing expert earnings from /v1/analytics/expert...</span>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-executive-bi-card" mode="dark">
        <div data-testid="mobile-exec-bi-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: tokens.typography.heading }}>
            4. Executive Revenue, Wallet Cashflow &amp; 2024-2026 Skill Heatmap (/v1/analytics/dashboard)
          </h2>
          <div data-testid="mobile-exec-bi-metrics" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {bi ? (
              <>
                <BadgePill label={`GMV: $${bi.total_gmv_usd}`} tone="brand" />
                <BadgePill label={`MoMo Conv: ${bi.momo_conversion_rate}%`} tone="success" />
                <BadgePill label={`Search P95: ${bi.search_p95_ms}ms`} tone="neutral" />
              </>
            ) : null}
          </div>
          <div data-testid="admin-wallet-cashflow-panel" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {bi ? (
              <>
                <BadgePill label={`Wallet Top-Up: ${(bi.wallet_topup_volume_vnd / 1000000).toFixed(1)}M VND`} tone="brand" />
                <BadgePill label={`Escrow Volume: ${(bi.escrow_locked_volume_vnd / 1000000).toFixed(1)}M VND`} tone="warning" />
                <BadgePill label={`AI Matcher Rev: ${(bi.ai_matcher_revenue_vnd / 1000000).toFixed(1)}M VND`} tone="success" />
              </>
            ) : null}
          </div>
          <div data-testid="admin-skill-heatmap-panel" style={{ fontSize: 12, color: tokens.typography.body }}>
            {bi
              ? `Community: ${bi.community_metrics.total_posts} Posts • ${bi.community_metrics.total_likes} Likes | Heatmap: ${bi.skill_supply_demand_heatmap.map((h) => `${h.skill_name} (${h.year}): $${h.median_salary_usd}`).join(" | ")}`
              : "Syncing executive BI from /v1/analytics/dashboard..."}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
