import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  candidateAnalyticsSchema,
  recruiterAnalyticsSchema,
  expertAnalyticsSchema,
  executiveBiAnalyticsSchema,
  fetchMobileCandidateAnalytics,
  fetchMobileRecruiterAnalytics,
  fetchMobileExpertAnalytics,
  fetchMobileExecutiveBiAnalytics,
} from "../src/hooks/use-mobile-analytics-360";
import { mobileApiClient, setMobileFetchTransportForTesting } from "../src/services/api-client";

describe("BEL-209 (#138): Mobile 360-Degree Analytics Parity", () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it("fetches and validates Candidate Career & Profile Analytics (/v1/analytics/candidate)", async () => {
    const res = await fetchMobileCandidateAnalytics("30D", mobileApiClient);
    const parsed = candidateAnalyticsSchema.parse(res);
    expect(parsed.range).toBe("30D");
    expect(parsed.profile_views).toBeGreaterThan(0);
    expect(parsed.video_pitch_plays).toBeGreaterThan(0);
    expect(parsed.avg_pitch_completion_pct).toBeGreaterThan(0);
    expect(parsed.recruiter_bookmarks_count).toBeGreaterThan(0);
    expect(parsed.pdf_downloads_count).toBeGreaterThan(0);
    expect(parsed.ats_score_history.length).toBeGreaterThan(0);
    expect(parsed.application_funnel_conversion.applied).toBeGreaterThan(0);
    expect(parsed.skill_market_gap_radar.length).toBeGreaterThan(0);
  });

  it("fetches and validates Recruiter Hiring Funnel Analytics (/v1/analytics/recruiter)", async () => {
    const res = await fetchMobileRecruiterAnalytics(mobileApiClient);
    const parsed = recruiterAnalyticsSchema.parse(res);
    expect(parsed.job_views).toBeGreaterThan(0);
    expect(parsed.shortlisted_count).toBeGreaterThan(0);
    expect(parsed.hired_count).toBeGreaterThan(0);
    expect(parsed.avg_time_to_hire_days).toBeGreaterThan(0);
    expect(parsed.invite_acceptance_rate_pct).toBeGreaterThan(0);
    expect(parsed.avg_candidate_ats_score).toBeGreaterThan(0);
  });

  it("fetches and validates Expert Earnings & SLA Analytics (/v1/analytics/expert)", async () => {
    const res = await fetchMobileExpertAnalytics(mobileApiClient);
    const parsed = expertAnalyticsSchema.parse(res);
    expect(parsed.total_earned_vnd).toBeGreaterThan(0);
    expect(parsed.escrow_locked_vnd).toBeGreaterThan(0);
    expect(parsed.avg_ats_lift_points).toBeGreaterThan(0);
    expect(parsed.avg_turnaround_hours).toBeGreaterThan(0);
    expect(parsed.sla_compliance_pct).toBeGreaterThan(0);
    expect(parsed.monthly_earnings_series.length).toBeGreaterThan(0);
  });

  it("fetches and validates Upgraded Executive Platform BI (/v1/analytics/dashboard)", async () => {
    const res = await fetchMobileExecutiveBiAnalytics("30D", mobileApiClient);
    const parsed = executiveBiAnalyticsSchema.parse(res);
    expect(parsed.total_gmv_usd).toBeGreaterThan(0);
    expect(parsed.wallet_topup_volume_vnd).toBeGreaterThan(0);
    expect(parsed.escrow_locked_volume_vnd).toBeGreaterThan(0);
    expect(parsed.ai_matcher_revenue_vnd).toBeGreaterThan(0);
    expect(parsed.community_metrics.total_posts).toBeGreaterThan(0);
    expect(parsed.skill_supply_demand_heatmap.length).toBeGreaterThan(0);
  });

  it("wires all required Figma #135 testIDs and Android content-desc contracts", () => {
    const sectionSrc = readFileSync(
      join(import.meta.dir, "../src/components/analytics-360-section.tsx"),
      "utf-8"
    );
    const androidSrc = readFileSync(
      join(
        import.meta.dir,
        "../android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java"
      ),
      "utf-8"
    );
    expect(sectionSrc).toContain("mobile-candidate-analytics-card");
    expect(sectionSrc).toContain("candidate-analytics-range");
    expect(sectionSrc).toContain("candidate-analytics-kpis");
    expect(sectionSrc).toContain("candidate-ats-history-chart");
    expect(sectionSrc).toContain("candidate-application-funnel");
    expect(sectionSrc).toContain("mobile-recruiter-analytics-card");
    expect(sectionSrc).toContain("recruiter-analytics-funnel");
    expect(sectionSrc).toContain("mobile-expert-analytics-card");
    expect(sectionSrc).toContain("expert-analytics-panel");
    expect(sectionSrc).toContain("mobile-executive-bi-card");
    expect(sectionSrc).toContain("admin-wallet-cashflow-panel");
    expect(sectionSrc).toContain("admin-skill-heatmap-panel");

    expect(androidSrc).toContain("mobile-candidate-analytics-card");
    expect(androidSrc).toContain("mobile-recruiter-analytics-card");
    expect(androidSrc).toContain("mobile-expert-analytics-card");
    expect(androidSrc).toContain("mobile-executive-bi-card");
  });
});
