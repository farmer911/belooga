import React, { useState } from "react";
import {
  BadgePill,
  mobileRouter,
  NeumorphicButton,
  NeumorphicCard,
  NeumorphicInput,
  ScreenShell,
} from "@/lib/native-runtime";
import { MobileNotificationItemDTO } from "@/lib/schemas";
import {
  markAllMobileNotificationsRead,
  resolveNotificationSpotlightTarget,
  useMobileLogoutMutation,
  useMobileNotificationsQuery,
  useMobileSessionQuery,
  useUpdateMobileProfileMutation,
} from "@/hooks/use-mobile-auth";
import { useMobileAuthStore } from "@/store/auth-store";
import { getSemanticTokens } from "@/theme/tokens";
import { UserPostsSection } from "@/components/user-posts-section";

export default function MobileWorkspaceProfileScreen() {
  const tokens = getSemanticTokens("neumorphic");
  const user = useMobileAuthStore((s) => s.user);
  const sessionQuery = useMobileSessionQuery();
  const notificationsQuery = useMobileNotificationsQuery();
  const updateProfileMutation = useUpdateMobileProfileMutation();
  const logoutMutation = useMobileLogoutMutation();

  const activeUser = sessionQuery.data ?? user;
  const [headlineDraft, setHeadlineDraft] = useState("Principal Distributed Systems Engineer");
  const notifications = notificationsQuery.data ?? [];
  const [activeNotification, setActiveNotification] = useState<MobileNotificationItemDTO | null>(
    notifications[0] ?? null
  );
  const spotlightTarget = activeNotification
    ? resolveNotificationSpotlightTarget(activeNotification)
    : null;

  return (
    <ScreenShell testID="mobile-workspace-profile-screen" mode="neumorphic">
      <NeumorphicCard testID="mobile-workspace-user-card">
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
            <NeumorphicInput
              testID="mobile-workspace-headline-input"
              value={headlineDraft}
              onChange={(e) => setHeadlineDraft(e.target.value)}
              placeholder="Update headline..."
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <NeumorphicButton
                testID="mobile-workspace-save-profile"
                label={updateProfileMutation.isPending ? "Saving..." : "Save Headline"}
                onPress={() =>
                  updateProfileMutation.mutate({
                    username: activeUser.username,
                    payload: { headline: headlineDraft },
                  })
                }
              />
              <NeumorphicButton
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
              <div data-testid="mobile-workspace-notifications" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.map((notif) => (
                  <NeumorphicButton
                    key={notif.id}
                    testID={`mobile-notification-item-${notif.id}`}
                    accessibilityLabel={`mobile-notification-item-${notif.id}`}
                    label={`${notif.title} (${notif.created_at || "Just now"})`}
                    variant={activeNotification?.id === notif.id ? "primary" : "inset"}
                    onPress={() => setActiveNotification(notif)}
                  />
                ))}
                <NeumorphicButton
                  testID="mobile-workspace-mark-read"
                  label={`Mark ${notifications.length} Notifications Read`}
                  variant="secondary"
                  onPress={() => void markAllMobileNotificationsRead()}
                />
              </div>
            ) : null}
            <NeumorphicButton
              testID="mobile-workspace-logout"
              label={logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
              variant="danger"
              disabled={logoutMutation.isPending}
              onPress={() => logoutMutation.mutate()}
            />
          </>
        ) : (
          <NeumorphicButton
            testID="mobile-workspace-signin"
            label="Sign In to Candidate Vault"
            onPress={() => mobileRouter.replace("/(auth)/login")}
          />
        )}
      </NeumorphicCard>

      {activeNotification && spotlightTarget ? (
        <NeumorphicCard testID="mobile-notification-spotlight-drawer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <BadgePill label="RICH NOTIFICATION SPOTLIGHT" tone="brand" />
            <BadgePill label={spotlightTarget.emailStatus} tone="success" />
          </div>
          <h2
            data-testid="mobile-notification-spotlight-title"
            style={{ margin: 0, fontSize: 17, fontWeight: 700, color: tokens.typography.heading }}
          >
            {activeNotification.title}
          </h2>
          <p
            data-testid="mobile-notification-spotlight-message"
            style={{ margin: 0, fontSize: 14, color: tokens.typography.body, lineHeight: 1.5 }}
          >
            {activeNotification.message}
          </p>
          <NeumorphicButton
            testID="mobile-notification-spotlight-cta"
            accessibilityLabel="mobile-notification-spotlight-cta"
            label={spotlightTarget.actionLabel}
            onPress={() => mobileRouter.push(spotlightTarget.route)}
          />
        </NeumorphicCard>
      ) : null}

      <UserPostsSection username={activeUser?.username ?? "alexnguyen"} isOwner />
    </ScreenShell>
  );
}
