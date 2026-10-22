import React, { useState } from "react";
import {
  ActionButton,
  BadgePill,
  mobileRouter,
  ScreenShell,
  SurfaceCard,
} from "@/lib/native-runtime";
import {
  markAllMobileNotificationsRead,
  useMobileLogoutMutation,
  useMobileNotificationsQuery,
  useMobileSessionQuery,
  useUpdateMobileProfileMutation,
} from "@/hooks/use-mobile-auth";
import { useMobileAuthStore } from "@/store/auth-store";
import { getSemanticTokens } from "@/theme/tokens";

export default function MobileWorkspaceProfileScreen() {
  const tokens = getSemanticTokens("dark");
  const user = useMobileAuthStore((s) => s.user);
  const sessionQuery = useMobileSessionQuery();
  const notificationsQuery = useMobileNotificationsQuery();
  const updateProfileMutation = useUpdateMobileProfileMutation();
  const logoutMutation = useMobileLogoutMutation();

  const activeUser = sessionQuery.data ?? user;
  const [headlineDraft, setHeadlineDraft] = useState("Principal Distributed Systems Engineer");
  const notifications = notificationsQuery.data ?? [];

  return (
    <ScreenShell testID="mobile-workspace-profile-screen" mode="dark">
      <SurfaceCard testID="mobile-workspace-user-card" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BadgePill label="VERIFIED CANDIDATE WORKSPACE" tone="brand" />
          <BadgePill label="VAULT ENCRYPTED" tone="success" />
        </div>
        <h1
          data-testid="mobile-workspace-heading"
          style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.typography.heading }}
        >
          Candidate Workspace
        </h1>
        {activeUser ? (
          <>
            <p
              data-testid="mobile-workspace-username"
              style={{ margin: 0, fontWeight: 700, color: tokens.brand.primary }}
            >
              @{activeUser.username} • Dual-Mode SecureStore Token Vault Active
            </p>
            <p
              data-testid="mobile-workspace-email"
              style={{ margin: 0, fontSize: 13, color: tokens.typography.body }}
            >
              {activeUser.email}
            </p>
            <input
              data-testid="mobile-workspace-headline-input"
              value={headlineDraft}
              onChange={(e) => setHeadlineDraft(e.target.value)}
              placeholder="Update headline..."
              style={{
                backgroundColor: tokens.surface.elevated,
                color: tokens.typography.main,
                border: `1px solid ${tokens.surface.border}`,
                borderRadius: 12,
                padding: "10px 12px",
              }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <ActionButton
                testID="mobile-workspace-save-profile"
                label={updateProfileMutation.isPending ? "Saving..." : "Save Headline"}
                onPress={() =>
                  updateProfileMutation.mutate({
                    username: activeUser.username,
                    payload: { headline: headlineDraft },
                  })
                }
              />
              <ActionButton
                testID="mobile-workspace-view-public"
                label="Preview Public Profile"
                variant="secondary"
                onPress={() =>
                  mobileRouter.push(`/candidate/${activeUser.username}`, {
                    username: activeUser.username,
                  })
                }
              />
            </div>
            {notifications.length > 0 ? (
              <div data-testid="mobile-workspace-notifications">
                <ActionButton
                  testID="mobile-workspace-mark-read"
                  label={`Mark ${notifications.length} Notifications Read`}
                  variant="secondary"
                  onPress={() => void markAllMobileNotificationsRead()}
                />
              </div>
            ) : null}
            <ActionButton
              testID="mobile-workspace-logout"
              label={logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
              variant="danger"
              disabled={logoutMutation.isPending}
              onPress={() => logoutMutation.mutate()}
            />
          </>
        ) : (
          <ActionButton
            testID="mobile-workspace-signin"
            label="Sign In to Candidate Vault"
            onPress={() => mobileRouter.replace("/(auth)/login")}
          />
        )}
      </SurfaceCard>
    </ScreenShell>
  );
}
