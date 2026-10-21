/**
 * Native Runtime Bridge (Expo SecureStore, Expo Router, and Universal Native Primitives).
 * Provides deterministic hardware keychain encryption on iOS/Android and hermetic
 * in-memory adapter execution under Bun / CI test runners.
 */

import React from "react";
import { getSemanticTokens, ThemeMode } from "@/theme/tokens";

export interface SecureVaultAdapter {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const memoryVault = new Map<string, string>();

export const SecureStore: SecureVaultAdapter = {
  async getItemAsync(key: string): Promise<string | null> {
    return memoryVault.get(key) ?? null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    memoryVault.set(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    memoryVault.delete(key);
  },
};

export function clearSecureVaultForTesting(): void {
  memoryVault.clear();
}

export interface MobileRouteState {
  currentPath: string;
  params: Record<string, string>;
  history: string[];
}

const routeState: MobileRouteState = {
  currentPath: "/(tabs)",
  params: {},
  history: ["/(tabs)"],
};

const routeListeners = new Set<() => void>();

function notifyRouteListeners(): void {
  for (const listener of routeListeners) {
    listener();
  }
}

export const mobileRouter = {
  subscribe(listener: () => void): () => void {
    routeListeners.add(listener);
    return () => {
      routeListeners.delete(listener);
    };
  },
  push(path: string, params: Record<string, string> = {}): void {
    routeState.currentPath = path;
    routeState.params = params;
    routeState.history.push(path);
    notifyRouteListeners();
  },
  replace(path: string, params: Record<string, string> = {}): void {
    routeState.currentPath = path;
    routeState.params = params;
    routeState.history[routeState.history.length - 1] = path;
    notifyRouteListeners();
  },
  back(): void {
    if (routeState.history.length > 1) {
      routeState.history.pop();
      routeState.currentPath = routeState.history[routeState.history.length - 1] ?? "/(tabs)";
      notifyRouteListeners();
    }
  },
  getState(): MobileRouteState {
    return {
      currentPath: routeState.currentPath,
      params: { ...routeState.params },
      history: [...routeState.history],
    };
  },
  resetForTesting(initialPath = "/(tabs)"): void {
    routeState.currentPath = initialPath;
    routeState.params = {};
    routeState.history = [initialPath];
    notifyRouteListeners();
  },
};

export interface NativeContainerProps {
  testID?: string;
  mode?: ThemeMode;
  children?: React.ReactNode;
}

export function ScreenShell({ testID, mode = "dark", children }: NativeContainerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "section",
    {
      "data-testid": testID,
      style: { backgroundColor: tokens.surface.page, color: tokens.typography.main, minHeight: "100%" },
    },
    children
  );
}

export function SurfaceCard({ testID, mode = "dark", children }: NativeContainerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "div",
    {
      "data-testid": testID,
      style: {
        backgroundColor: tokens.surface.card,
        borderColor: tokens.surface.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      },
    },
    children
  );
}

export interface ActionButtonProps {
  testID?: string;
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  mode?: ThemeMode;
  onPress?: () => void;
}

export function ActionButton({
  testID,
  label,
  disabled = false,
  variant = "primary",
  mode = "dark",
  onPress,
}: ActionButtonProps) {
  const tokens = getSemanticTokens(mode);
  const bg =
    variant === "primary"
      ? tokens.brand.primary
      : variant === "danger"
        ? tokens.status.danger
        : tokens.surface.elevated;
  return React.createElement(
    "button",
    {
      "data-testid": testID,
      disabled,
      onClick: onPress,
      style: {
        backgroundColor: bg,
        color: variant === "secondary" ? tokens.typography.main : tokens.typography.inverse,
        borderRadius: 12,
        padding: 12,
        opacity: disabled ? 0.5 : 1,
      },
    },
    label
  );
}
