import { Platform } from "react-native";
import { normalizeMobileUser, readStoredRefreshToken, useMobileAuthStore } from "@/store/auth-store";
import { tokenResponseSchema } from "@/lib/schemas";

/**
 * Production builds must be given EXPO_PUBLIC_API_URL (inlined by Metro at bundle time).
 * Dev builds fall back to the host machine: 10.0.2.2 from the Android emulator, localhost elsewhere.
 */
export function resolveApiBaseUrl(
  configured: string | undefined,
  isDev: boolean,
  os: string
): string {
  const url = configured?.trim().replace(/\/+$/, "");
  if (url) return url;
  if (!isDev) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Production builds refuse to fall back to a localhost API."
    );
  }
  return os === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
}

export const MOBILE_API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
  __DEV__,
  Platform.OS
);

export class MobileApiError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "MobileApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface MobileRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON-serialisable value, or FormData for multipart uploads. */
  body?: unknown;
  headers?: Record<string, string>;
  skipAuthRefresh?: boolean;
}

let inflightRefreshPromise: Promise<string | null> | null = null;

async function parseErrorDetail(response: Response): Promise<string> {
  // Non-JSON error bodies resolve to null and fall through to the status line.
  const payload = (await response.json().catch(() => null)) as { detail?: unknown; message?: unknown } | null;
  if (typeof payload?.detail === "string" && payload.detail) return payload.detail;
  if (typeof payload?.message === "string" && payload.message) return payload.message;
  return `HTTP ${response.status}`;
}

/**
 * Exchanges the refresh token for a new access token. Concurrent callers share one request.
 * The stored session is cleared only when the server rejects the refresh token; a network
 * failure keeps it so the user is not logged out by a flaky connection.
 */
export function refreshMobileSession(): Promise<string | null> {
  if (inflightRefreshPromise) return inflightRefreshPromise;

  inflightRefreshPromise = (async () => {
    const { refreshToken, setSession, clearSession } = useMobileAuthStore.getState();
    if (!refreshToken) return null;

    let response: Response;
    try {
      response = await fetch(`${MOBILE_API_BASE_URL}/v1/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      return null;
    }

    if (!response.ok) {
      await clearSession();
      return null;
    }
    const parsed = tokenResponseSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) {
      await clearSession();
      return null;
    }
    await setSession(
      parsed.data.access_token,
      parsed.data.refresh_token ?? refreshToken,
      normalizeMobileUser(parsed.data.user)
    );
    return parsed.data.access_token;
  })().finally(() => {
    inflightRefreshPromise = null;
  });

  return inflightRefreshPromise;
}

/** App start: load the refresh token from SecureStore and trade it for an in-memory access token. */
export async function restoreMobileSession(): Promise<boolean> {
  const store = useMobileAuthStore.getState();
  const stored = await readStoredRefreshToken();
  if (stored) {
    useMobileAuthStore.setState({ refreshToken: stored });
    await refreshMobileSession();
  }
  store.markHydrated();
  return useMobileAuthStore.getState().isAuthenticated;
}

export async function mobileRequest<T>(path: string, options: MobileRequestOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${MOBILE_API_BASE_URL}${path}`;
  const isMultipart = typeof FormData !== "undefined" && options.body instanceof FormData;

  const execute = (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (!isMultipart) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined
          ? undefined
          : isMultipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  };

  let response = await execute(useMobileAuthStore.getState().accessToken);

  if (response.status === 401 && !options.skipAuthRefresh) {
    const newAccessToken = await refreshMobileSession();
    if (newAccessToken) {
      response = await execute(newAccessToken);
    }
  }

  if (!response.ok) {
    throw new MobileApiError(response.status, await parseErrorDetail(response));
  }
  if (response.status === 204) return undefined as T;

  const rawText = await response.text();
  return (rawText ? JSON.parse(rawText) : undefined) as T;
}

export const MOBILE_API_ENDPOINTS = {
  PAYMENTS_MOMO_CREATE_QR: "/v1/payments/momo/create-qr",
} as const;

export const mobileApiClient = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    mobileRequest<T>(path, { method: "GET", headers }),
  post: <T>(path: string, body?: unknown, skipAuthRefresh = false) =>
    mobileRequest<T>(path, { method: "POST", body, skipAuthRefresh }),
  put: <T>(path: string, body?: unknown) => mobileRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => mobileRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => mobileRequest<T>(path, { method: "DELETE" }),
};
