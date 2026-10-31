import { describe, expect, test } from "bun:test";
import { DESIGN_TOKENS, getSemanticTokenPalette } from "@/lib/design-tokens";

describe("Primer 3-Tier Design Token SSOT", () => {
  test("exposes base, semantic (light, dark, neumorphic), and component token tiers", () => {
    expect(DESIGN_TOKENS.base.brand.teal500).toBe("#5bbbae");
    expect(DESIGN_TOKENS.semantic.light.surface.page).toBe("#f8f9fa");
    expect(DESIGN_TOKENS.semantic.dark.surface.page).toBe("#0b0f19");
    expect(DESIGN_TOKENS.semantic.neumorphic.surface.page).toBe("#E0E5EC");
    expect(DESIGN_TOKENS.component.videoPlayButton.sizePx).toBe(54);
  });

  test("getSemanticTokenPalette returns typed status and surface tokens per theme mode", () => {
    const light = getSemanticTokenPalette("light");
    const dark = getSemanticTokenPalette("dark");
    expect(light.status.success).toBe("#10b981");
    expect(dark.status.danger).toBe("#f87171");
  });
});
