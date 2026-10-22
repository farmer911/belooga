import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import MobileRootLayout from "./app/_layout";
import MobileTabsLayout from "./app/(tabs)/_layout";
import MobileDiscoveryFeedScreen from "./app/(tabs)/index";
import MobilePitchStudioScreen from "./app/(tabs)/studio";
import MobileJobTrackerScreen from "./app/(tabs)/tracker";
import MobileCareerHubScreen from "./app/(tabs)/career";
import MobileWorkspaceProfileScreen from "./app/(tabs)/profile";
import MobileLoginScreen from "./app/(auth)/login";
import MobileRegisterScreen from "./app/(auth)/register";
import MobileCandidateProfileScreen from "./app/candidate/[username]";
import { mobileRouter } from "@/lib/native-runtime";
import { useMobileAuthStore } from "@/store/auth-store";

export function BeloogaMobileApp() {
  const [route, setRoute] = useState(() => mobileRouter.getState());

  useEffect(() => {
    void useMobileAuthStore.getState().hydrateFromSecureVault();
    return mobileRouter.subscribe(() => {
      setRoute(mobileRouter.getState());
    });
  }, []);

  const renderActiveScreen = () => {
    const path = route.currentPath;
    if (path === "/(auth)/login") return <MobileLoginScreen />;
    if (path === "/(auth)/register") return <MobileRegisterScreen />;
    if (path.startsWith("/candidate/")) {
      const username = route.params.username || path.replace("/candidate/", "");
      return <MobileCandidateProfileScreen username={username} />;
    }
    if (path === "/(tabs)/studio") {
      return (
        <MobileTabsLayout>
          <MobilePitchStudioScreen />
        </MobileTabsLayout>
      );
    }
    if (path === "/(tabs)/tracker") {
      return (
        <MobileTabsLayout>
          <MobileJobTrackerScreen />
        </MobileTabsLayout>
      );
    }
    if (path === "/(tabs)/career") {
      return (
        <MobileTabsLayout>
          <MobileCareerHubScreen />
        </MobileTabsLayout>
      );
    }
    if (path === "/(tabs)/profile") {
      return (
        <MobileTabsLayout>
          <MobileWorkspaceProfileScreen />
        </MobileTabsLayout>
      );
    }
    return (
      <MobileTabsLayout>
        <MobileDiscoveryFeedScreen />
      </MobileTabsLayout>
    );
  };

  return <MobileRootLayout>{renderActiveScreen()}</MobileRootLayout>;
}

if (typeof document !== "undefined") {
  const container = document.getElementById("root");
  if (container) {
    createRoot(container).render(<BeloogaMobileApp />);
  }
}
