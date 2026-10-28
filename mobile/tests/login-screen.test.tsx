import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import LoginScreen from "../app/(auth)/login";
import { SECURE_REFRESH_TOKEN_KEY, useMobileAuthStore } from "@/store/auth-store";
import { mockFetch, on, renderWithQuery, resetSession, secureStoreData, testUser } from "./test-utils";

beforeEach(resetSession);

it("shows a validation error and makes no request for an invalid email", async () => {
  const calls = mockFetch();
  await renderWithQuery(<LoginScreen />);

  await fireEvent.changeText(screen.getByTestId("mobile-login-email"), "not-an-email");
  await fireEvent.changeText(screen.getByTestId("mobile-login-password"), "secret");
  await fireEvent.press(screen.getByTestId("mobile-login-submit"));

  expect(screen.getByTestId("mobile-login-validation-error")).toBeTruthy();
  expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
  expect(calls).toHaveLength(0);
});

it("signs in, keeps the access token in memory and stores only the refresh token", async () => {
  const calls = mockFetch(
    on("POST", "/v1/auth/login/", { access_token: "access-1", refresh_token: "refresh-1", user: testUser })
  );
  await renderWithQuery(<LoginScreen />);

  await fireEvent.changeText(screen.getByTestId("mobile-login-email"), " an@example.com ");
  await fireEvent.changeText(screen.getByTestId("mobile-login-password"), "secret");
  await fireEvent.press(screen.getByTestId("mobile-login-submit"));

  await waitFor(() => expect(useMobileAuthStore.getState().isAuthenticated).toBe(true));
  expect(calls[0].body).toEqual({ email: "an@example.com", password: "secret" });
  expect(useMobileAuthStore.getState().accessToken).toBe("access-1");
  expect(secureStoreData.get(SECURE_REFRESH_TOKEN_KEY)).toBe("refresh-1");
  expect([...secureStoreData.values()]).not.toContain("access-1");
  expect(router.replace).toHaveBeenCalledWith("/");
});

it("surfaces the API error detail when credentials are rejected", async () => {
  mockFetch(on("POST", "/v1/auth/login/", { detail: "Invalid email or password" }, 401));
  await renderWithQuery(<LoginScreen />);

  await fireEvent.changeText(screen.getByTestId("mobile-login-email"), "an@example.com");
  await fireEvent.changeText(screen.getByTestId("mobile-login-password"), "wrong");
  await fireEvent.press(screen.getByTestId("mobile-login-submit"));

  expect(await screen.findByText("Invalid email or password")).toBeTruthy();
  expect(useMobileAuthStore.getState().isAuthenticated).toBe(false);
});
