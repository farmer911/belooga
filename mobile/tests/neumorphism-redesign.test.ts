import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import * as NativeRuntime from "../src/lib/native-runtime";
import * as ThemeTokens from "../src/theme/tokens";

const MOBILE_ROOT = join(import.meta.dir, "..");

describe("BEL-224 (#194): Full Mobile App Neumorphism (Soft UI) Redesign", () => {
  it("defines Neumorphic Soft UI palette tokens (#E0E5EC, #D1D9E6, #FFFFFF, #A3B1C6, #0F766E, #1E293B, #475569)", () => {
    const neu = (ThemeTokens as Record<string, unknown>).NEUMORPHIC_TOKENS as
      | {
          canvas: string;
          extrudedCard: string;
          recessedWell: string;
          highlightBevel: string;
          shadowDark: string;
          primaryTeal: string;
          headingText: string;
          bodyText: string;
          dualExtrudedShadow: string;
          insetRecessedShadow: string;
        }
      | undefined;

    expect(neu).toBeTruthy();
    expect(neu?.canvas).toBe("#E0E5EC");
    expect(neu?.extrudedCard).toBe("#E0E5EC");
    expect(neu?.recessedWell).toBe("#D1D9E6");
    expect(neu?.highlightBevel).toBe("#FFFFFF");
    expect(neu?.shadowDark).toBe("#A3B1C6");
    expect(neu?.primaryTeal).toBe("#0F766E");
    expect(neu?.headingText).toBe("#1E293B");
    expect(neu?.bodyText).toBe("#475569");
    expect(neu?.dualExtrudedShadow).toContain("#FFFFFF");
    expect(neu?.dualExtrudedShadow).toContain("#A3B1C6");
    expect(neu?.insetRecessedShadow).toContain("inset");

    const semanticNeu = ThemeTokens.getSemanticTokens("neumorphic" as ThemeTokens.ThemeMode);
    expect(semanticNeu.surface.page).toBe("#E0E5EC");
    expect(semanticNeu.surface.card).toBe("#E0E5EC");
    expect(semanticNeu.surface.elevated).toBe("#D1D9E6");
    expect(semanticNeu.brand.primary).toBe("#0F766E");
    expect(semanticNeu.typography.heading).toBe("#1E293B");
    expect(semanticNeu.typography.body).toBe("#475569");
  });

  it("exports NeumorphicCard, NeumorphicInput, NeumorphicInsetWell, and NeumorphicButton primitives in native-runtime", () => {
    const runtime = NativeRuntime as Record<string, unknown>;
    expect(typeof runtime.NeumorphicCard).toBe("function");
    expect(typeof runtime.NeumorphicInput).toBe("function");
    expect(typeof runtime.NeumorphicInsetWell).toBe("function");
    expect(typeof runtime.NeumorphicButton).toBe("function");
  });

  it("implements LayerDrawable dual-bevel Neumorphic cards, recessed input wells, convex buttons, and Neumorphic 5-tab dock in BeloogaUiKit.java", () => {
    const uiKitJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/BeloogaUiKit.java"),
      "utf-8"
    );

    expect(uiKitJava).toContain("LayerDrawable");
    expect(uiKitJava).toContain("Color.rgb(224, 229, 236)"); // #E0E5EC
    expect(uiKitJava).toContain("Color.rgb(209, 217, 230)"); // #D1D9E6
    expect(uiKitJava).toContain("Color.rgb(163, 177, 198)"); // #A3B1C6
    expect(uiKitJava).toContain("Color.rgb(15, 118, 110)"); // #0F766E
    expect(uiKitJava).toContain("Color.rgb(30, 41, 59)"); // #1E293B
    expect(uiKitJava).toContain("Color.rgb(71, 85, 105)"); // #475569
    expect(uiKitJava).toContain("createNeumorphicExtrudedDrawable");
    expect(uiKitJava).toContain("createNeumorphicInsetDrawable");
    expect(uiKitJava).toContain("createNeumorphicInput");
    expect(uiKitJava).toContain("createNeumorphicInsetWell");
  });

  it("applies Neumorphism across all 5 Expo tabs and sub-screens plus Android MainActivity", () => {
    const tabFiles = [
      "app/(tabs)/_layout.tsx",
      "app/(tabs)/index.tsx",
      "app/(tabs)/tracker.tsx",
      "app/(tabs)/studio.tsx",
      "app/(tabs)/career.tsx",
      "app/(tabs)/profile.tsx",
    ];
    for (const rel of tabFiles) {
      const content = readFileSync(join(MOBILE_ROOT, rel), "utf-8");
      expect(content).toContain("neumorphic");
    }

    const indexTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/index.tsx"), "utf-8");
    const trackerTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/tracker.tsx"), "utf-8");
    const studioTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/studio.tsx"), "utf-8");
    const careerTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/career.tsx"), "utf-8");
    const profileTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/profile.tsx"), "utf-8");

    expect(indexTsx).toContain("NeumorphicInput");
    expect(trackerTsx).toContain("NeumorphicInput");
    expect(studioTsx).toContain("NeumorphicInsetWell");
    expect(careerTsx).toContain("NeumorphicInsetWell");
    expect(profileTsx).toContain("NeumorphicInput");

    const mainJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/MainActivity.java"),
      "utf-8"
    );
    expect(mainJava).toContain("createNeumorphicInput");
  });
});
