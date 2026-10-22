"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";

interface OAuthTokenResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: "candidate" | "employer" | "admin";
    avatar_url?: string;
  };
}

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = (searchParams.get("provider") || "google").toLowerCase();
  const code = searchParams.get("code") || `oauth_${provider}_code`;
  const email = searchParams.get("email") || "alex@belooga.com";
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const { data, isError } = useQuery<OAuthTokenResponse>({
    queryKey: ["oauth-callback", provider, code, email],
    queryFn: async () => {
      const res = await apiClient.post<OAuthTokenResponse>("/v1/auth/oauth/callback/", {
        provider,
        code,
        email,
      });
      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setAccessToken(data.access_token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
        avatarUrl: data.user.avatar_url,
      });
      router.push(`/user/${data.user.username}`);
    } else if (isError) {
      router.push("/login");
    }
  }, [data, isError, router, setAccessToken, setUser]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4" data-testid="oauth-callback-status">
      {data ? (
        <ShieldCheck className="w-10 h-10 text-emerald-600" />
      ) : (
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      )}
      <h2 className="text-lg font-bold text-typography-main">Completing Authentication Handshake...</h2>
      <p className="text-xs text-typography-muted">
        Verifying your {provider} identity and linking social account session.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Verifying session...</div>}>
      <OAuthCallbackHandler />
    </Suspense>
  );
}
