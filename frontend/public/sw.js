/**
 * Belooga Production Service Worker (BEL-517)
 *
 * Capabilities:
 * 1. Static Asset Cache-First (`belooga-static-v1`) with strict HTTP 206 Range / Video stream bypass.
 * 2. Public Read API Stale-While-Revalidate (`belooga-api-swr-v1`) with strict Auth / PII bypass.
 * 3. Offline Mutation Outbox (`QUEUE_OFFLINE_MUTATION` / `FLUSH_OUTBOX` / Background Sync) for CV Studio & Workspace.
 * 4. Native Web Push & Deep-Link Notification Routing (`push` & `notificationclick`).
 * 5. Instant Cache Purge Bridge (`INVALIDATE_API_CACHE` on logout/mutation).
 */

const STATIC_CACHE = "belooga-static-v1";
const API_SWR_CACHE = "belooga-api-swr-v1";

const PRECACHE_ASSETS = [
  "/images/logo.svg",
  "/images/logo-big.png",
  "/images/avatar.jpg",
  "/manifest.webmanifest",
];

const PUBLIC_SWR_API_PATTERNS = [
  "/v1/catalogs/",
  "/v1/blog/posts",
  "/v1/faqs",
  "/v1/careers/jobs",
  "/v1/profile/search/trending",
  "/v1/match/market-pulse",
];

/** In-memory offline mutation outbox queued while client is disconnected */
const offlineOutbox = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== API_SWR_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isBypassedRequest(request, url) {
  if (request.method !== "GET") return true;
  if (request.headers.get("Authorization")) return true;
  if (request.headers.get("Range")) return true;
  if (url.pathname.endsWith(".mp4") || url.pathname.endsWith(".webm")) return true;
  if (url.pathname.startsWith("/_next/webpack-hmr")) return true;
  if (
    url.pathname.includes("/v1/auth/") ||
    url.pathname.includes("/v1/payments/") ||
    url.pathname.includes("/v1/notifications")
  ) {
    return true;
  }
  return false;
}

function isPublicSwrApi(url) {
  return PUBLIC_SWR_API_PATTERNS.some((pattern) => url.pathname.includes(pattern));
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isBypassedRequest(request, url)) {
    return;
  }

  // 1. Stale-While-Revalidate (SWR) for Public Read-Only APIs
  if (isPublicSwrApi(url)) {
    event.respondWith(
      caches.open(API_SWR_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const networkPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkPromise;
      })
    );
    return;
  }

  // 2. Cache-First for Static Assets & Images (strictly excluding 206 Partial Content)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.status === 200 && response.type === "basic") {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          return cached || Response.error();
        }
      })
    );
  }
});

async function flushOfflineOutbox() {
  if (offlineOutbox.length === 0) return { synced: 0, remaining: 0 };
  let synced = 0;
  const remainingQueue = [];

  while (offlineOutbox.length > 0) {
    const item = offlineOutbox.shift();
    try {
      const res = await fetch(item.url, {
        method: item.method || "PUT",
        headers: item.headers || { "Content-Type": "application/json" },
        body: typeof item.body === "string" ? item.body : JSON.stringify(item.body),
      });
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        synced += 1;
      } else {
        remainingQueue.push(item);
      }
    } catch (_err) {
      remainingQueue.push(item);
    }
  }

  offlineOutbox.push(...remainingQueue);
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage({
      type: "OUTBOX_SYNC_STATUS",
      synced,
      remaining: offlineOutbox.length,
    });
  }
  return { synced, remaining: offlineOutbox.length };
}

self.addEventListener("sync", (event) => {
  if (event.tag === "belooga-outbox-sync") {
    event.waitUntil(flushOfflineOutbox());
  }
});

self.addEventListener("message", (event) => {
  if (event.origin && event.origin !== self.location.origin) {
    return;
  }
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "INVALIDATE_API_CACHE") {
    event.waitUntil(caches.delete(API_SWR_CACHE));
    return;
  }

  if (data.type === "QUEUE_OFFLINE_MUTATION" && data.payload) {
    offlineOutbox.push({
      id: data.payload.id || `mut_${Date.now()}`,
      url: data.payload.url,
      method: data.payload.method || "PUT",
      headers: data.payload.headers || { "Content-Type": "application/json" },
      body: data.payload.body,
      queuedAt: Date.now(),
    });
    if (event.source) {
      event.source.postMessage({
        type: "OUTBOX_QUEUED",
        remaining: offlineOutbox.length,
      });
    }
    return;
  }

  if (data.type === "FLUSH_OUTBOX") {
    event.waitUntil(flushOfflineOutbox());
    return;
  }

  if (data.type === "SHOW_NOTIFICATION" && self.registration) {
    const title = data.title || "Belooga Notification";
    const options = {
      body: data.body || "",
      icon: "/images/logo-big.png",
      badge: "/images/logo.svg",
      tag: data.tag || "belooga-alert",
      data: { deepLink: data.deepLink || "/" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Belooga Career Update",
    body: "You have a new career notification.",
    deepLink: "/",
  };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (_e) {
      payload.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/images/logo-big.png",
      badge: "/images/logo.svg",
      data: { deepLink: payload.deepLink || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.deepLink) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.focus();
          client.postMessage({ type: "NAVIGATE_DEEP_LINK", deepLink: targetUrl });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
