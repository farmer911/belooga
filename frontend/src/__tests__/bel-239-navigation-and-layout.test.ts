import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const readSrc = (relPath: string) => readFileSync(join(process.cwd(), "src", relPath), "utf8");
const hasSrc = (relPath: string) => existsSync(join(process.cwd(), "src", relPath));

describe("BEL-239 App Router Navigation Sync, Zero Nested <main>, and 3-Tier Layout Widths", () => {
  test("all 8 previously nested <main> page files use semantic <div> containers instead of <main>", () => {
    const targetPages = [
      "app/(public)/expert-review/page.tsx",
      "app/admin/analytics/page.tsx",
      "app/ats-diagnostics/page.tsx",
      "app/cv-studio/page.tsx",
      "app/recruiter/hub/page.tsx",
      "app/salary-benchmark/page.tsx",
      "app/user/[username]/page.tsx",
      "app/workspace/jobs/page.tsx",
    ];
    for (const rel of targetPages) {
      const src = readSrc(rel);
      expect(src.includes("<main")).toBe(false);
      expect(src.includes("</main>")).toBe(false);
    }
    const rootLayout = readSrc("app/layout.tsx");
    expect(rootLayout.includes("<main")).toBe(true);
  });

  test("Header.tsx and ecosystem-menu.tsx link all 4 missing platform routes and protect /recruiter/ on logout", () => {
    const headerSrc = readSrc("components/layout/Header.tsx");
    const ecoSrc = readSrc("components/layout/ecosystem-menu.tsx");
    for (const route of ["/companies", "/recruiter/hub", "/workspace/analytics", "/workspace/wallet"]) {
      expect(headerSrc.includes(route)).toBe(true);
      expect(ecoSrc.includes(route)).toBe(true);
    }
    expect(headerSrc.includes('pathname?.startsWith("/recruiter/")')).toBe(true);
  });

  test("WorkspaceNavStrip and app/workspace/layout.tsx unify candidate workspace sub-navigation", () => {
    expect(hasSrc("components/layout/workspace-nav-strip.tsx")).toBe(true);
    expect(hasSrc("app/workspace/layout.tsx")).toBe(true);
    const stripSrc = readSrc("components/layout/workspace-nav-strip.tsx");
    for (const route of ["/workspace/jobs", "/workspace/analytics", "/workspace/wallet", "/cv-studio"]) {
      expect(stripSrc.includes(route)).toBe(true);
    }
    expect(readSrc("app/workspace/layout.tsx").includes("WorkspaceNavStrip")).toBe(true);
    expect(readSrc("components/features/profile/workspace-toolbar.tsx").includes("WorkspaceNavStrip")).toBe(true);
    expect(readSrc("components/features/profile/workspace-subpage-shell.tsx").includes("WorkspaceNavStrip")).toBe(true);
  });

  test("3-tier container widths replace arbitrary max-w-[1400px], max-w-[1440px], and max-w-[1600px] with max-w-7xl", () => {
    const salarySrc = readSrc("app/salary-benchmark/page.tsx");
    const recruiterSrc = readSrc("app/recruiter/hub/page.tsx");
    const adminSrc = readSrc("app/admin/analytics/page.tsx");
    const walletSrc = readSrc("app/workspace/wallet/page.tsx");

    expect(salarySrc.includes("max-w-[1400px]")).toBe(false);
    expect(salarySrc.includes("max-w-7xl")).toBe(true);
    expect(recruiterSrc.includes("max-w-[1440px]")).toBe(false);
    expect(recruiterSrc.includes("max-w-7xl")).toBe(true);
    expect(adminSrc.includes("max-w-[1600px]")).toBe(false);
    expect(adminSrc.includes("max-w-7xl")).toBe(true);
    expect(walletSrc.includes("max-w-7xl")).toBe(true);
  });
});
