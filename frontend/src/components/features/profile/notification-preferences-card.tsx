"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, MailCheck, ShieldCheck, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/api-client";

interface NotificationPreferenceDTO {
  email_security_alerts: boolean;
  email_order_updates: boolean;
  email_career_matches: boolean;
  in_app_enabled: boolean;
}

const PREF_ITEMS: Array<{
  key: keyof NotificationPreferenceDTO;
  label: string;
  description: string;
}> = [
  {
    key: "email_security_alerts",
    label: "Security & Password Recovery Emails",
    description: "Receive transactional email deep-links for password resets and session rotation.",
  },
  {
    key: "email_order_updates",
    label: "Expert CV Review & Order Receipts",
    description: "Receive email deep-links when your CV review order is created, paid, or reviewed.",
  },
  {
    key: "email_career_matches",
    label: "Job Kanban Interview & Career Alerts",
    description: "Get notified with direct deep-links when applications reach Interview or Offer stage.",
  },
  {
    key: "in_app_enabled",
    label: "In-App Header Bell Notifications",
    description: "Display real-time unread badges and deep-link alerts in the navigation bar.",
  },
];

export function NotificationPreferencesCard() {
  const queryClient = useQueryClient();
  const [verifyToken, setVerifyToken] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const requestVerifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ message: string; verification_token?: string | null }>(
        "/v1/auth/verify-email/request/"
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.verification_token) setVerifyToken(data.verification_token);
    },
  });

  const confirmVerifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ message: string }>("/v1/auth/verify-email/", {
        token: verifyToken.trim(),
      });
      return res.data;
    },
    onSuccess: () => setEmailVerified(true),
  });

  const { data: prefs } = useQuery<NotificationPreferenceDTO>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await apiClient.get<NotificationPreferenceDTO>("/v1/notifications/preferences/");
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<NotificationPreferenceDTO>) => {
      const res = await apiClient.patch<NotificationPreferenceDTO>("/v1/notifications/preferences/", patch);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["notification-preferences"], updated);
    },
  });

  const currentPrefs: NotificationPreferenceDTO = prefs ?? {
    email_security_alerts: true,
    email_order_updates: true,
    email_career_matches: true,
    in_app_enabled: true,
  };

  return (
    <div
      data-testid="settings-notification-prefs"
      className="pt-8 border-t border-surface-divider space-y-4"
    >
      <div className="space-y-1">
        <h3 className="text-base font-bold text-typography-main flex items-center gap-2">
          <BellRing className="w-4 h-4 text-brand-primary" /> Notification & Email Deep-Link Preferences
        </h3>
        <p className="text-xs text-typography-muted">
          Control which transactional emails and in-app deep-link alerts you receive.
        </p>
      </div>

      <div className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-page/40">
        {PREF_ITEMS.map((item) => {
          const checked = currentPrefs[item.key];
          return (
            <label
              key={item.key}
              className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-surface-page transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-typography-main flex items-center gap-1.5">
                  <MailCheck className="w-3.5 h-3.5 text-brand-primary" />
                  {item.label}
                </span>
                <p className="text-[11px] text-typography-muted">{item.description}</p>
              </div>
              <input
                type="checkbox"
                data-testid={`pref-toggle-${item.key}`}
                checked={checked}
                disabled={updateMutation.isPending}
                onChange={(e) => updateMutation.mutate({ [item.key]: e.target.checked })}
                className="h-4 w-4 rounded border-surface-border text-brand-primary focus:ring-brand-primary cursor-pointer"
              />
            </label>
          );
        })}
      </div>

      <div
        data-testid="settings-email-verification"
        className="p-4 rounded-xl border border-surface-border bg-surface-page/40 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-typography-main flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-primary" /> Email Address Verification
            </h4>
            <p className="text-[11px] text-typography-muted">
              Verify your account email with a single-use token to unlock Verified Candidate status.
            </p>
          </div>
          <button
            type="button"
            data-testid="request-email-verify-btn"
            disabled={requestVerifyMutation.isPending || emailVerified}
            onClick={() => requestVerifyMutation.mutate()}
            className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {emailVerified ? "Verified" : requestVerifyMutation.isPending ? "Sending..." : "Send Verification Code"}
          </button>
        </div>

        {emailVerified ? (
          <div
            data-testid="email-verified-badge"
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Email verified successfully!
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              data-testid="verify-email-token-input"
              placeholder="Paste email verification token..."
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-surface-border rounded-lg text-xs bg-surface-card"
            />
            <button
              type="button"
              data-testid="confirm-email-verify-btn"
              disabled={!verifyToken.trim() || confirmVerifyMutation.isPending}
              onClick={() => confirmVerifyMutation.mutate()}
              className="px-3 py-1.5 rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-primary/10 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Verify Token
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
