import { normalizeMobileUser, useMobileAuthStore } from "@/store/auth-store";
import { tokenResponseSchema } from "@/lib/schemas";

export const MOBILE_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
  body?: unknown;
  headers?: Record<string, string>;
  skipAuthRefresh?: boolean;
}

export type FetchTransport = typeof fetch;

let customFetchTransport: FetchTransport | null = null;
let inflightRefreshPromise: Promise<string | null> | null = null;

export function setMobileFetchTransportForTesting(transport: FetchTransport | null): void {
  customFetchTransport = transport;
  inflightRefreshPromise = null;
}

function getTransport(): FetchTransport {
  return customFetchTransport ?? fetch;
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown; message?: unknown };
    if (typeof payload.detail === "string" && payload.detail) return payload.detail;
    if (typeof payload.message === "string" && payload.message) return payload.message;
  } catch {
    return `HTTP ${response.status}`;
  }
  return `HTTP ${response.status}`;
}

async function rotateMobileSessionSingleflight(): Promise<string | null> {
  if (inflightRefreshPromise) return inflightRefreshPromise;

  inflightRefreshPromise = (async () => {
    const { refreshToken, setSessionTokens, clearSession } = useMobileAuthStore.getState();
    if (!refreshToken) {
      await clearSession();
      return null;
    }

    try {
      const response = await getTransport()(`${MOBILE_API_BASE_URL}/v1/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Refresh-Token": refreshToken,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        await clearSession();
        return null;
      }

      const rawData = await response.json();
      const parsed = tokenResponseSchema.parse(rawData);
      const userSummary = normalizeMobileUser(parsed.user as unknown as Record<string, unknown>);
      await setSessionTokens(parsed.access_token, parsed.refresh_token ?? refreshToken, userSummary);
      return parsed.access_token;
    } catch {
      await clearSession();
      return null;
    } finally {
      inflightRefreshPromise = null;
    }
  })();

  return inflightRefreshPromise;
}

export async function mobileRequest<T>(
  path: string,
  options: MobileRequestOptions = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${MOBILE_API_BASE_URL}${path}`;
  const method = options.method ?? "GET";
  const token = useMobileAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const executeCall = async (overrideToken?: string): Promise<Response> => {
    const callHeaders = { ...headers };
    if (overrideToken) {
      callHeaders.Authorization = `Bearer ${overrideToken}`;
    }
    return getTransport()(url, {
      method,
      headers: callHeaders,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await executeCall();

  if (response.status === 401 && !options.skipAuthRefresh) {
    const newAccessToken = await rotateMobileSessionSingleflight();
    if (newAccessToken) {
      response = await executeCall(newAccessToken);
    }
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new MobileApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawText = await response.text();
  if (!rawText) {
    return undefined as T;
  }
  return JSON.parse(rawText) as T;
}

export const mobileApiClient = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    mobileRequest<T>(path, { method: "GET", headers }),
  post: <T>(path: string, body?: unknown, skipAuthRefresh = false) =>
    mobileRequest<T>(path, { method: "POST", body, skipAuthRefresh }),
  put: <T>(path: string, body?: unknown) =>
    mobileRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    mobileRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) =>
    mobileRequest<T>(path, { method: "DELETE" }),
};
