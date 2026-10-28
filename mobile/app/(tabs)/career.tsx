import React, { useState } from "react";
import { router } from "expo-router";
import { Analytics360Section } from "@/components/analytics-360-section";
import { ExpertLeaderboardSection } from "@/components/expert-leaderboard-section";
import { Growth20Section } from "@/components/growth-20-section";
import { RecruiterHubSection } from "@/components/recruiter-hub-section";
import {
  useMobileExecutiveAnalyticsQuery,
  useMobileExpertPackagesQuery,
  useMobileMomoQrMutation,
  useMobileSalaryBenchmarkQuery,
} from "@/hooks/use-mobile-career-tools";
import {
  useApplyMobileCareerJobMutation,
  useCreateMobileSocialBlogPostMutation,
  useMobileCareerJobsQuery,
  useMobileSocialBlogPostsQuery,
  useMobileWalletSummaryQuery,
  useTopUpMobileWalletMutation,
  useTriggerMobileSalaryCrawlMutation,
} from "@/hooks/use-mobile-parity-part2";
import { Body, Button, Card, ErrorText, Field, H1, H2, Pill, Row, Screen, Well } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

type CareerSubTab = "wallet" | "expert" | "salary" | "community" | "recruiter" | "bi" | "growth";
const SUB_TABS: { key: CareerSubTab; label: string }[] = [
  { key: "wallet", label: "Ví" },
  { key: "expert", label: "Expert Review" },
  { key: "salary", label: "Salary Radar" },
  { key: "community", label: "Social & Jobs" },
  { key: "recruiter", label: "Recruiter Hub" },
  { key: "bi", label: "Executive BI" },
  { key: "growth", label: "Growth Hub" },
];
const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000] as const;
const SALARY_YEARS = ["2024", "2025", "2026", "all"] as const;
const formatVnd = (vnd: number) => `${vnd.toLocaleString("vi-VN")} VND`;

function WalletSection() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  const [topUpAmount, setTopUpAmount] = useState<number>(100000);
  const walletQuery = useMobileWalletSummaryQuery();
  const topUpMutation = useTopUpMobileWalletMutation();

  if (!isAuthenticated) {
    return (
      <Card testID="mobile-wallet-card">
        <Body>Sign in to see and top up your wallet.</Body>
        <Button testID="mobile-wallet-signin" label="Sign In" onPress={() => router.push("/login")} />
      </Card>
    );
  }

  const wallet = walletQuery.data;
  return (
    <Card testID="mobile-wallet-card">
      <H2>Ví Điện Tử & Escrow</H2>
      <Row>
        <Pill testID="mobile-wallet-balance-pill" label={`Khả dụng: ${wallet ? formatVnd(wallet.available_balance_vnd) : "…"}`} />
        <Pill testID="mobile-wallet-escrow-pill" label={`Escrow: ${wallet ? formatVnd(wallet.escrow_locked_vnd) : "…"}`} tone="warning" />
      </Row>
      <ErrorText error={walletQuery.error} />
      <Row>
        {TOPUP_AMOUNTS.map((amt) => (
          <Button
            key={amt}
            testID={`mobile-wallet-topup-chip-${amt}`}
            label={`+${amt / 1000}k`}
            variant={topUpAmount === amt ? "primary" : "inset"}
            onPress={() => setTopUpAmount(amt)}
          />
        ))}
      </Row>
      <Button
        testID="mobile-wallet-topup-submit-btn"
        label={topUpMutation.isPending ? "Đang mở MoMo..." : `Nạp ${topUpAmount / 1000}k VND qua MoMo`}
        disabled={topUpMutation.isPending}
        onPress={() => topUpMutation.mutate(topUpAmount)}
      />
      {topUpMutation.isSuccess ? (
        <Body testID="mobile-wallet-topup-pending" tone="warning">
          Payment order {topUpMutation.data.order_id ?? ""} created. Your balance updates once MoMo confirms the payment.
        </Body>
      ) : null}
      <ErrorText testID="mobile-wallet-topup-error" error={topUpMutation.error} />
      <Row>
        <Button testID="mobile-wallet-refresh-btn" label="Refresh Balance" variant="secondary" onPress={() => void walletQuery.refetch()} />
      </Row>
    </Card>
  );
}

function ExpertSection() {
  const packagesQuery = useMobileExpertPackagesQuery();
  const momoMutation = useMobileMomoQrMutation();
  return (
    <Card testID="mobile-expert-review-card">
      <H2>Expert CV Review Packages</H2>
      {(packagesQuery.data ?? []).map((pkg) => (
        <Well key={pkg.id}>
          <Body>
            {pkg.name} (${pkg.price_usd} • {pkg.turnaround_hours}h SLA)
          </Body>
          <Button
            testID={`mobile-book-pkg-${pkg.id}`}
            label="MoMo Checkout"
            disabled={momoMutation.isPending}
            onPress={() => momoMutation.mutate({ packageName: pkg.name, amountVnd: pkg.price_usd * 25000 })}
          />
        </Well>
      ))}
      <ErrorText error={packagesQuery.error ?? momoMutation.error} />
      {momoMutation.data ? (
        <Body testID="mobile-momo-qr-status">MoMo order {momoMutation.data.order_id} is awaiting payment.</Body>
      ) : null}
      <ExpertLeaderboardSection />
    </Card>
  );
}

function SalarySection() {
  const [roleQuery, setRoleQuery] = useState("Backend Engineer");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const salaryQuery = useMobileSalaryBenchmarkQuery(roleQuery, "Ho Chi Minh City", selectedYear);
  const crawlMutation = useTriggerMobileSalaryCrawlMutation();
  return (
    <Card testID="mobile-salary-benchmark-card">
      <H2>IT Compensation Radar</H2>
      <Field testID="mobile-salary-role-input" value={roleQuery} placeholder="Role" onChangeText={setRoleQuery} />
      <Row testID="mobile-salary-history-chart">
        {SALARY_YEARS.map((yr) => (
          <Button
            key={yr}
            testID={`mobile-salary-year-${yr}`}
            label={`Năm ${yr.toUpperCase()}`}
            variant={selectedYear === yr ? "primary" : "inset"}
            onPress={() => setSelectedYear(yr)}
          />
        ))}
      </Row>
      <Button
        testID="mobile-trigger-salary-crawl-btn"
        label={crawlMutation.isPending ? "Crawling..." : "Refresh Salary Data"}
        disabled={crawlMutation.isPending}
        onPress={() => crawlMutation.mutate(roleQuery)}
      />
      <ErrorText error={salaryQuery.error ?? crawlMutation.error} />
      {salaryQuery.data ? (
        <Row testID="mobile-salary-percentiles">
          <Pill label={`P25: $${salaryQuery.data.p25}`} tone="neutral" />
          <Pill label={`P50: $${salaryQuery.data.p50}`} />
          <Pill label={`P75: $${salaryQuery.data.p75}`} tone="success" />
          <Pill label={`P90: $${salaryQuery.data.p90}`} tone="warning" />
        </Row>
      ) : null}
    </Card>
  );
}

function CommunitySection() {
  const [socialPostText, setSocialPostText] = useState("");
  const socialPostsQuery = useMobileSocialBlogPostsQuery();
  const createPostMutation = useCreateMobileSocialBlogPostMutation();
  const careerJobsQuery = useMobileCareerJobsQuery();
  const applyCareerJobMutation = useApplyMobileCareerJobMutation();
  return (
    <Card testID="mobile-community-careers-card">
      <H2>Community Feed & Careers</H2>
      <Field
        testID="mobile-social-post-input"
        value={socialPostText}
        placeholder="Chia sẻ kinh nghiệm phỏng vấn / điểm ATS..."
        onChangeText={setSocialPostText}
        multiline
      />
      <Button
        testID="mobile-social-post-submit-btn"
        label="Đăng Chia Sẻ"
        disabled={!socialPostText.trim() || createPostMutation.isPending}
        onPress={() =>
          createPostMutation.mutate(
            { title: socialPostText.trim().slice(0, 120), content: socialPostText.trim() },
            { onSuccess: () => setSocialPostText("") }
          )
        }
      />
      <ErrorText error={createPostMutation.error ?? socialPostsQuery.error ?? applyCareerJobMutation.error} />
      {(socialPostsQuery.data ?? []).map((post) => (
        <Well key={post.id}>
          <Body>
            @{post.author_username}: {post.title} ({post.likes_count} likes)
          </Body>
        </Well>
      ))}
      {(careerJobsQuery.data ?? []).map((job) => (
        <Well key={job.id}>
          <Body>
            {job.title} @ {job.company_name} ({job.salary_range})
          </Body>
          <Button
            testID={`mobile-careers-apply-btn-${job.id}`}
            label={applyCareerJobMutation.isSuccess && applyCareerJobMutation.variables === job.id ? "Applied" : "1-Click Apply"}
            onPress={() => applyCareerJobMutation.mutate(job.id)}
          />
        </Well>
      ))}
    </Card>
  );
}

function ExecutiveBiSection() {
  const execBiQuery = useMobileExecutiveAnalyticsQuery();
  const bi = execBiQuery.data;
  return (
    <>
      <Card testID="mobile-career-exec-bi-summary">
        <ErrorText error={execBiQuery.error} />
        {bi ? (
          <Row>
            <Pill testID="mobile-exec-gmv-pill" label={`GMV: $${bi.total_gmv_usd}`} />
            <Pill testID="mobile-exec-conv-pill" label={`MoMo Conv: ${bi.momo_conversion_rate}%`} tone="success" />
            <Pill testID="mobile-exec-p95-pill" label={`Search P95: ${bi.search_p95_ms}ms`} tone="neutral" />
            <Pill testID="mobile-exec-active-pill" label={`Active: ${bi.active_candidates}`} tone="warning" />
          </Row>
        ) : null}
      </Card>
      <Analytics360Section />
    </>
  );
}

export default function CareerScreen() {
  const [subTab, setSubTab] = useState<CareerSubTab>("wallet");
  return (
    <Screen testID="mobile-career-hub-screen">
      <Card testID="mobile-career-segmented-bar">
        <H1 testID="mobile-career-heading">Career Acceleration Hub</H1>
        <Row>
          {SUB_TABS.map((t) => (
            <Button
              key={t.key}
              testID={`mobile-career-sub-${t.key}`}
              label={t.label}
              variant={subTab === t.key ? "primary" : "secondary"}
              onPress={() => setSubTab(t.key)}
            />
          ))}
        </Row>
      </Card>
      {subTab === "wallet" ? <WalletSection /> : null}
      {subTab === "expert" ? <ExpertSection /> : null}
      {subTab === "salary" ? <SalarySection /> : null}
      {subTab === "community" ? <CommunitySection /> : null}
      {subTab === "recruiter" ? <RecruiterHubSection /> : null}
      {subTab === "bi" ? <ExecutiveBiSection /> : null}
      {subTab === "growth" ? <Growth20Section /> : null}
    </Screen>
  );
}
