"use client";

import * as React from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, normalizeAuthUser } from "@/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useAuthSessionBootstrap() {
  const { isHydrated, setAccessToken, setUser, setHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["auth-session-bootstrap"],
    enabled: !isHydrated,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh/`,
          {},
          { withCredentials: true }
        );
        const token = res.data?.access_token;
        const normalized = normalizeAuthUser(res.data?.user);
        if (token && normalized) {
          setUser(normalized);
          setAccessToken(token);
          return true;
        }
      } catch {
        // Unauthenticated visitor or expired refresh cookie
      }
      setHydrated(true);
      return false;
    },
  });
}

export function AuthSessionBootstrap() {
  useAuthSessionBootstrap();
  return null;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOwnerUsername?: string;
}

export function ProtectedRoute({ children, requireOwnerUsername }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const { isLoading } = useAuthSessionBootstrap();

  const normalizedTarget = requireOwnerUsername?.toLowerCase().trim();
  const isOwnerOrAdmin =
    !normalizedTarget ||
    (user && (user.username.toLowerCase() === normalizedTarget || user.role === "admin"));

  React.useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!isAuthenticated || !user) {
      const nextParam = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${nextParam}`);
      return;
    }
    if (!isOwnerOrAdmin && normalizedTarget) {
      router.replace(`/public/${normalizedTarget}`);
    }
  }, [isHydrated, isLoading, isAuthenticated, user, isOwnerOrAdmin, normalizedTarget, pathname, router]);

  if (!isHydrated || isLoading || !isAuthenticated || !user || !isOwnerOrAdmin) {
    return (
      <div
        data-testid="protected-route-guard"
        className="min-h-[60vh] flex items-center justify-center"
      >
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
