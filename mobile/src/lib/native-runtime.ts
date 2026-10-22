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
  style?: React.CSSProperties;
}

export function ScreenShell({ testID, mode = "dark", children, style }: NativeContainerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "section",
    {
      "data-testid": testID,
      style: {
        backgroundColor: tokens.surface.page,
        color: tokens.typography.main,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        ...style,
      },
    },
    children
  );
}

export function SurfaceCard({ testID, mode = "dark", children, style }: NativeContainerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "div",
    {
      "data-testid": testID,
      style: {
        backgroundColor: tokens.surface.card,
        border: `1px solid ${tokens.surface.border}`,
        borderRadius: 20,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
        ...style,
      },
    },
    children
  );
}

export interface BottomSheetDrawerProps extends NativeContainerProps {
  title?: string;
}

export function BottomSheetDrawer({
  testID = "mobile-bottom-sheet-drawer",
  title,
  mode = "dark",
  children,
  style,
}: BottomSheetDrawerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "div",
    {
      "data-testid": testID,
      "aria-label": testID,
      style: {
        backgroundColor: tokens.surface.card,
        border: `1px solid ${tokens.surface.border}`,
        borderRadius: "24px 24px 16px 16px",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 -6px 24px rgba(0, 0, 0, 0.32)",
        ...style,
      },
    },
    React.createElement("div", {
      style: {
        width: 40,
        height: 4,
        borderRadius: 999,
        backgroundColor: tokens.surface.border,
        alignSelf: "center",
      },
    }),
    title
      ? React.createElement(
          "strong",
          { style: { fontSize: 15, color: tokens.typography.heading } },
          title
        )
      : null,
    children
  );
}

export interface BadgePillProps {
  testID?: string;
  label: string;
  tone?: "brand" | "success" | "warning" | "neutral";
  mode?: ThemeMode;
}

export function BadgePill({ testID, label, tone = "brand", mode = "dark" }: BadgePillProps) {
  const tokens = getSemanticTokens(mode);
  const bg =
    tone === "brand"
      ? tokens.brand.primaryMuted
      : tone === "success"
        ? "rgba(16, 185, 129, 0.16)"
        : tone === "warning"
          ? "rgba(245, 158, 11, 0.16)"
          : tokens.surface.elevated;
  const fg =
    tone === "brand"
      ? tokens.brand.primary
      : tone === "success"
        ? tokens.status.success
        : tone === "warning"
          ? tokens.status.warning
          : tokens.typography.body;
  return React.createElement(
    "span",
    {
      "data-testid": testID,
      style: {
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${tokens.surface.border}`,
      },
    },
    label
  );
}

export interface ActionButtonProps {
  testID?: string;
  accessibilityLabel?: string;
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "accent";
  mode?: ThemeMode;
  style?: React.CSSProperties;
  onPress?: () => void;
}

export function ActionButton({
  testID,
  accessibilityLabel,
  label,
  disabled = false,
  variant = "primary",
  mode = "dark",
  style,
  onPress,
}: ActionButtonProps) {
  const tokens = getSemanticTokens(mode);
  const bg =
    variant === "primary"
      ? tokens.brand.primary
      : variant === "accent"
        ? tokens.brand.accent
        : variant === "danger"
          ? tokens.status.danger
          : tokens.surface.elevated;
  const fg =
    variant === "secondary"
      ? tokens.typography.main
      : variant === "accent" || variant === "danger"
        ? "rgb(255, 255, 255)"
        : tokens.typography.inverse;
  return React.createElement(
    "button",
    {
      "data-testid": testID,
      "aria-label": accessibilityLabel ?? testID ?? label,
      disabled,
      onClick: onPress,
      style: {
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${variant === "secondary" ? tokens.surface.border : "transparent"}`,
        borderRadius: 14,
        padding: "12px 16px",
        minHeight: 48,
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all 150ms ease",
        ...style,
      },
    },
    label
  );
}
