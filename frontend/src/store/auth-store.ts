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
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfileSummary | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: !!token,
    }),
  setUser: (user) => set({ user }),
  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    }),
}));
