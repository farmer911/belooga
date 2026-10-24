"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export const OAUTH_PROVIDERS = ["Google", "LinkedIn", "Facebook"] as const;

export function buildOAuthCallbackUrl(
  provider: string,
  emailValue: string,
  includeReturnTo: boolean = false
): string {
  const slug = provider.toLowerCase();
  const nextParam =
    includeReturnTo && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") ||
        sessionStorage.getItem("belooga_return_to")
      : null;
  const emailParam = encodeURIComponent(emailValue.trim() || "alex@belooga.com");
  const nextQuery = nextParam ? `&next=${encodeURIComponent(nextParam)}` : "";
  return `/callback?provider=${slug}&code=oauth_${slug}_code&email=${emailParam}${nextQuery}`;
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
