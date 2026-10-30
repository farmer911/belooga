import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { useMobileAuthStore } from "@/store/auth-store";

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

type Route = (call: RecordedCall) => { status?: number; body?: unknown } | undefined;

/** Installs a fetch fake: each route returns a response or undefined to fall through. Unmatched calls get 404. */
export function mockFetch(...routes: Route[]): RecordedCall[] {
  const calls: RecordedCall[] = [];
  globalThis.fetch = jest.fn(async (input: unknown, init: RequestInit = {}) => {
    const call: RecordedCall = {
      url: String(input),
      method: init.method ?? "GET",
      headers: (init.headers ?? {}) as Record<string, string>,
      body: typeof init.body === "string" ? JSON.parse(init.body) : init.body,
    };
    calls.push(call);
    const hit = routes.map((r) => r(call)).find(Boolean) ?? { status: 404, body: { detail: "not mocked" } };
    const status = hit.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => hit.body,
      text: async () => (hit.body === undefined ? "" : JSON.stringify(hit.body)),
    } as Response;
  }) as typeof fetch;
  return calls;
}

export const on =
  (method: string, pathPrefix: string, body: unknown, status = 200): Route =>
  (call) =>
    call.method === method && call.url.replace(/^https?:\/\/[^/]+/, "").startsWith(pathPrefix)
      ? { status, body }
      : undefined;

export const secureStoreData = (SecureStore as unknown as { __store: Map<string, string> }).__store;

export function resetSession() {
  secureStoreData.clear();
  jest.clearAllMocks();
  useMobileAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isHydrated: false,
  });
}

export const testUser = {
  id: "u-1",
  email: "an@example.com",
  username: "annguyen",
  first_name: "An",
  last_name: "Nguyen",
  role: "candidate",
};

export function signIn() {
  useMobileAuthStore.setState({
    accessToken: "access-1",
    refreshToken: "refresh-1",
    user: { id: "u-1", email: testUser.email, username: testUser.username, firstName: "An", lastName: "Nguyen", role: "candidate" },
    isAuthenticated: true,
    isHydrated: true,
  });
}

export function renderWithQuery(ui: React.ReactElement) {
  // gcTime: Infinity avoids lingering GC timers that keep Jest workers alive after the run.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
