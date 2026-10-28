import React, { useState } from "react";
import { router, type Href } from "expo-router";
import { UserPostsSection } from "@/components/user-posts-section";
import {
  resolveNotificationSpotlightTarget,
  useMarkAllMobileNotificationsReadMutation,
  useMobileLogoutMutation,
  useMobileNotificationsQuery,
  useMobileSessionQuery,
  useUpdateMobileProfileMutation,
} from "@/hooks/use-mobile-auth";
import type { MobileNotificationItemDTO } from "@/lib/schemas";
import { Body, Button, Card, ErrorText, Field, H1, H2, Pill, Row, Screen } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

export default function WorkspaceProfileScreen() {
  const storedUser = useMobileAuthStore((s) => s.user);
  const sessionQuery = useMobileSessionQuery();
  const notificationsQuery = useMobileNotificationsQuery();
  const markReadMutation = useMarkAllMobileNotificationsReadMutation();
  const updateProfileMutation = useUpdateMobileProfileMutation();
  const logoutMutation = useMobileLogoutMutation();
  const [headlineDraft, setHeadlineDraft] = useState("");
  const [activeNotification, setActiveNotification] = useState<MobileNotificationItemDTO | null>(null);

  const activeUser = sessionQuery.data ?? storedUser;
  const notifications = notificationsQuery.data ?? [];
  const spotlight = activeNotification ? resolveNotificationSpotlightTarget(activeNotification) : null;

  if (!activeUser) {
    return (
      <Screen testID="mobile-workspace-profile-screen">
        <Card testID="mobile-workspace-user-card">
          <H1 testID="mobile-workspace-heading">Candidate Workspace</H1>
          <Button testID="mobile-workspace-signin" label="Sign In" onPress={() => router.push("/login")} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen testID="mobile-workspace-profile-screen">
      <Card testID="mobile-workspace-user-card">
        <H1 testID="mobile-workspace-heading">Candidate Workspace</H1>
        <Body testID="mobile-workspace-username" tone="brand">
          @{activeUser.username}
        </Body>
        <Body testID="mobile-workspace-email">{activeUser.email}</Body>
        <Field
          testID="mobile-workspace-headline-input"
          value={headlineDraft}
          onChangeText={setHeadlineDraft}
          placeholder="Update headline..."
        />
        <Row>
          <Button
            testID="mobile-workspace-save-profile"
            label={updateProfileMutation.isPending ? "Saving..." : "Save Headline"}
            disabled={!headlineDraft.trim() || updateProfileMutation.isPending}
            onPress={() =>
              updateProfileMutation.mutate({ username: activeUser.username, payload: { headline: headlineDraft.trim() } })
            }
          />
          <Button
            testID="mobile-workspace-view-public"
            label="Preview Public Profile"
            variant="secondary"
            onPress={() => router.push({ pathname: "/candidate/[username]", params: { username: activeUser.username } })}
          />
        </Row>
        <ErrorText error={updateProfileMutation.error} />
        {notifications.length > 0 ? (
          <>
            <H2>Notifications</H2>
            {notifications.map((notif) => (
              <Button
                key={notif.id}
                testID={`mobile-notification-item-${notif.id}`}
                label={`${notif.is_read ? "" : "• "}${notif.title}`}
                variant={activeNotification?.id === notif.id ? "primary" : "inset"}
                onPress={() => setActiveNotification(notif)}
              />
            ))}
            <Button
              testID="mobile-workspace-mark-read"
              label={`Mark ${notifications.length} Notifications Read`}
              variant="secondary"
              disabled={markReadMutation.isPending}
              onPress={() => markReadMutation.mutate()}
            />
          </>
        ) : null}
        <Button
          testID="mobile-workspace-logout"
          label={logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
          variant="danger"
          disabled={logoutMutation.isPending}
          onPress={() => logoutMutation.mutate(undefined, { onSettled: () => router.replace("/") })}
        />
      </Card>

      {activeNotification && spotlight ? (
        <Card testID="mobile-notification-spotlight-drawer">
          <Pill label={spotlight.emailStatus} tone="success" />
          <H2 testID="mobile-notification-spotlight-title">{activeNotification.title}</H2>
          <Body testID="mobile-notification-spotlight-message">{activeNotification.message}</Body>
          <Button
            testID="mobile-notification-spotlight-cta"
            label={spotlight.actionLabel}
            onPress={() => router.push(spotlight.route as Href)}
          />
        </Card>
      ) : null}

      <UserPostsSection username={activeUser.username} isOwner />
    </Screen>
  );
}
