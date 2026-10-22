import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  fetchMobileCandidateAnalytics,
  fetchMobileExecutiveBiAnalytics,
  fetchMobileExpertAnalytics,
  fetchMobileRecruiterAnalytics,
} from "../src/hooks/use-mobile-analytics-360";
import {
  evaluateMobileMockInterview,
  fetchMobileCareerRoadmap,
  fetchMobileGrowthHub,
  generateMobileSalaryNegotiation,
} from "../src/hooks/use-mobile-growth-20";
import { mobileApiClient, setMobileFetchTransportForTesting } from "../src/services/api-client";

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

describe("BEL-219 (#177): [P0-NO-MOCKUP] Zero Mock/Fallback Data in mobile/", () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it("enforces zero FALLBACK_*, INITIAL_*, DEFAULT_*, or MOCK_* mock arrays/objects across mobile/src and mobile/app", () => {
    const files = [
      ...collectSourceFiles(join(import.meta.dir, "../src")),
      ...collectSourceFiles(join(import.meta.dir, "../app")),
    ];
    for (const file of files) {
      const src = readFileSync(file, "utf-8");
      expect(src.includes("FALLBACK_")).toBe(false);
      expect(src.includes("DEFAULT_TOP_CANDIDATES")).toBe(false);
      expect(src.includes("DEFAULT_EXPERTS")).toBe(false);
      expect(src.includes("DEFAULT_NOTIFICATIONS")).toBe(false);
      expect(src.includes("DEFAULT_SKILL_CHIPS")).toBe(false);
    }

    const analyticsHookSrc = readFileSync(
      join(import.meta.dir, "../src/hooks/use-mobile-analytics-360.ts"),
      "utf-8"
    );
    const growthHookSrc = readFileSync(
      join(import.meta.dir, "../src/hooks/use-mobile-growth-20.ts"),
      "utf-8"
    );
    expect(analyticsHookSrc.includes("catch")).toBe(false);
    expect(growthHookSrc.includes("catch")).toBe(false);
  });

  it("propagates real FastAPI HTTP errors instead of returning fake fallback payloads", async () => {
    setMobileFetchTransportForTesting((async () => {
      return new Response(JSON.stringify({ detail: "Database connection error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch);

    await expect(fetchMobileCandidateAnalytics("30D", mobileApiClient)).rejects.toThrow();
    await expect(fetchMobileRecruiterAnalytics(mobileApiClient)).rejects.toThrow();
    await expect(fetchMobileExpertAnalytics(mobileApiClient)).rejects.toThrow();
    await expect(fetchMobileExecutiveBiAnalytics("30D", mobileApiClient)).rejects.toThrow();
    await expect(
      evaluateMobileMockInterview(
        { role_title: "Staff Engineer", question: "Q", answer_text: "A" },
        mobileApiClient
      )
    ).rejects.toThrow();
    await expect(
      generateMobileSalaryNegotiation(
        { role_title: "Staff Engineer", current_offer_usd: 2600, target_offer_usd: 3050 },
        mobileApiClient
      )
    ).rejects.toThrow();
    await expect(fetchMobileCareerRoadmap("Staff Engineer", mobileApiClient)).rejects.toThrow();
    await expect(fetchMobileGrowthHub(mobileApiClient)).rejects.toThrow();
  });
});
