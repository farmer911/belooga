import React from "react";
import { ActionButton, mobileRouter, ScreenShell } from "@/lib/native-runtime";
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
        aria-label="mobile-top-app-header"
        style={{
          backgroundColor: tokens.surface.card,
          borderBottom: `1px solid ${tokens.surface.border}`,
          padding: "12px 18px",
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            data-testid="mobile-header-avatar-btn"
            aria-label="mobile-header-avatar-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
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
            <div style={{ fontWeight: 800, fontSize: 16, color: tokens.typography.heading }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ActionButton
            testID="mobile-header-wallet-pill"
            accessibilityLabel="mobile-header-wallet-pill"
            label="Ví 1.5M+"
            variant="secondary"
            style={{ borderRadius: 999, padding: "6px 12px" }}
            onPress={() => mobileRouter.replace("/(tabs)/career")}
          />
          <ActionButton
            testID="mobile-header-notifications-btn"
            accessibilityLabel="mobile-header-notifications-btn"
            label="Alerts (3)"
            variant="secondary"
            style={{ borderRadius: 999, padding: "6px 12px" }}
            onPress={() => mobileRouter.replace("/(tabs)/profile")}
          />
        </div>
      </header>

      <main
        data-testid="mobile-tabs-content"
        style={{ flex: 1, padding: "18px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {children}
      </main>

      <nav
        data-testid="mobile-bottom-tab-bar"
        aria-label="mobile-bottom-nav-bar"
        style={{
          backgroundColor: tokens.surface.card,
          border: `1px solid ${tokens.surface.border}`,
          borderRadius: 24,
          margin: "0 12px 10px",
          padding: "8px 10px",
          minHeight: 68,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 6,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.32)",
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
