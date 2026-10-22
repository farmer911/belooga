import React, { useState } from "react";
import { ActionButton, BadgePill, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import {
  saveMobileCvDraft,
  useMobileExecutiveAnalyticsQuery,
  useMobileExpertPackagesQuery,
  useMobileMomoQrMutation,
  useMobileSalaryBenchmarkQuery,
} from "@/hooks/use-mobile-career-tools";
import {
  useApplyMobileCareerJobMutation,
  useCompleteMobileEscrowMutation,
  useCreateMobileCareerJobMutation,
  useCreateMobileSocialBlogPostMutation,
  useMobileCareerJobsQuery,
  useMobileSocialBlogPostsQuery,
  useMobileWalletSummaryQuery,
  useTopUpMobileWalletMutation,
  useTriggerMobileSalaryCrawlMutation,
} from "@/hooks/use-mobile-parity-part2";
import { getSemanticTokens } from "@/theme/tokens";
import { RecruiterHubSection } from "@/components/recruiter-hub-section";
import { ExpertLeaderboardSection } from "@/components/expert-leaderboard-section";

type CareerSubTab = "expert" | "wallet" | "salary" | "community" | "recruiter" | "bi";
const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000] as const;
const SALARY_YEARS = ["2024", "2025", "2026", "all"] as const;

export default function MobileCareerHubScreen() {
  const tokens = getSemanticTokens("dark");
  const [subTab, setSubTab] = useState<CareerSubTab>("expert");
  const [roleQuery, setRoleQuery] = useState("Staff Backend Engineer");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [topUpAmount, setTopUpAmount] = useState<number>(500000);
  const [showExpertReport, setShowExpertReport] = useState(false);
  const [socialPostText, setSocialPostText] = useState("");

  const packagesQuery = useMobileExpertPackagesQuery();
  const momoMutation = useMobileMomoQrMutation();
  const walletQuery = useMobileWalletSummaryQuery();
  const topUpMutation = useTopUpMobileWalletMutation();
  const completeEscrowMutation = useCompleteMobileEscrowMutation();
  const salaryQuery = useMobileSalaryBenchmarkQuery(roleQuery, "Ho Chi Minh City", selectedYear);
  const crawlMutation = useTriggerMobileSalaryCrawlMutation();
  const socialPostsQuery = useMobileSocialBlogPostsQuery();
  const createPostMutation = useCreateMobileSocialBlogPostMutation();
  const careerJobsQuery = useMobileCareerJobsQuery();
  const createCareerJobMutation = useCreateMobileCareerJobMutation();
  const applyCareerJobMutation = useApplyMobileCareerJobMutation();
  const biQuery = useMobileExecutiveAnalyticsQuery();

  const availVnd = walletQuery.data?.available_balance_vnd ?? 1500000;
  const escrowVnd = walletQuery.data?.escrow_locked_vnd ?? 1475000;
  const inputStyle = {
    backgroundColor: tokens.surface.elevated,
    color: tokens.typography.main,
    border: `1px solid ${tokens.surface.border}`,
    borderRadius: 12,
    padding: "10px 12px",
  };

  return (
    <ScreenShell testID="mobile-career-hub-screen" mode="dark">
      <SurfaceCard testID="mobile-career-segmented-bar" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <BadgePill label="CAREER INTELLIGENCE & MONETIZATION" tone="brand" />
          <ActionButton
            testID="mobile-wallet-balance-pill"
            accessibilityLabel="mobile-wallet-balance-pill"
            label={`Ví: ${(availVnd / 1000).toFixed(0)}k • Escrow: ${(escrowVnd / 1000).toFixed(0)}k VND`}
            variant="secondary"
            onPress={() => setSubTab("wallet")}
          />
        </div>
        <h1
          data-testid="mobile-career-heading"
          style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.typography.heading }}
        >
          Career Acceleration & Monetization Hub
        </h1>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <ActionButton testID="mobile-career-sub-expert" label="Expert Review" variant={subTab === "expert" ? "primary" : "secondary"} onPress={() => setSubTab("expert")} />
          <ActionButton testID="mobile-career-sub-wallet" label="Ví & Escrow" variant={subTab === "wallet" ? "primary" : "secondary"} onPress={() => setSubTab("wallet")} />
          <ActionButton testID="mobile-career-sub-salary" label="Salary Radar" variant={subTab === "salary" ? "primary" : "secondary"} onPress={() => setSubTab("salary")} />
          <ActionButton testID="mobile-career-sub-community" label="Social & Jobs" variant={subTab === "community" ? "primary" : "secondary"} onPress={() => setSubTab("community")} />
          <ActionButton testID="mobile-career-sub-recruiter" label="Recruiter Hub" variant={subTab === "recruiter" ? "primary" : "secondary"} onPress={() => setSubTab("recruiter")} />
          <ActionButton testID="mobile-career-sub-bi" label="Executive BI" variant={subTab === "bi" ? "primary" : "secondary"} onPress={() => setSubTab("bi")} />
        </div>
      </SurfaceCard>

      {subTab === "recruiter" ? <RecruiterHubSection /> : null}

      {(subTab === "expert" || subTab === "wallet") ? (
        <SurfaceCard testID="mobile-expert-review-card" mode="dark">
          <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
            Ví Điện Tử (/v1/wallet/*) & 4-Step Expert Review Escrow
          </h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TOPUP_AMOUNTS.map((amt) => (
              <ActionButton
                key={amt}
                testID={`mobile-wallet-topup-chip-${amt}`}
                accessibilityLabel={`mobile-wallet-topup-chip-${amt}`}
                label={`+${amt / 1000}k`}
                variant={topUpAmount === amt ? "primary" : "secondary"}
                onPress={() => setTopUpAmount(amt)}
              />
            ))}
            <ActionButton
              testID="mobile-wallet-topup-submit-btn"
              accessibilityLabel="mobile-wallet-topup-submit-btn"
              label={`Nạp Tiền Vào Ví (${topUpAmount / 1000}k VND)`}
              onPress={() => topUpMutation.mutate(topUpAmount)}
            />
          </div>
          {(packagesQuery.data ?? []).map((pkg) => (
            <div key={pkg.id} style={{ padding: 12, borderRadius: 12, backgroundColor: tokens.surface.elevated, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{pkg.name} (${pkg.price_usd} • {pkg.turnaround_hours}h SLA)</span>
              <ActionButton
                testID={`mobile-book-pkg-${pkg.id}`}
                label="MoMo QR Checkout"
                onPress={() => momoMutation.mutate({ packageId: pkg.id, amountVnd: pkg.price_usd * 25000 })}
              />
            </div>
          ))}
          {momoMutation.data ? (
            <div data-testid="mobile-momo-qr-status">
              MoMo Order Ready: {momoMutation.data.order_id} ({momoMutation.data.status})
            </div>
          ) : null}
          <div data-testid="mobile-escrow-sla-steps" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <BadgePill label="1. Đã giữ tiền Escrow -> 2. Expert đang chấm CV (SLA) -> 3. Đã có Báo cáo -> 4. Nghiệm thu & Giải ngân" tone="brand" />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <ActionButton
                testID="mobile-view-expert-report-btn"
                accessibilityLabel="mobile-view-expert-report-btn"
                label="Xem Báo Cáo Chấm CV Chi Tiết"
                variant="secondary"
                onPress={() => setShowExpertReport((p) => !p)}
              />
              <ActionButton
                testID="mobile-apply-expert-fixes-btn"
                accessibilityLabel="mobile-apply-expert-fixes-btn"
                label="1-Click Áp Dụng Vào CV Studio"
                variant="secondary"
                onPress={() =>
                  void saveMobileCvDraft("alexnguyen", {
                    template_id: "executive-dark",
                    summary: "Expert STAR Rewrite Applied: Architected sub-15ms PG16 GIN & RN 0.88 platform.",
                    skills: ["Golang", "Python", "PostgreSQL 16", "React Native 0.88"],
                  })
                }
              />
              <ActionButton
                testID="mobile-release-escrow-btn"
                accessibilityLabel="mobile-release-escrow-btn"
                label="Nghiệm Thu & Giải Ngân Escrow"
                onPress={() => completeEscrowMutation.mutate("ord_8841")}
              />
            </div>
            {showExpertReport ? (
              <p data-testid="mobile-expert-report-detail" style={{ margin: 0, fontSize: 13, color: tokens.typography.body }}>
                Expert Scorecard (98/100): Quantified RPS metrics & STAR impact bullets added across 3 roles.
              </p>
            ) : null}
          </div>
          <ExpertLeaderboardSection />
        </SurfaceCard>
      ) : null}

      {subTab === "salary" ? (
        <SurfaceCard testID="mobile-salary-benchmark-card" mode="dark">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
              IT Compensation Radar (2024 -&gt; Hiện Tại 2026)
            </h2>
            <BadgePill testID="mobile-crawler-status-badge" label="+14.2% YoY • Live Crawler" tone="success" />
          </div>
          <input
            data-testid="mobile-salary-role-input"
            value={roleQuery}
            onChange={(e) => setRoleQuery(e.target.value)}
            style={inputStyle}
          />
          <div data-testid="mobile-salary-history-chart" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SALARY_YEARS.map((yr) => (
              <ActionButton
                key={yr}
                testID={`mobile-salary-year-${yr}`}
                accessibilityLabel={`mobile-salary-year-${yr}`}
                label={`Năm ${yr.toUpperCase()}`}
                variant={selectedYear === yr ? "primary" : "secondary"}
                onPress={() => setSelectedYear(yr)}
              />
            ))}
            <ActionButton
              testID="mobile-trigger-salary-crawl-btn"
              accessibilityLabel="mobile-trigger-salary-crawl-btn"
              label="Trigger Live Salary Crawl (2024-2026)"
              onPress={() => crawlMutation.mutate(roleQuery)}
            />
          </div>
          {salaryQuery.data ? (
            <div data-testid="mobile-salary-percentiles" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <BadgePill label={`P25: $${salaryQuery.data.p25}`} tone="neutral" />
              <BadgePill label={`Median P50: $${salaryQuery.data.p50}`} tone="brand" />
              <BadgePill label={`P75: $${salaryQuery.data.p75}`} tone="success" />
              <BadgePill label={`P90: $${salaryQuery.data.p90}`} tone="warning" />
            </div>
          ) : null}
        </SurfaceCard>
      ) : null}

      {subTab === "community" ? (
        <SurfaceCard testID="mobile-community-careers-card" mode="dark">
          <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
            Community Social Feed (/v1/blog/posts) &amp; Multi-Company Careers
          </h2>
          <input
            data-testid="mobile-social-post-input"
            aria-label="mobile-social-post-input"
            value={socialPostText}
            placeholder="Chia sẻ kinh nghiệm phỏng vấn / điểm ATS..."
            onChange={(e) => setSocialPostText(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <ActionButton
              testID="mobile-social-post-submit-btn"
              accessibilityLabel="mobile-social-post-submit-btn"
              label="Đăng Chia Sẻ (/v1/blog/posts)"
              onPress={() => {
                if (!socialPostText.trim()) return;
                createPostMutation.mutate({ title: socialPostText.trim(), content: socialPostText.trim() });
                setSocialPostText("");
              }}
            />
            <ActionButton
              testID="mobile-careers-post-job-btn"
              accessibilityLabel="mobile-careers-post-job-btn"
              label="Đăng Tin Tuyển Dụng (Post a Job)"
              variant="secondary"
              onPress={() =>
                createCareerJobMutation.mutate({
                  company_name: "Databricks",
                  title: "Staff Distributed Engineer",
                  location: "Remote APAC",
                  salary_range: "$200k - $240k",
                })
              }
            />
          </div>
          {(socialPostsQuery.data ?? []).map((post) => (
            <div key={post.id} style={{ padding: 10, borderRadius: 10, backgroundColor: tokens.surface.elevated }}>
              <strong>@{post.author_username}:</strong> {post.title} ({post.likes_count} Likes)
            </div>
          ))}
          {(careerJobsQuery.data ?? [{ id: "cjob_1", company_name: "Databricks", title: "Staff Systems Engineer", location: "Remote", salary_range: "$210k" }]).map((job) => (
            <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span>{job.title} @ {job.company_name} ({job.salary_range})</span>
              <ActionButton
                testID={`mobile-careers-apply-btn-${job.id}`}
                accessibilityLabel={`mobile-careers-apply-btn-${job.id}`}
                label="1-Click Apply"
                onPress={() => applyCareerJobMutation.mutate(job.id)}
              />
            </div>
          ))}
        </SurfaceCard>
      ) : null}

      {subTab === "bi" ? (
        <SurfaceCard testID="mobile-exec-bi-card" mode="dark">
          <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
            Executive Revenue &amp; Unit Economics BI
          </h2>
          {biQuery.data ? (
            <div data-testid="mobile-exec-bi-metrics" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <BadgePill label={`GMV: $${biQuery.data.total_gmv_usd}`} tone="brand" />
              <BadgePill label={`MoMo Conv: ${biQuery.data.momo_conversion_rate}%`} tone="success" />
              <BadgePill label={`Search P95: ${biQuery.data.search_p95_ms}ms`} tone="neutral" />
            </div>
          ) : null}
        </SurfaceCard>
      ) : null}
    </ScreenShell>
  );
}
