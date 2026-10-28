import { beforeEach, describe, expect, test } from "bun:test";
import { AxiosError } from "axios";
import { apiClient, getApiErrorDetail } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";
import { mockApi } from "./helpers";

beforeEach(() => useAuthStore.getState().logout());

describe("apiClient request interceptor", () => {
  test("injects the bearer token from the auth store", async () => {
    const calls = mockApi(() => ({ data: { ok: true } }));
    useAuthStore.getState().setAccessToken("tok-1");
    await apiClient.get("/v1/me");
    expect(calls[0].headers.Authorization).toBe("Bearer tok-1");
  });

  test("sends no Authorization header when anonymous", async () => {
    const calls = mockApi(() => ({ data: {} }));
    await apiClient.get("/v1/public");
    expect(calls[0].headers.Authorization).toBeUndefined();
  });
});

describe("apiClient 401 handling", () => {
  test("refreshes once and retries the original request with the new token", async () => {
    useAuthStore.getState().setAccessToken("expired");
    const calls = mockApi((config) => {
      if (config.url?.endsWith("/v1/auth/refresh/")) return { data: { access_token: "fresh" } };
      return config.headers.Authorization === "Bearer fresh" ? { data: { id: 1 } } : { status: 401 };
    });

    const res = await apiClient.get("/v1/me");

    expect(res.data).toEqual({ id: 1 });
    expect(calls.map((c) => c.url)).toEqual(["/v1/me", "http://localhost:8080/v1/auth/refresh/", "/v1/me"]);
    expect(calls[1].withCredentials).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("fresh");
  });

  test("logs out and rejects when refresh fails", async () => {
    useAuthStore.getState().setAccessToken("expired");
    mockApi(() => ({ status: 401 }));

    await expect(apiClient.get("/v1/me")).rejects.toBeInstanceOf(AxiosError);
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, isAuthenticated: false });
  });

  test("does not refresh again when the retried request is still 401", async () => {
    const calls = mockApi((config) =>
      config.url?.endsWith("/refresh/") ? { data: { access_token: "fresh" } } : { status: 401 }
    );
    await expect(apiClient.get("/v1/me")).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls).toHaveLength(3);
  });

  test("passes non-401 errors through without refreshing", async () => {
    const calls = mockApi(() => ({ status: 500, data: { detail: "boom" } }));
    await expect(apiClient.get("/v1/x")).rejects.toMatchObject({ response: { status: 500 } });
    expect(calls).toHaveLength(1);
  });
});

describe("getApiErrorDetail", () => {
  test("extracts a string detail from an Axios error response", async () => {
    mockApi(() => ({ status: 400, data: { detail: "Username taken" } }));
    const err = await apiClient.post("/v1/x").catch((e: unknown) => e);
    expect(getApiErrorDetail(err, "fallback")).toBe("Username taken");
  });

  test("falls back for non-string or missing detail and non-Axios errors", async () => {
    mockApi(() => ({ status: 422, data: { detail: [{ msg: "bad" }] } }));
    const validation = await apiClient.post("/v1/x").catch((e: unknown) => e);
    expect(getApiErrorDetail(validation, "fallback")).toBe("fallback");

    mockApi(() => ({ status: 500, data: { detail: "" } }));
    const empty = await apiClient.post("/v1/x").catch((e: unknown) => e);
    expect(getApiErrorDetail(empty, "fallback")).toBe("fallback");

    expect(getApiErrorDetail(new Error("network"), "fallback")).toBe("fallback");
    expect(getApiErrorDetail("nope", "fallback")).toBe("fallback");
  });
});
