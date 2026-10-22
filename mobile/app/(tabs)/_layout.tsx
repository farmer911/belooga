import React from "react";
import { ActionButton, BadgePill, mobileRouter, ScreenShell } from "@/lib/native-runtime";
import { getSemanticTokens } from "@/theme/tokens";

export interface MobileTabDescriptor {
  key: string;
  title: string;
  route: string;
}

export const MOBILE_TABS: readonly MobileTabDescriptor[] = [
  { key: "discover", title: "Discover", route: "/(tabs)" },
  { key: "studio", title: "Pitch Studio", route: "/(tabs)/studio" },
  { key: "tracker", title: "Job Tracker", route: "/(tabs)/tracker" },
  { key: "career", title: "Career Pro", route: "/(tabs)/career" },
  { key: "profile", title: "Workspace", route: "/(tabs)/profile" },
] as const;

export default function MobileTabsLayout({ children }: { children?: React.ReactNode }) {
  const tokens = getSemanticTokens("dark");
  const currentPath = mobileRouter.getState().currentPath;

  return (
    <ScreenShell testID="mobile-tabs-layout" mode="dark" style={{ minHeight: "100vh", justifyContent: "space-between" }}>
      <header
        data-testid="mobile-brand-header"
        style={{
          backgroundColor: tokens.surface.card,
          borderBottom: `1px solid ${tokens.surface.border}`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: tokens.brand.primary,
              color: tokens.typography.inverse,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            B
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: tokens.typography.heading }}>
              BELOOGA MOBILE
            </div>
            <div
              data-testid="mobile-connection-status"
              style={{ fontSize: 11, color: tokens.typography.body }}
            >
              Edge Gateway :8080 • Keystore Vault Active
            </div>
          </div>
        </div>
        <BadgePill label="RN 0.88 PRO" tone="brand" />
      </header>

      <main
        data-testid="mobile-tabs-content"
        style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}
      >
        {children}
      </main>

      <nav
        data-testid="mobile-bottom-tab-bar"
        style={{
          backgroundColor: tokens.surface.card,
          borderTop: `1px solid ${tokens.surface.border}`,
          padding: "10px 12px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 6,
        }}
      >
        {MOBILE_TABS.map((tab) => {
          const isActive = currentPath === tab.route;
          return (
            <ActionButton
              key={tab.key}
              testID={`mobile-tab-${tab.key}`}
              label={tab.title}
              variant={isActive ? "primary" : "secondary"}
              onPress={() => mobileRouter.replace(tab.route)}
            />
          );
        })}
      </nav>
    </ScreenShell>
  );
}
