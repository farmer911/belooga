import { beforeEach, describe, expect, test } from "bun:test";
import { normalizeAuthUser, useAuthStore } from "@/store/auth-store";

describe("normalizeAuthUser", () => {
  test("maps snake_case backend payloads", () => {
    expect(
      normalizeAuthUser({
        id: 7,
        email: "lan@example.com",
        username: "lan",
        first_name: "Lan",
        last_name: "Tran",
        avatar_url: "/a.jpg",
        role: "employer",
      })
    ).toEqual({
      id: "7",
      email: "lan@example.com",
      username: "lan",
      firstName: "Lan",
      lastName: "Tran",
      avatarUrl: "/a.jpg",
      role: "employer",
    });
  });

  test("prefers camelCase and falls back to username / candidate role", () => {
    const u = normalizeAuthUser({ username: "lan", firstName: "L", avatarUrl: 42 });
    expect(u).toEqual({
      id: "",
      email: "",
      username: "lan",
      firstName: "L",
      lastName: "",
      avatarUrl: undefined,
      role: "candidate",
    });
    expect(normalizeAuthUser({ username: "minh" })?.firstName).toBe("minh");
  });

  test("returns null without a string username", () => {
    expect(normalizeAuthUser(null)).toBeNull();
    expect(normalizeAuthUser(undefined)).toBeNull();
    expect(normalizeAuthUser({ id: "1" })).toBeNull();
    expect(normalizeAuthUser({ username: 123 })).toBeNull();
  });
});

describe("useAuthStore", () => {
  beforeEach(() => useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false, isHydrated: false }));

  test("setAccessToken drives isAuthenticated and marks hydrated", () => {
    useAuthStore.getState().setAccessToken("jwt");
    expect(useAuthStore.getState()).toMatchObject({ accessToken: "jwt", isAuthenticated: true, isHydrated: true });

    useAuthStore.getState().setAccessToken(null);
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, isAuthenticated: false });
  });

  test("setUser does not authenticate by itself", () => {
    useAuthStore.getState().setUser(normalizeAuthUser({ username: "lan" }));
    expect(useAuthStore.getState().user?.username).toBe("lan");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test("logout clears token and user but stays hydrated", () => {
    useAuthStore.getState().setAccessToken("jwt");
    useAuthStore.getState().setUser(normalizeAuthUser({ username: "lan" }));
    useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });
});
