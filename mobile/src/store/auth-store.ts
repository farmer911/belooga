import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

/** Only the refresh token is persisted (Keychain / Android Keystore). The access token lives in memory. */
export const SECURE_REFRESH_TOKEN_KEY = "belooga.mobile.refresh_token";

export interface MobileUserSummary {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: "candidate" | "employer" | "admin";
}

export interface MobileUserInput {
  id?: unknown;
  email?: unknown;
  username?: unknown;
  firstName?: unknown;
  first_name?: unknown;
  lastName?: unknown;
  last_name?: unknown;
  avatarUrl?: unknown;
  avatar_url?: unknown;
  role?: unknown;
}

export interface MobileAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: MobileUserSummary | null;
  isAuthenticated: boolean;
  /** True once the stored refresh token (if any) has been exchanged or discarded at startup. */
  isHydrated: boolean;
  setSession: (
    accessToken: string,
    refreshToken: string | null | undefined,
    user?: MobileUserSummary | null
  ) => Promise<void>;
  setUser: (user: MobileUserSummary | null) => void;
  markHydrated: () => void;
  clearSession: () => Promise<void>;
}

export function normalizeMobileUser(
  raw: MobileUserInput | Record<string, unknown> | null | undefined
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

export function readStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY);
}

export const useMobileAuthStore = create<MobileAuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setSession: async (accessToken, refreshToken, nextUser) => {
    const resolvedRefresh = refreshToken ?? get().refreshToken;
    if (refreshToken) {
      await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, refreshToken);
    }
    set({
      accessToken,
      refreshToken: resolvedRefresh,
      user: nextUser !== undefined ? nextUser : get().user,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  setUser: (user) => set({ user }),

  markHydrated: () => set({ isHydrated: true }),

  clearSession: async () => {
    await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
}));
