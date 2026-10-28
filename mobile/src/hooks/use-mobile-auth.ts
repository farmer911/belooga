import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  LoginFormValues,
  loginSchema,
  MobileNotificationItemDTO,
  mobileNotificationItemSchema,
  RegisterFormValues,
  registerSchema,
  tokenResponseSchema,
  userProfileDtoSchema,
} from "@/lib/schemas";
import { mobileApiClient } from "@/services/api-client";
import {
  MobileUserSummary,
  normalizeMobileUser,
  useMobileAuthStore,
} from "@/store/auth-store";

export const MOBILE_AUTH_QUERY_KEY = ["mobile", "auth", "me"] as const;

export async function loginMobileUser(input: LoginFormValues): Promise<MobileUserSummary> {
  const validated = loginSchema.parse(input);
  const raw = await mobileApiClient.post<unknown>("/v1/auth/login/", validated, true);
  const parsed = tokenResponseSchema.parse(raw);
  const userSummary = normalizeMobileUser(parsed.user);
  if (!userSummary) {
    throw new Error("Invalid user profile payload returned from login");
  }
  await useMobileAuthStore
    .getState()
    .setSession(parsed.access_token, parsed.refresh_token, userSummary);
  return userSummary;
}

export async function registerMobileUser(input: RegisterFormValues): Promise<MobileUserSummary> {
  const validated = registerSchema.parse(input);
  const raw = await mobileApiClient.post<unknown>(
    "/v1/users/register/",
    {
      email: validated.email,
      username: validated.username,
      password: validated.password,
      first_name: validated.firstName,
      last_name: validated.lastName,
    },
    true
  );
  const parsed = tokenResponseSchema.parse(raw);
  const userSummary = normalizeMobileUser(parsed.user);
  if (!userSummary) {
    throw new Error("Invalid user profile payload returned from registration");
  }
  await useMobileAuthStore
    .getState()
    .setSession(parsed.access_token, parsed.refresh_token, userSummary);
  return userSummary;
}

export async function logoutMobileUser(): Promise<void> {
  const { refreshToken, clearSession } = useMobileAuthStore.getState();
  try {
    if (refreshToken) {
      await mobileApiClient.post<Record<string, string>>(
        "/v1/auth/logout/",
        { refresh_token: refreshToken },
        true
      );
    }
  } finally {
    await clearSession();
  }
}

export async function fetchCurrentMobileSession(): Promise<MobileUserSummary> {
  const raw = await mobileApiClient.get<unknown>("/v1/auth/me/");
  const parsed = userProfileDtoSchema.parse(raw);
  const summary = normalizeMobileUser(parsed);
  if (!summary) {
    throw new Error("Unable to normalize session user profile");
  }
  useMobileAuthStore.getState().setUser(summary);
  return summary;
}

export function useMobileSessionQuery() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: MOBILE_AUTH_QUERY_KEY,
    queryFn: fetchCurrentMobileSession,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useMobileLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginMobileUser,
    onSuccess: (user) => {
      queryClient.setQueryData(MOBILE_AUTH_QUERY_KEY, user);
    },
  });
}

export function useMobileRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerMobileUser,
    onSuccess: (user) => {
      queryClient.setQueryData(MOBILE_AUTH_QUERY_KEY, user);
    },
  });
}

export function useMobileLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutMobileUser,
    // Drop every cached response that belonged to the signed-out user (keep the app-start session gate).
    onSettled: () => queryClient.removeQueries({ predicate: (q) => q.queryKey[1] !== "session" }),
  });
}

export async function updateMobileCandidateProfile(
  username: string,
  payload: { first_name?: string; last_name?: string; headline?: string; location?: string; bio?: string }
): Promise<Record<string, unknown>> {
  return mobileApiClient.patch<Record<string, unknown>>(
    `/v1/profile/${encodeURIComponent(username.trim())}`,
    payload
  );
}

export async function fetchMobileNotifications(): Promise<MobileNotificationItemDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/notifications/");
  if (Array.isArray(raw)) {
    return z.array(mobileNotificationItemSchema).parse(raw);
  }
  const wrapped = raw as { items?: unknown };
  return z.array(mobileNotificationItemSchema).parse(wrapped.items ?? []);
}

export async function markAllMobileNotificationsRead(): Promise<void> {
  await mobileApiClient.post<unknown>("/v1/notifications/read-all/", {});
}

export interface NotificationSpotlightTarget {
  route: string;
  actionLabel: string;
  emailStatus: string;
}

export function resolveNotificationSpotlightTarget(
  notification: Partial<MobileNotificationItemDTO> & { title: string; message: string }
): NotificationSpotlightTarget {
  const emailStatus =
    notification.email_sent === false
      ? "Email Pending"
      : "Email Deep-link Dispatched";
  if (notification.deep_link?.trim()) {
    const cleanRoute = notification.deep_link.trim().split("?")[0] || "/(tabs)";
    return {
      route: cleanRoute,
      actionLabel: notification.action_label?.trim() || "Open Linked Item",
      emailStatus,
    };
  }
  const combined = `${notification.title} ${notification.message} ${notification.category ?? ""}`.toLowerCase();
  if (combined.includes("expert") || combined.includes("escrow") || combined.includes("review")) {
    return {
      route: "/(tabs)/career",
      actionLabel: notification.action_label?.trim() || "View Expert Review & Escrow",
      emailStatus,
    };
  }
  if (combined.includes("ats") || combined.includes("match") || combined.includes("job") || combined.includes("interview")) {
    return {
      route: "/(tabs)/tracker",
      actionLabel: notification.action_label?.trim() || "Open Job Kanban Card",
      emailStatus,
    };
  }
  return {
    route: "/(tabs)/studio",
    actionLabel: notification.action_label?.trim() || "Open Pitch Studio",
    emailStatus,
  };
}


export const MOBILE_NOTIFICATIONS_QUERY_KEY = ["mobile", "notifications"] as const;

export function useMarkAllMobileNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllMobileNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MOBILE_NOTIFICATIONS_QUERY_KEY }),
  });
}

export function useMobileNotificationsQuery() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: MOBILE_NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchMobileNotifications,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useUpdateMobileProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      username,
      payload,
    }: {
      username: string;
      payload: { first_name?: string; last_name?: string; headline?: string; location?: string; bio?: string };
    }) => updateMobileCandidateProfile(username, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_AUTH_QUERY_KEY });
    },
  });
}
