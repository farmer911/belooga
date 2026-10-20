"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, MailCheck } from "lucide-react";
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
    </div>
  );
}
