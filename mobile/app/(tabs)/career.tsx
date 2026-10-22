import React, { useState } from "react";
import { ActionButton, BadgePill, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import {
  useMobileExecutiveAnalyticsQuery,
  useMobileExpertPackagesQuery,
  useMobileMomoQrMutation,
  useMobileSalaryBenchmarkQuery,
} from "@/hooks/use-mobile-career-tools";
import { getSemanticTokens } from "@/theme/tokens";

type CareerSubTab = "expert" | "salary" | "bi";

export default function MobileCareerHubScreen() {
  const tokens = getSemanticTokens("dark");
  const [subTab, setSubTab] = useState<CareerSubTab>("expert");
  const [roleQuery, setRoleQuery] = useState("Staff Backend Engineer");

  const packagesQuery = useMobileExpertPackagesQuery();
  const momoMutation = useMobileMomoQrMutation();
  const salaryQuery = useMobileSalaryBenchmarkQuery(roleQuery, "Ho Chi Minh City");
  const biQuery = useMobileExecutiveAnalyticsQuery();

  return (
    <ScreenShell testID="mobile-career-hub-screen" mode="dark">
      <SurfaceCard testID="mobile-career-segmented-bar" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BadgePill label="CAREER INTELLIGENCE & MONETIZATION" tone="brand" />
          <BadgePill label="PRO SUITE" tone="success" />
        </div>
        <h1
          data-testid="mobile-career-heading"
          style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.typography.heading }}
        >
          Career Acceleration & Monetization Hub
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <ActionButton
            testID="mobile-career-sub-expert"
            label="Expert Review"
            variant={subTab === "expert" ? "primary" : "secondary"}
            onPress={() => setSubTab("expert")}
          />
          <ActionButton
            testID="mobile-career-sub-salary"
            label="Salary Radar"
            variant={subTab === "salary" ? "primary" : "secondary"}
            onPress={() => setSubTab("salary")}
          />
          <ActionButton
            testID="mobile-career-sub-bi"
            label="Executive BI"
            variant={subTab === "bi" ? "primary" : "secondary"}
            onPress={() => setSubTab("bi")}
          />
        </div>
      </SurfaceCard>

      {subTab === "expert" ? (
        <SurfaceCard testID="mobile-expert-review-card" mode="dark">
          <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
            1-on-1 Expert CV Review & MoMo Escrow
          </h2>
          {(packagesQuery.data ?? []).map((pkg) => (
            <div
              key={pkg.id}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: tokens.surface.elevated,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                {pkg.name} (${pkg.price_usd} • {pkg.turnaround_hours}h SLA)
              </span>
              <ActionButton
                testID={`mobile-book-pkg-${pkg.id}`}
                label="MoMo QR Checkout"
                onPress={() =>
                  momoMutation.mutate({ packageId: pkg.id, amountVnd: pkg.price_usd * 25000 })
                }
              />
            </div>
          ))}
          {momoMutation.data ? (
            <div data-testid="mobile-momo-qr-status">
              MoMo Order Ready: {momoMutation.data.order_id} ({momoMutation.data.status})
            </div>
          ) : null}
        </SurfaceCard>
      ) : null}

      {subTab === "salary" ? (
        <SurfaceCard testID="mobile-salary-benchmark-card" mode="dark">
          <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
            IT Compensation Radar (P25 / P50 / P75 / P90)
          </h2>
          <input
            data-testid="mobile-salary-role-input"
            value={roleQuery}
            onChange={(e) => setRoleQuery(e.target.value)}
            style={{
              backgroundColor: tokens.surface.elevated,
              color: tokens.typography.main,
              border: `1px solid ${tokens.surface.border}`,
              borderRadius: 12,
              padding: "10px 12px",
            }}
          />
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

      {subTab === "bi" ? (
        <SurfaceCard testID="mobile-exec-bi-card" mode="dark">
          <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
            Executive Revenue & Unit Economics BI
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
