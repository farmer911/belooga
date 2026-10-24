"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export interface OfflineMutationPayload {
  id?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body: unknown;
}

export function postToServiceWorker(message: Record<string, unknown>): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }
  const controller = navigator.serviceWorker.controller;
  if (!controller) return false;
  controller.postMessage(message);
  return true;
}

export function queueOfflineMutation(payload: OfflineMutationPayload): boolean {
  return postToServiceWorker({
    type: "QUEUE_OFFLINE_MUTATION",
    payload,
  });
}

export function invalidateServiceWorkerApiCache(): boolean {
  return postToServiceWorker({ type: "INVALIDATE_API_CACHE" });
}

export async function triggerDesktopNotification(
  title: string,
  body: string,
  deepLink: string = "/"
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return false;
  }
  const sentViaSw = postToServiceWorker({
    type: "SHOW_NOTIFICATION",
    title,
    body,
    deepLink,
    tag: `belooga_${Date.now()}`,
  });
  if (!sentViaSw && "serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && "showNotification" in reg) {
      await reg.showNotification(title, {
        body,
        icon: "/images/logo-big.png",
        data: { deepLink },
      });
      return true;
    }
  }
  return sentViaSw;
}

export function ServiceWorkerProvider() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [swStatus, setSwStatus] = useState<"idle" | "registered" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => {
          setSwStatus("registered");
          document.documentElement.setAttribute("data-sw-status", "registered");
        })
        .catch(() => {
          setSwStatus("error");
          document.documentElement.setAttribute("data-sw-status", "error");
        });

      const handleSwMessage = (event: MessageEvent) => {
        const data = event.data || {};
        if (data.type === "NAVIGATE_DEEP_LINK" && typeof data.deepLink === "string") {
          router.push(data.deepLink);
        } else if (data.type === "OUTBOX_QUEUED") {
          setQueuedCount(Number(data.remaining || 1));
        } else if (data.type === "OUTBOX_SYNC_STATUS") {
          const synced = Number(data.synced || 0);
          const remaining = Number(data.remaining || 0);
          setQueuedCount(remaining);
          if (synced > 0) {
            setSyncBanner(`Synced ${synced} offline change(s) to cloud`);
            setTimeout(() => setSyncBanner(null), 3500);
          }
        }
      };

      navigator.serviceWorker.addEventListener("message", handleSwMessage);

      const handleOnline = () => {
        setIsOnline(true);
        postToServiceWorker({ type: "FLUSH_OUTBOX" });
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [router]);

  if (isOnline && queuedCount === 0 && !syncBanner) {
    return null;
  }

  return (
    <div
      data-testid="sw-network-status-banner"
      data-sw-status={swStatus}
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-surface-border bg-surface-card px-4 py-2.5 text-xs font-semibold text-typography-main shadow-lg"
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 text-amber-500" />
          <span>
            Offline Mode — Static &amp; catalog caches active
            {queuedCount > 0 ? ` (${queuedCount} edit queued for auto-sync)` : ""}
          </span>
        </>
      ) : syncBanner ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{syncBanner}</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 animate-spin text-brand-primary" />
          <span>Syncing {queuedCount} queued offline change(s)...</span>
        </>
      )}
    </div>
  );
}
