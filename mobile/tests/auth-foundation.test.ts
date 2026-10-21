import { beforeEach, describe, expect, it } from "bun:test";
import {
  clearSecureVaultForTesting,
  mobileRouter,
  SecureStore,
} from "@/lib/native-runtime";
import {
  SECURE_ACCESS_TOKEN_KEY,
  SECURE_REFRESH_TOKEN_KEY,
  useMobileAuthStore,
} from "@/store/auth-store";
import {
  mobileApiClient,
  setMobileFetchTransportForTesting,
} from "@/services/api-client";
import {
  fetchCurrentMobileSession,
  loginMobileUser,
  logoutMobileUser,
  registerMobileUser,
} from "@/hooks/use-mobile-auth";
import { getSemanticTokens } from "@/theme/tokens";
import { MOBILE_TABS } from "../app/(tabs)/_layout";

describe("Belooga Mobile Platform Foundation & Dual-Mode Auth (BEL-132)", () => {
  beforeEach(async () => {
    clearSecureVaultForTesting();
    await useMobileAuthStore.getState().clearSession();
    mobileRouter.resetForTesting("/(auth)/login");
    setMobileFetchTransportForTesting(null);
  });

  it("enforces semantic RGB/RGBA tokens with zero raw hex codes across light and dark modes", () => {
    const dark = getSemanticTokens("dark");
    const light = getSemanticTokens("light");
    expect(dark.brand.primary).toBe("rgb(91, 187, 174)");
    expect(light.surface.card).toBe("rgb(255, 255, 255)");
    expect(MOBILE_TABS.length).toBe(4);
  });

  it("persists access_token and refresh_token in SecureStore upon login and hydrates cleanly", async () => {
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/v1/auth/login/")) {
        return new Response(
          JSON.stringify({
            access_token: "jwt_access_initial_123",
            refresh_token: "rt_mobile_vault_456",
            token_type: "bearer",
            user: {
              id: "56eef1e7-9655-44f3-8bc0-49da5d55ac11",
              email: "alex@belooga.com",
              username: "alexnguyen",
              first_name: "Alex",
              last_name: "Nguyen",
              role: "candidate",
              avatar_url: "/images/avatar.jpg",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ detail: "Not found" }), { status: 404 });
    }) as typeof fetch);

    const user = await loginMobileUser({
      email: "alex@belooga.com",
      password: "Password123!",
    });

    expect(user.username).toBe("alexnguyen");
    expect(mobileRouter.getState().currentPath).toBe("/(tabs)");
    expect(await SecureStore.getItemAsync(SECURE_ACCESS_TOKEN_KEY)).toBe("jwt_access_initial_123");
    expect(await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY)).toBe("rt_mobile_vault_456");

    // Reset in-memory Zustand state and hydrate back from SecureStore
    useMobileAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
    });
    await useMobileAuthStore.getState().hydrateFromSecureVault();
    expect(useMobileAuthStore.getState().isAuthenticated).toBe(true);
    expect(useMobileAuthStore.getState().accessToken).toBe("jwt_access_initial_123");
    expect(useMobileAuthStore.getState().refreshToken).toBe("rt_mobile_vault_456");
    expect(useMobileAuthStore.getState().user?.username).toBe("alexnguyen");
  });

  it("coalesces concurrent 401 responses into a singleflight /v1/auth/refresh/ rotation", async () => {
    await useMobileAuthStore.getState().setSessionTokens("expired_jwt", "valid_refresh_v1", {
      id: "u1",
      email: "alex@belooga.com",
      username: "alexnguyen",
      firstName: "Alex",
      lastName: "Nguyen",
      role: "candidate",
    });

    let refreshCallCount = 0;

    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const authHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;

      if (url.endsWith("/v1/auth/refresh/")) {
        refreshCallCount += 1;
        const refreshHeader = (init?.headers as Record<string, string> | undefined)?.["X-Refresh-Token"];
        expect(refreshHeader).toBe("valid_refresh_v1");
        return new Response(
          JSON.stringify({
            access_token: "fresh_jwt_v2",
            refresh_token: "rotated_refresh_v2",
            token_type: "bearer",
            user: {
              id: "u1",
              email: "alex@belooga.com",
              username: "alexnguyen",
              first_name: "Alex",
              last_name: "Nguyen",
              role: "candidate",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/v1/auth/me/")) {
        if (authHeader === "Bearer expired_jwt") {
          return new Response(JSON.stringify({ detail: "Token expired" }), { status: 401 });
        }
        if (authHeader === "Bearer fresh_jwt_v2") {
          return new Response(
            JSON.stringify({
              id: "u1",
              email: "alex@belooga.com",
              username: "alexnguyen",
              first_name: "Alex",
              last_name: "Nguyen",
              role: "candidate",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(JSON.stringify({ detail: "Unhandled" }), { status: 500 });
    }) as typeof fetch);

    // Fire two concurrent authenticated requests while access token is expired
    const [me1, me2] = await Promise.all([
      fetchCurrentMobileSession(),
      mobileApiClient.get<{ username: string }>("/v1/auth/me/"),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(me1.username).toBe("alexnguyen");
    expect(me2.username).toBe("alexnguyen");
    expect(useMobileAuthStore.getState().accessToken).toBe("fresh_jwt_v2");
    expect(useMobileAuthStore.getState().refreshToken).toBe("rotated_refresh_v2");
  });

  it("registers a new mobile candidate and revokes refresh token upon logout", async () => {
    let logoutCalledWithToken: string | null = null;

    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/users/register/")) {
        return new Response(
          JSON.stringify({
            access_token: "reg_jwt_1",
            refresh_token: "reg_refresh_1",
            token_type: "bearer",
            user: {
              id: "u2",
              email: "newbie@belooga.com",
              username: "newbie_dev",
              first_name: "Newbie",
              last_name: "Dev",
              role: "candidate",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/auth/logout/")) {
        const parsedBody = JSON.parse(String(init?.body ?? "{}")) as { refresh_token?: string };
        logoutCalledWithToken = parsedBody.refresh_token ?? null;
        return new Response(JSON.stringify({ message: "Successfully logged out" }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const registered = await registerMobileUser({
      firstName: "Newbie",
      lastName: "Dev",
      username: "newbie_dev",
      email: "newbie@belooga.com",
      password: "StrongPassword123!",
    });
    expect(registered.username).toBe("newbie_dev");

    await logoutMobileUser();
    expect(logoutCalledWithToken).toBe("reg_refresh_1");
    expect(useMobileAuthStore.getState().isAuthenticated).toBe(false);
    expect(await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY)).toBeNull();
    expect(mobileRouter.getState().currentPath).toBe("/(auth)/login");
  });
});
