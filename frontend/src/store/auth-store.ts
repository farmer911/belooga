import { create } from 'zustand';

export interface UserProfileSummary {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: 'candidate' | 'employer' | 'admin';
}

interface AuthState {
  accessToken: string | null;
  user: UserProfileSummary | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfileSummary | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export function normalizeAuthUser(raw: Record<string, unknown> | null | undefined): UserProfileSummary | null {
  if (!raw || typeof raw.username !== 'string') return null;
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    username: raw.username,
    firstName: String(raw.firstName ?? raw.first_name ?? raw.username),
    lastName: String(raw.lastName ?? raw.last_name ?? ''),
    avatarUrl: typeof (raw.avatarUrl ?? raw.avatar_url) === 'string' ? String(raw.avatarUrl ?? raw.avatar_url) : undefined,
    role: (raw.role as UserProfileSummary['role']) || 'candidate',
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: !!token,
      isHydrated: true,
    }),
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    }),
}));
