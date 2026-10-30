import React from "react";
import { Text, View } from "react-native";
import { router, Tabs } from "expo-router";
import { useMobileNotificationsQuery } from "@/hooks/use-mobile-auth";
import { useMobileWalletSummaryQuery } from "@/hooks/use-mobile-parity-part2";
import { Button } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";
import { NEUMORPHIC_TOKENS as N } from "@/theme/tokens";

const MOBILE_TABS = [
  { name: "index", key: "discover", title: "Discover" },
  { name: "studio", key: "studio", title: "Studio" },
  { name: "tracker", key: "tracker", title: "Tracker" },
  { name: "career", key: "career", title: "Career" },
  { name: "profile", key: "profile", title: "Workspace" },
] as const;

function HeaderActions() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  const wallet = useMobileWalletSummaryQuery();
  const notifications = useMobileNotificationsQuery();
  if (!isAuthenticated) {
    return (
      <View style={{ marginRight: 12 }}>
        <Button testID="mobile-header-signin-btn" label="Sign In" onPress={() => router.push("/login")} />
      </View>
    );
  }
  const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;
  const balance = wallet.data ? `${Math.round(wallet.data.available_balance_vnd / 1000)}k` : "…";
  return (
    <View style={{ flexDirection: "row", gap: 8, marginRight: 12 }}>
      <Button
        testID="mobile-header-wallet-pill"
        label={`Ví ${balance}`}
        variant="inset"
        onPress={() => router.navigate("/career")}
      />
      <Button
        testID="mobile-header-notifications-btn"
        label={`Alerts (${unread})`}
        variant="secondary"
        onPress={() => router.navigate("/profile")}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: N.extrudedCard },
        headerTitle: () => (
          <Text testID="mobile-brand-header" style={{ fontWeight: "800", fontSize: 16, color: N.headingText }}>
            BELOOGA
          </Text>
        ),
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: N.primaryTeal,
        tabBarInactiveTintColor: N.bodyText,
        tabBarStyle: { backgroundColor: N.extrudedCard },
        tabBarIconStyle: { display: "none" },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        sceneStyle: { backgroundColor: N.canvas },
      }}
    >
      {MOBILE_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title, tabBarButtonTestID: `mobile-tab-${tab.key}` }}
        />
      ))}
    </Tabs>
  );
}
