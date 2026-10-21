import React from "react";
import { ActionButton, mobileRouter, ScreenShell } from "@/lib/native-runtime";

export interface MobileTabDescriptor {
  key: string;
  title: string;
  route: string;
}

export const MOBILE_TABS: readonly MobileTabDescriptor[] = [
  { key: "discover", title: "Discover", route: "/(tabs)" },
  { key: "studio", title: "Pitch Studio", route: "/(tabs)/studio" },
  { key: "tracker", title: "Job Tracker", route: "/(tabs)/tracker" },
  { key: "profile", title: "Workspace", route: "/(tabs)/profile" },
] as const;

export default function MobileTabsLayout({ children }: { children?: React.ReactNode }) {
  return (
    <ScreenShell testID="mobile-tabs-layout" mode="dark">
      <main data-testid="mobile-tabs-content">{children}</main>
      <nav data-testid="mobile-bottom-tab-bar">
        {MOBILE_TABS.map((tab) => (
          <ActionButton
            key={tab.key}
            testID={`mobile-tab-${tab.key}`}
            label={tab.title}
            variant="secondary"
            onPress={() => mobileRouter.replace(tab.route)}
          />
        ))}
      </nav>
    </ScreenShell>
  );
}
