import * as SecureStore from "expo-secure-store";
import {
  MobileApiError,
  mobileApiClient,
  resolveApiBaseUrl,
  restoreMobileSession,
} from "@/services/api-client";
import { SECURE_REFRESH_TOKEN_KEY, useMobileAuthStore } from "@/store/auth-store";
import { mockFetch, on, resetSession, secureStoreData, signIn, testUser } from "./test-utils";

beforeEach(resetSession);

describe("resolveApiBaseUrl", () => {
  it("uses the configured URL without trailing slashes", () => {
    expect(resolveApiBaseUrl("https://api.belooga.vn/", false, "android")).toBe("https://api.belooga.vn");
  });

  it("falls back to the host machine only in dev builds", () => {
    expect(resolveApiBaseUrl(undefined, true, "android")).toBe("http://10.0.2.2:8080");
    expect(resolveApiBaseUrl("  ", true, "ios")).toBe("http://localhost:8080");
  });

  it("throws in production builds when EXPO_PUBLIC_API_URL is missing", () => {
    expect(() => resolveApiBaseUrl(undefined, false, "ios")).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});

describe("mobileRequest auth refresh", () => {
  it("refreshes once for concurrent 401s, retries with the new token and persists only the rotated refresh token", async () => {
    signIn();
    const calls = mockFetch(
      (call) =>
        call.url.endsWith("/v1/auth/refresh/")
          ? { body: { access_token: "access-2", refresh_token: "refresh-2", user: testUser } }
          : undefined,
      (call) =>
        call.headers.Authorization === "Bearer access-1" ? { status: 401, body: { detail: "expired" } } : undefined,
      on("GET", "/v1/tracker/jobs/", [])
    );

    await Promise.all([mobileApiClient.get("/v1/tracker/jobs/"), mobileApiClient.get("/v1/tracker/jobs/")]);

    const refreshCalls = calls.filter((c) => c.url.endsWith("/v1/auth/refresh/"));
    expect(refreshCalls).toHaveLength(1);
    expect(refreshCalls[0].body).toEqual({ refresh_token: "refresh-1" });
    expect(calls.filter((c) => c.headers.Authorization === "Bearer access-2")).toHaveLength(2);
    expect(useMobileAuthStore.getState().accessToken).toBe("access-2");
    expect(secureStoreData.get(SECURE_REFRESH_TOKEN_KEY)).toBe("refresh-2");
    // The access token must never be written to disk.
    expect([...secureStoreData.values()]).not.toContain("access-2");
  });

  it("clears the session when the server rejects the refresh token", async () => {
    signIn();
    secureStoreData.set(SECURE_REFRESH_TOKEN_KEY, "refresh-1");
    mockFetch(on("POST", "/v1/auth/refresh/", { detail: "revoked" }, 401), on("GET", "/v1/auth/me/", { detail: "expired" }, 401));

    await expect(mobileApiClient.get("/v1/auth/me/")).rejects.toBeInstanceOf(MobileApiError);
    expect(useMobileAuthStore.getState().isAuthenticated).toBe(false);
    expect(secureStoreData.has(SECURE_REFRESH_TOKEN_KEY)).toBe(false);
  });

  it("keeps the refresh token when the refresh request fails at the network level", async () => {
    signIn();
    secureStoreData.set(SECURE_REFRESH_TOKEN_KEY, "refresh-1");
    globalThis.fetch = jest.fn(async (url: unknown) => {
      if (String(url).endsWith("/v1/auth/refresh/")) throw new TypeError("Network request failed");
      return { ok: false, status: 401, json: async () => ({ detail: "expired" }), text: async () => "" } as Response;
    }) as typeof fetch;

    await expect(mobileApiClient.get("/v1/auth/me/")).rejects.toMatchObject({ status: 401 });
    expect(secureStoreData.get(SECURE_REFRESH_TOKEN_KEY)).toBe("refresh-1");
    expect(useMobileAuthStore.getState().refreshToken).toBe("refresh-1");
  });

  it("sends FormData bodies untouched without a JSON content type", async () => {
    const calls = mockFetch(on("POST", "/v1/match/extract-cv-file", { extracted_text: "cv" }));
    const form = new FormData();
    form.append("file", "x");
    await mobileApiClient.post("/v1/match/extract-cv-file", form);
    expect(calls[0].body).toBe(form);
    expect(calls[0].headers["Content-Type"]).toBeUndefined();
  });
});

describe("restoreMobileSession", () => {
  it("exchanges the stored refresh token for an in-memory access token", async () => {
    secureStoreData.set(SECURE_REFRESH_TOKEN_KEY, "refresh-1");
    mockFetch(on("POST", "/v1/auth/refresh/", { access_token: "access-9", refresh_token: null, user: testUser }));

    await expect(restoreMobileSession()).resolves.toBe(true);

    const state = useMobileAuthStore.getState();
    expect(state).toMatchObject({ accessToken: "access-9", refreshToken: "refresh-1", isHydrated: true });
    expect(state.user?.username).toBe("annguyen");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(expect.anything(), "access-9");
  });

  it("marks the app hydrated and signed out when nothing is stored", async () => {
    const calls = mockFetch();
    await expect(restoreMobileSession()).resolves.toBe(false);
    expect(calls).toHaveLength(0);
    expect(useMobileAuthStore.getState().isHydrated).toBe(true);
  });
});
