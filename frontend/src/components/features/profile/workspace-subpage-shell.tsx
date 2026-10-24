"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WorkspaceNavStrip } from "@/components/layout/workspace-nav-strip";

export const PROFILE_INPUT_CLS =
  "w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";

export function useProfileOwnerGuard(explicitUsername?: string) {
  const params = useParams();
  const router = useRouter();
  const username = explicitUsername ?? ((params?.username as string) || "");
  return { username, router };
}

export interface WorkspaceSubpageShellProps {
  username: string;
  badgeText: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function WorkspaceSubpageShell({
  username,
  badgeText,
  title,
  subtitle,
  children,
}: WorkspaceSubpageShellProps) {
  return (
    <div className="min-h-screen bg-surface-page pb-10">
      <WorkspaceNavStrip username={username} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/user/${username}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </Link>
          <span className="text-xs text-typography-muted">{badgeText}</span>
        </div>

        <div className="bg-surface-card rounded-xl border border-surface-border p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-typography-main">{title}</h1>
            <p className="text-sm text-typography-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
