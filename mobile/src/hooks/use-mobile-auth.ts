import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LoginFormValues,
  loginSchema,
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
import { mobileRouter } from "@/lib/native-runtime";

export const MOBILE_AUTH_QUERY_KEY = ["mobile", "auth", "me"] as const;

export async function loginMobileUser(input: LoginFormValues): Promise<MobileUserSummary> {
  const validated = loginSchema.parse(input);
  const raw = await mobileApiClient.post<unknown>("/v1/auth/login/", validated, true);
  const parsed = tokenResponseSchema.parse(raw);
  const userSummary = normalizeMobileUser(parsed.user as unknown as Record<string, unknown>);
  if (!userSummary) {
    throw new Error("Invalid user profile payload returned from login");
  }
  await useMobileAuthStore
    .getState()
    .setSessionTokens(parsed.access_token, parsed.refresh_token, userSummary);
  mobileRouter.replace("/(tabs)");
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
  const userSummary = normalizeMobileUser(parsed.user as unknown as Record<string, unknown>);
  if (!userSummary) {
    throw new Error("Invalid user profile payload returned from registration");
  }
  await useMobileAuthStore
    .getState()
    .setSessionTokens(parsed.access_token, parsed.refresh_token, userSummary);
  mobileRouter.replace("/(tabs)");
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
    mobileRouter.replace("/(auth)/login");
  }
}

export async function fetchCurrentMobileSession(): Promise<MobileUserSummary> {
  const raw = await mobileApiClient.get<unknown>("/v1/auth/me/");
  const parsed = userProfileDtoSchema.parse(raw);
  const summary = normalizeMobileUser(parsed as unknown as Record<string, unknown>);
  if (!summary) {
    throw new Error("Unable to normalize session user profile");
  }
  await useMobileAuthStore.getState().setUser(summary);
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
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: MOBILE_AUTH_QUERY_KEY });
    },
  });
}
