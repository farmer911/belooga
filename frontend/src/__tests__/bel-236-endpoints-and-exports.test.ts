import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const readSrc = (relPath: string) => readFileSync(join(process.cwd(), "src", relPath), "utf8");

describe("BEL-236 Dead Endpoint Constants Removal, 8 Orphaned Endpoints Wiring & 3 Runtime Exports", () => {
  test("schemas.ts contains zero dummy *_ENDPOINT constants", () => {
    const schemasSrc = readSrc("lib/schemas.ts");
    expect(schemasSrc.includes("_ENDPOINT")).toBe(false);
  });

  test("8 previously orphaned backend endpoints are wired into real hooks and pages", () => {
    const expertReviewHookSrc = readSrc("hooks/use-expert-review.ts");
    const careersPageSrc = readSrc("app/(public)/careers/page.tsx");
    const marketPanelSrc = readSrc("components/features/job-tracker/job-search-market-panel.tsx");
    const topCandidatesSrc = readSrc("components/features/search/top-candidates-leaderboard.tsx");
    const expertLeaderboardSrc = readSrc("components/features/expert-review/expert-leaderboard-section.tsx");
    const analyticsPageSrc = readSrc("app/workspace/analytics/page.tsx");
    const walletPageSrc = readSrc("app/workspace/wallet/page.tsx");

    expect(expertReviewHookSrc.includes("/v1/expert-review/orders/")).toBe(true);
    expect(expertReviewHookSrc.includes("/simulate-delivery")).toBe(true);
    expect(careersPageSrc.includes("/v1/careers/")).toBe(true);
    expect(careersPageSrc.includes("/apply")).toBe(true);
    expect(marketPanelSrc.includes("/v1/tracker/search-market-jobs")).toBe(true);
    expect(marketPanelSrc.includes("/v1/tracker/goals/")).toBe(true);
    expect(marketPanelSrc.includes("/ai-match")).toBe(true);
    expect(topCandidatesSrc.includes("/v1/search/top-candidates")).toBe(true);
    expect(expertLeaderboardSrc.includes("/v1/expert-review/leaderboard")).toBe(true);
    expect(analyticsPageSrc.includes("/v1/growth/cv-roasts/")).toBe(true);
    expect(analyticsPageSrc.includes("/vote")).toBe(true);
    expect(walletPageSrc.includes("/v1/wallet/balance")).toBe(true);
  });

  test("3 runtime exports (NotificationSpotlightBanner, invalidateServiceWorkerApiCache, SkillBadge) are wired", () => {
    const headerSrc = readSrc("components/layout/Header.tsx");
    const skillsCardSrc = readSrc("components/features/profile/skills-card.tsx");

    expect(headerSrc.includes("NotificationSpotlightBanner")).toBe(true);
    expect(headerSrc.includes("<NotificationSpotlightBanner")).toBe(true);
    expect(headerSrc.includes("invalidateServiceWorkerApiCache")).toBe(true);
    expect(skillsCardSrc.includes("<SkillBadge")).toBe(true);
  });
});
