import React, { useState } from "react";
import { View } from "react-native";
import {
  useCandidateAnalyticsQuery,
  useExecutiveBiAnalyticsQuery,
  useExpertAnalyticsQuery,
  useRecruiterAnalyticsQuery,
} from "@/hooks/use-mobile-analytics-360";
import { Body, Button, Card, ErrorText, H2, Pill, Row } from "@/lib/ui";

const RANGES = ["7D", "30D", "ALL"] as const;
const millions = (vnd: number) => `${(vnd / 1_000_000).toFixed(1)}M VND`;

export function Analytics360Section() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("30D");
  const candQuery = useCandidateAnalyticsQuery(range);
  const recQuery = useRecruiterAnalyticsQuery();
  const expQuery = useExpertAnalyticsQuery();
  const biQuery = useExecutiveBiAnalyticsQuery(range);
  const cand = candQuery.data;
  const rec = recQuery.data;
  const exp = expQuery.data;
  const bi = biQuery.data;

  return (
    <View testID="candidate-analytics-page" style={{ gap: 12 }}>
      <Card testID="mobile-candidate-analytics-card">
        <H2>Candidate Career & Pitch Analytics</H2>
        <Row testID="candidate-analytics-range">
          {RANGES.map((r) => (
            <Button key={r} testID={`mobile-analytics-range-${r}`} label={r} variant={range === r ? "primary" : "secondary"} onPress={() => setRange(r)} />
          ))}
        </Row>
        <ErrorText error={candQuery.error} />
        {cand ? (
          <>
            <Row testID="candidate-analytics-kpis">
              <Pill label={`Recruiter Views: ${cand.profile_views} (+${cand.profile_views_growth_pct}%)`} />
              <Pill label={`Pitch Plays: ${cand.video_pitch_plays} (${cand.avg_pitch_completion_pct}% watched)`} tone="success" />
              <Pill label={`Shortlist Bookmarks: ${cand.recruiter_bookmarks_count}`} tone="warning" />
              <Pill label={`CV PDF Downloads: ${cand.pdf_downloads_count}`} tone="neutral" />
            </Row>
            <Body testID="candidate-ats-history-chart">
              ATS Score Growth: {cand.ats_score_history.map((pt) => `${pt.iteration_label}: ${pt.score_pct}%`).join(" → ")}
            </Body>
            <Body testID="candidate-application-funnel">
              Funnel: Saved ({cand.application_funnel_conversion.saved}) → Applied ({cand.application_funnel_conversion.applied}) →
              Interview ({cand.application_funnel_conversion.interviewing}) → Offer ({cand.application_funnel_conversion.offer})
            </Body>
            <Row testID="candidate-skill-gap-radar">
              {cand.skill_market_gap_radar.map((sk) => (
                <Pill key={sk.skill_name} label={`${sk.skill_name}: You ${sk.candidate_level_pct}% vs Market ${sk.market_demand_pct}%`} tone="neutral" />
              ))}
            </Row>
          </>
        ) : null}
      </Card>

      <Card testID="mobile-recruiter-analytics-card">
        <H2>Recruiter Hiring Funnel</H2>
        <ErrorText error={recQuery.error} />
        {rec ? (
          <>
            <Body testID="recruiter-analytics-funnel">
              Views ({rec.job_views}) → Shortlist ({rec.shortlisted_count}) → Pitch Reviewed ({rec.pitch_reviewed_count}) → Invite (
              {rec.interview_invited_count}) → Offer ({rec.offer_sent_count}) → Hired ({rec.hired_count})
            </Body>
            <Row>
              <Pill label={`Avg Time-to-Hire: ${rec.avg_time_to_hire_days}d`} />
              <Pill label={`Invite Acceptance: ${rec.invite_acceptance_rate_pct}%`} tone="success" />
              <Pill label={`Avg Candidate ATS: ${rec.avg_candidate_ats_score}%`} tone="neutral" />
            </Row>
          </>
        ) : null}
      </Card>

      <Card testID="mobile-expert-analytics-card">
        <H2>Expert Earnings & SLA</H2>
        <ErrorText error={expQuery.error} />
        {exp ? (
          <Row>
            <Pill label={`Earned: ${Math.round(exp.total_earned_vnd / 1000)}k VND`} tone="success" />
            <Pill label={`Escrow Locked: ${Math.round(exp.escrow_locked_vnd / 1000)}k VND`} tone="warning" />
            <Pill label={`+${exp.avg_ats_lift_points} ATS Lift`} />
            <Pill label={`SLA: ${exp.sla_compliance_pct}% (${exp.avg_turnaround_hours}h)`} tone="neutral" />
          </Row>
        ) : null}
      </Card>

      <Card testID="mobile-executive-bi-card">
        <H2>Executive Revenue & Skill Heatmap</H2>
        <ErrorText error={biQuery.error} />
        {bi ? (
          <>
            <Row testID="mobile-exec-bi-metrics">
              <Pill label={`GMV: $${bi.total_gmv_usd}`} />
              <Pill label={`MoMo Conv: ${bi.momo_conversion_rate}%`} tone="success" />
              <Pill label={`Search P95: ${bi.search_p95_ms}ms`} tone="neutral" />
            </Row>
            <Row testID="admin-wallet-cashflow-panel">
              <Pill label={`Wallet Top-Up: ${millions(bi.wallet_topup_volume_vnd)}`} />
              <Pill label={`Escrow Volume: ${millions(bi.escrow_locked_volume_vnd)}`} tone="warning" />
              <Pill label={`AI Matcher Rev: ${millions(bi.ai_matcher_revenue_vnd)}`} tone="success" />
            </Row>
            <Body testID="admin-skill-heatmap-panel">
              Community: {bi.community_metrics.total_posts} posts • {bi.community_metrics.total_likes} likes | Heatmap:{" "}
              {bi.skill_supply_demand_heatmap.map((h) => `${h.skill_name} (${h.year}): $${h.median_salary_usd}`).join(" | ")}
            </Body>
          </>
        ) : null}
      </Card>
    </View>
  );
}
