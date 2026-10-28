"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Edit3,
  Settings,
  Briefcase,
  BarChart3,
  Wallet,
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export interface WorkspaceNavStripProps {
  username?: string;
}

export function WorkspaceNavStrip({ username }: WorkspaceNavStripProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const resolvedUsername = username || user?.username;
  const baseUserPath = `/user/${resolvedUsername}`;

  // Profile-bound links only exist for a known user; never fall back to a demo identity.
  const profileItems = resolvedUsername ? [
    {
      href: baseUserPath,
      label: "Workspace Hub",
      icon: User,
      exact: true,
    },
    {
      href: `${baseUserPath}/update`,
      label: "Edit Profile",
      icon: Edit3,
    },
    {
      href: `${baseUserPath}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ] : [];

  const navItems = [
    ...profileItems,
    {
      href: "/workspace/jobs",
      label: "Job Tracker",
      icon: Briefcase,
    },
    {
      href: "/workspace/analytics",
      label: "Growth & Analytics",
      icon: BarChart3,
    },
    {
      href: "/workspace/wallet",
      label: "Wallet & Escrow",
      icon: Wallet,
    },
    {
      href: "/cv-studio",
      label: "CV Studio",
      icon: FileText,
    },
  ];

  return (
    <nav
      aria-label="Candidate Workspace Navigation"
      data-testid="workspace-nav-strip"
      className="bg-surface-card border-b border-surface-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-brand-primary text-white shadow-xs"
                  : "text-typography-body hover:text-brand-primary hover:bg-surface-hover"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
