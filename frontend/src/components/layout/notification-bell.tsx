"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Mail, ExternalLink, BellRing, Sparkles, X, ArrowRight } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { triggerDesktopNotification } from "@/components/providers/service-worker-provider";

export interface NotificationDTO {
  id: string;
  event_type: string;
  title: string;
  message: string;
  deep_link: string;
  is_read: boolean;
  email_sent: boolean;
  email_deeplink_url?: string | null;
  created_at: string;
}

interface NotificationListResponse {
  unread_count: number;
  items: NotificationDTO[];
}

const SPOTLIGHT_STORAGE_KEY = "belooga_notification_spotlight";
const SPOTLIGHT_EVENT = "belooga:notification-spotlight";

export function NotificationSpotlightBanner() {
  const [spotlight, setSpotlight] = useState<NotificationDTO | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const raw = sessionStorage.getItem(SPOTLIGHT_STORAGE_KEY);
        setSpotlight(raw ? (JSON.parse(raw) as NotificationDTO) : null);
      } catch {
        setSpotlight(null);
      }
    };
    syncFromStorage();
    window.addEventListener(SPOTLIGHT_EVENT, syncFromStorage);
    return () => window.removeEventListener(SPOTLIGHT_EVENT, syncFromStorage);
  }, [pathname]);

  if (!spotlight) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.removeItem(SPOTLIGHT_STORAGE_KEY);
    } catch {
      setSpotlight(null);
      return;
    }
    setSpotlight(null);
  };

  const handleHighlightTarget = () => {
    const targetEl =
      document.querySelector('[data-testid^="expert-order-card-"]') ||
      document.querySelector('[data-testid="recruiter-shortlist-panel"]') ||
      document.querySelector("main");
    if (targetEl instanceof HTMLElement) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div
      data-testid="notification-spotlight-banner"
      className="border-b border-teal-200 bg-teal-50/90 dark:bg-surface-card dark:border-surface-border px-4 py-2.5 text-xs shadow-xs"
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <span className="p-1.5 rounded-lg bg-brand-primary text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-brand-dark uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-brand-overlay">
                {spotlight.event_type || "SYSTEM ALERT"}
              </span>
              <span data-testid="notification-spotlight-title" className="font-bold text-typography-main">
                {spotlight.title}
              </span>
              {spotlight.email_sent && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                  <Mail className="w-3 h-3" /> Email Deep-Link Verified
                </span>
              )}
            </div>
            <p data-testid="notification-spotlight-message" className="text-typography-heading text-[11px] mt-0.5">
              {spotlight.message}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="notification-spotlight-cta"
            onClick={handleHighlightTarget}
            className="px-2.5 py-1 rounded-md bg-brand-primary hover:bg-brand-hover text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Xem mục liên quan</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            data-testid="dismiss-notification-spotlight"
            aria-label="Dismiss notification context"
            onClick={handleDismiss}
            className="p-1 rounded-md text-typography-muted hover:text-typography-main hover:bg-surface-page cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;

    const handleOutsideEvent = (event: MouseEvent | PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsideEvent);
    document.addEventListener("mousedown", handleOutsideEvent);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideEvent);
      document.removeEventListener("mousedown", handleOutsideEvent);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const { data } = useQuery<NotificationListResponse>({
    queryKey: ["notifications"],
    queryFn: async () => (await apiClient.get<NotificationListResponse>("/v1/notifications/?limit=12")).data,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) =>
      (await apiClient.patch<NotificationDTO>(`/v1/notifications/${notificationId}/read/`, {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post<{ unread_count: number }>("/v1/notifications/read-all/", {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = data?.unread_count ?? 0;
  const items = data?.items ?? [];

  const handleSelectItem = (item: NotificationDTO) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    try {
      sessionStorage.setItem(SPOTLIGHT_STORAGE_KEY, JSON.stringify(item));
      window.dispatchEvent(new Event(SPOTLIGHT_EVENT));
    } catch {
      window.dispatchEvent(new Event(SPOTLIGHT_EVENT));
    }
    setOpen(false);
    if (item.deep_link && item.deep_link.startsWith("/")) {
      router.push(item.deep_link);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="notification-bell-btn"
        aria-label="Open notifications"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-surface-border bg-surface-card hover:bg-surface-page text-typography-heading hover:text-brand-primary transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="notification-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-surface-border bg-surface-card shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-page/50">
            <span className="text-xs font-bold uppercase tracking-wider text-typography-main">
              Notifications ({unreadCount} unread)
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-testid="notification-desktop-push-btn"
                onClick={() => {
                  const latest = items[0];
                  triggerDesktopNotification(
                    latest?.title || "Belooga Desktop Alerts Active",
                    latest?.message || "Service Worker push notifications are enabled for your career alerts.",
                    latest?.deep_link || "/workspace/jobs"
                  );
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-typography-muted hover:text-brand-primary cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" /> Push
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  data-testid="notification-read-all-btn"
                  onClick={() => markAllReadMutation.mutate()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-typography-muted">
                You are all caught up. No notifications yet.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`notification-item-${item.id}`}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-page flex items-start justify-between gap-3 cursor-pointer ${
                    item.is_read ? "opacity-75" : "bg-surface-page/40"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!item.is_read && <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />}
                      <p className="text-xs font-semibold text-typography-main truncate">{item.title}</p>
                    </div>
                    <p className="text-[11px] text-typography-muted line-clamp-2">{item.message}</p>
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-typography-muted">
                      {item.email_sent && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <Mail className="w-3 h-3" /> Email + Deep-Link sent
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-typography-muted shrink-0 mt-0.5" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
