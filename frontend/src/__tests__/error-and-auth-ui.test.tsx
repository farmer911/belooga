import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import RouteError from "@/app/error";
import { SignInPrompt } from "@/components/common/sign-in-prompt";
import { WorkspaceNavStrip } from "@/components/layout/workspace-nav-strip";
import { normalizeAuthUser, useAuthStore } from "@/store/auth-store";

describe("app/error.tsx", () => {
  const consoleError = spyOn(console, "error");
  beforeEach(() => consoleError.mockImplementation(() => {}));
  afterEach(() => consoleError.mockReset());

  test("shows the digest but not the raw message outside development, and retries", () => {
    const retry = mock(() => {});
    const error = Object.assign(new Error("db password=hunter2"), { digest: "abc123" });
    render(<RouteError error={error} retry={retry} />);

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("abc123")).toBeTruthy();
    expect(screen.queryByText(/hunter2/)).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByText("Try again"));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe("SignInPrompt", () => {
  beforeEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isHydrated: false }));

  test("waits for the session bootstrap before prompting", () => {
    render(<SignInPrompt next="/cv-studio" description="Sign in to edit your CV." />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByTestId("sign-in-prompt")).toBeNull();
  });

  test("links to login with a return path once hydrated", () => {
    useAuthStore.getState().logout();
    render(<SignInPrompt next="/cv-studio" description="Sign in to edit your CV." />);
    expect(screen.getByText("Sign in to edit your CV.")).toBeTruthy();
    expect(screen.getByText("Sign in").closest("a")?.getAttribute("href")).toBe("/login?next=%2Fcv-studio");
  });
});

describe("WorkspaceNavStrip", () => {
  beforeEach(() => useAuthStore.getState().logout());

  test("hides profile links when nobody is signed in (no demo fallback)", () => {
    render(<WorkspaceNavStrip />);
    expect(screen.queryByText("Workspace Hub")).toBeNull();
    expect(screen.getByText("Job Tracker")).toBeTruthy();
  });

  test("links profile pages to the signed-in user", () => {
    useAuthStore.getState().setUser(normalizeAuthUser({ username: "lan" }));
    render(<WorkspaceNavStrip />);
    expect(screen.getByText("Workspace Hub").closest("a")?.getAttribute("href")).toBe("/user/lan");
    expect(screen.getByText("Settings").closest("a")?.getAttribute("href")).toBe("/user/lan/settings");
  });
});
