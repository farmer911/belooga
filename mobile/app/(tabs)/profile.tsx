import React, { useState } from "react";
import {
  ActionButton,
  BadgePill,
  mobileRouter,
  ScreenShell,
  SurfaceCard,
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

const DEFAULT_NOTIFICATIONS: MobileNotificationItemDTO[] = [
  {
    id: "notif_default_1",
    title: "Sarah Jenkins completed your Expert CV Review",
    message:
      "Line-by-line STAR rewrite ready for review. Inspect the detailed CV scorecard and release the $59 Escrow when satisfied.",
    is_read: false,
    created_at: "2 mins ago",
    category: "EXPERT_REVIEW",
    deep_link: "/(tabs)/career?sub=expert&order=ord_8841",
    action_label: "Xem Báo Cáo Chấm CV & Escrow",
    email_sent: true,
  },
  {
    id: "notif_default_2",
    title: "ATS Match Alert: 96% Match @ Anthropic",
    message:
      "Your persisted Career Goal (Staff Distributed Systems) matched Anthropic's opening with 96% ATS compatibility.",
    is_read: false,
    created_at: "14 mins ago",
    category: "JOB_MATCH",
    deep_link: "/(tabs)/tracker",
    action_label: "Mở Thẻ Công Việc Trong Kanban",
    email_sent: true,
  },
];

export default function MobileWorkspaceProfileScreen() {
  const tokens = getSemanticTokens("dark");
  const user = useMobileAuthStore((s) => s.user);
  const sessionQuery = useMobileSessionQuery();
  const notificationsQuery = useMobileNotificationsQuery();
  const updateProfileMutation = useUpdateMobileProfileMutation();
  const logoutMutation = useMobileLogoutMutation();

  const activeUser = sessionQuery.data ?? user;
  const [headlineDraft, setHeadlineDraft] = useState("Principal Distributed Systems Engineer");
  const notifications =
    (notificationsQuery.data && notificationsQuery.data.length > 0
      ? notificationsQuery.data
      : DEFAULT_NOTIFICATIONS);
  const [activeNotification, setActiveNotification] = useState<MobileNotificationItemDTO | null>(
    notifications[0] ?? null
  );
  const spotlightTarget = activeNotification
    ? resolveNotificationSpotlightTarget(activeNotification)
    : null;

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
              <div data-testid="mobile-workspace-notifications" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.map((notif) => (
                  <ActionButton
                    key={notif.id}
                    testID={`mobile-notification-item-${notif.id}`}
                    accessibilityLabel={`mobile-notification-item-${notif.id}`}
                    label={`${notif.title} (${notif.created_at || "Just now"})`}
                    variant={activeNotification?.id === notif.id ? "primary" : "secondary"}
                    onPress={() => setActiveNotification(notif)}
                  />
                ))}
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

      {activeNotification && spotlightTarget ? (
        <SurfaceCard testID="mobile-notification-spotlight-drawer" mode="dark">
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
          <ActionButton
            testID="mobile-notification-spotlight-cta"
            accessibilityLabel="mobile-notification-spotlight-cta"
            label={spotlightTarget.actionLabel}
            onPress={() => mobileRouter.push(spotlightTarget.route)}
          />
        </SurfaceCard>
      ) : null}

      <UserPostsSection username={activeUser?.username ?? "alexnguyen"} isOwner />
    </ScreenShell>
  );
}

