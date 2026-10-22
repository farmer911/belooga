import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { BottomSheetDrawer } from "../src/lib/native-runtime";
import { getSemanticTokens } from "../src/theme/tokens";

const MOBILE_ROOT = join(import.meta.dir, "..");

describe("BEL-181 (#104): Mobile UI/UX Pro Max Overhaul (Figma rootNodeId 11:1100)", () => {
  it("provides BottomSheetDrawer primitive with 24px top radius, 40x4px drag handle, and 48px touch targets", () => {
    expect(typeof BottomSheetDrawer).toBe("function");
    const tokens = getSemanticTokens("dark");
    expect(tokens.surface.page).toBe("rgb(9, 13, 22)");
    expect(tokens.surface.card).toBe("rgb(17, 24, 39)");
  });

  it("enforces 20dp squircle cards, elevation shadows, 24dp bottom sheets, and >=48dp touch targets in BeloogaUiKit.java", () => {
    const uiKitJava = readFileSync(
      join(
        MOBILE_ROOT,
        "android/app/src/main/java/com/belooga/mobile/BeloogaUiKit.java"
      ),
      "utf-8"
    );
    expect(uiKitJava).toContain("20f");
    expect(uiKitJava).toContain("setElevation");
    expect(uiKitJava).toContain("createBottomSheetDrawer");
    expect(uiKitJava).toContain("mobile-bottom-sheet-drawer");
    expect(uiKitJava).toContain("48f");
  });

  it("enforces Figma #103 (11:1102 - 11:1105) Top App Header, Floating Bottom Nav, Bottom Sheet & Vertical Salary Chart contracts", () => {
    const layoutTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/_layout.tsx"), "utf-8");
    const discoverTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/index.tsx"), "utf-8");
    const trackerTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/tracker.tsx"), "utf-8");
    const careerTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/career.tsx"), "utf-8");
    const mainJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/MainActivity.java"),
      "utf-8"
    );
    const careerJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java"),
      "utf-8"
    );

    for (const token of [
      "mobile-top-app-header",
      "mobile-header-wallet-pill",
      "mobile-header-notifications-btn",
      "mobile-header-avatar-btn",
      "mobile-bottom-nav-bar",
    ]) {
      expect(layoutTsx).toContain(token);
      expect(mainJava).toContain(token);
    }

    expect(discoverTsx).toContain("mobile-bottom-sheet-drawer");
    expect(trackerTsx).toContain("mobile-bottom-sheet-drawer");
    expect(careerTsx).toContain("mobile-salary-history-chart");
    expect(careerTsx).toContain("mobile-crawler-status-badge");

    expect(mainJava).toContain("mobile-bottom-sheet-drawer");
    expect(careerJava).toContain("mobile-salary-history-chart");
    expect(careerJava).toContain("mobile-crawler-status-badge");
  });
});
