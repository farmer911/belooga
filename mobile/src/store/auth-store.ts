import { create } from "zustand";
import { SecureStore } from "@/lib/native-runtime";

export const SECURE_ACCESS_TOKEN_KEY = "belooga.mobile.access_token";
export const SECURE_REFRESH_TOKEN_KEY = "belooga.mobile.refresh_token";
export const SECURE_USER_PROFILE_KEY = "belooga.mobile.user_profile";

export interface MobileUserSummary {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: "candidate" | "employer" | "admin";
}

export interface MobileAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: MobileUserSummary | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrateFromSecureVault: () => Promise<void>;
  setSessionTokens: (
    accessToken: string,
    refreshToken: string | null | undefined,
    user?: MobileUserSummary | null
  ) => Promise<void>;
  setUser: (user: MobileUserSummary | null) => Promise<void>;
  clearSession: () => Promise<void>;
}

export function normalizeMobileUser(
  raw: Record<string, unknown> | null | undefined
): MobileUserSummary | null {
  if (!raw || typeof raw.username !== "string") return null;
  const roleVal = raw.role;
  const role: MobileUserSummary["role"] =
    roleVal === "employer" || roleVal === "admin" ? roleVal : "candidate";
  const avatarCandidate = raw.avatarUrl ?? raw.avatar_url;
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    username: raw.username,
    firstName: String(raw.firstName ?? raw.first_name ?? raw.username),
    lastName: String(raw.lastName ?? raw.last_name ?? ""),
    avatarUrl: typeof avatarCandidate === "string" ? avatarCandidate : undefined,
    role,
  };
}

export const useMobileAuthStore = create<MobileAuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrateFromSecureVault: async () => {
    const [storedAccess, storedRefresh, storedUserJson] = await Promise.all([
      SecureStore.getItemAsync(SECURE_ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(SECURE_USER_PROFILE_KEY),
    ]);
    let parsedUser: MobileUserSummary | null = null;
    if (storedUserJson) {
      try {
        parsedUser = normalizeMobileUser(JSON.parse(storedUserJson) as Record<string, unknown>);
      } catch {
        parsedUser = null;
      }
    }
    set({
      accessToken: storedAccess,
      refreshToken: storedRefresh,
      user: parsedUser,
      isAuthenticated: Boolean(storedAccess),
      isHydrated: true,
    });
  },

  setSessionTokens: async (accessToken, refreshToken, nextUser) => {
    const resolvedRefresh = refreshToken ?? get().refreshToken;
    const resolvedUser = nextUser !== undefined ? nextUser : get().user;
    await SecureStore.setItemAsync(SECURE_ACCESS_TOKEN_KEY, accessToken);
    if (resolvedRefresh) {
      await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, resolvedRefresh);
    }
    if (resolvedUser) {
      await SecureStore.setItemAsync(SECURE_USER_PROFILE_KEY, JSON.stringify(resolvedUser));
    }
    set({
      accessToken,
      refreshToken: resolvedRefresh ?? null,
      user: resolvedUser ?? null,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  setUser: async (user) => {
    if (user) {
      await SecureStore.setItemAsync(SECURE_USER_PROFILE_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(SECURE_USER_PROFILE_KEY);
    }
    set({ user });
  },

  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(SECURE_USER_PROFILE_KEY),
    ]);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
}));
