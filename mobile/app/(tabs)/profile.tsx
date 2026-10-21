import React from "react";
import { ActionButton, mobileRouter, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import { useMobileLogoutMutation, useMobileSessionQuery } from "@/hooks/use-mobile-auth";
import { useMobileAuthStore } from "@/store/auth-store";

export default function MobileWorkspaceProfileScreen() {
  const user = useMobileAuthStore((s) => s.user);
  const sessionQuery = useMobileSessionQuery();
  const logoutMutation = useMobileLogoutMutation();

  const activeUser = sessionQuery.data ?? user;

  return (
    <ScreenShell testID="mobile-workspace-profile-screen" mode="dark">
      <SurfaceCard testID="mobile-workspace-user-card" mode="dark">
        <h1 data-testid="mobile-workspace-heading">Candidate Workspace</h1>
        {activeUser ? (
          <>
            <p data-testid="mobile-workspace-username">@{activeUser.username}</p>
            <p data-testid="mobile-workspace-email">{activeUser.email}</p>
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
            label="Sign In"
            onPress={() => mobileRouter.replace("/(auth)/login")}
          />
        )}
      </SurfaceCard>
    </ScreenShell>
  );
}
