import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("BEL-233 Service Worker Hardening & SkillBadge Wiring (NTA-S004, NTA-D002, NTA-P003)", () => {
  const readSrc = (relPath: string) => readFileSync(join(process.cwd(), "src", relPath), "utf8");

  test("sw.js uses Promise.allSettled & AbortSignal.timeout(8000), ServiceWorkerProvider sets data-sw-status, and SkillsCard connects SkillBadge with stable key", () => {
    const swSrc = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
    const swProviderSrc = readSrc("components/providers/service-worker-provider.tsx");
    const skillBadgeSrc = readSrc("components/common/skill-badge.tsx");
    const skillsCardSrc = readSrc("components/features/profile/skills-card.tsx");

    expect(swSrc.includes(".catch(() => {})")).toBe(false);
    expect(swSrc.includes("Promise.allSettled(PRECACHE_ASSETS.map((url) => cache.add(url)))")).toBe(true);
    expect(swSrc.split("fetch(request, { signal: AbortSignal.timeout(8000) })").length - 1).toBe(2);

    expect(swProviderSrc.includes(".catch(() => {})")).toBe(false);
    expect(swProviderSrc.includes("data-sw-status")).toBe(true);

    expect(skillBadgeSrc.includes('data-testid="skill-badge"')).toBe(true);
    expect(skillBadgeSrc.includes('data-testid="remove-skill-btn"')).toBe(true);
    expect(skillsCardSrc.includes("<SkillBadge")).toBe(true);
    expect(skillsCardSrc.includes("key={idx}")).toBe(false);
  });
});
