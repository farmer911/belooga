"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const OAUTH_STATE_KEY = "belooga_oauth_state";

/** Redirects to Google's consent screen; /callback verifies `state` and sends the code to the backend. */
export function startGoogleSignIn(includeReturnTo: boolean = false): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  const next = includeReturnTo ? new URLSearchParams(window.location.search).get("next") : null;
  if (next) sessionStorage.setItem("belooga_return_to", next);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

export function GoogleSignInButton({ testId, includeReturnTo = false }: { testId: string; includeReturnTo?: boolean }) {
  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => startGoogleSignIn(includeReturnTo)}
      className="w-full flex items-center justify-center py-2.5 px-4 border border-surface-border bg-surface-card rounded-lg text-xs font-semibold text-typography-heading hover:bg-surface-page transition-colors cursor-pointer"
    >
      Continue with Google
    </button>
  );
}

export interface AuthSplitShellProps {
  title: string;
  subtitle: string;
  errorMessage: string | null;
  heroAlt: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  children: React.ReactNode;
}

export function AuthSplitShell({
  title,
  subtitle,
  errorMessage,
  heroAlt,
  heroBadge,
  heroTitle,
  heroDescription,
  children,
}: AuthSplitShellProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-surface-page">
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-typography-main tracking-tight">{title}</h1>
            <p className="text-sm text-typography-muted">{subtitle}</p>
          </div>

          {errorMessage && (
            <div
              data-testid="auth-error-banner"
              className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {children}
        </div>
      </div>

      <div className="hidden lg:relative lg:flex flex-col justify-end p-12 bg-slate-900 overflow-hidden">
        <img
          src="/images/home/matt-poster.png"
          alt={heroAlt}
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-brand-overlay opacity-25 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 max-w-lg text-white space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/40 text-brand-accent text-xs font-semibold uppercase tracking-wider">
            {heroBadge}
          </div>
          <h2 className="text-3xl font-extrabold leading-snug">{heroTitle}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{heroDescription}</p>
        </div>
      </div>
    </div>
  );
}
