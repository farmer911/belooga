/**
 * Native Runtime Bridge (Expo SecureStore Hardware Keystore Bridge, Expo Router, and Neumorphic Soft UI Primitives).
 */

import React from "react";
import { getSemanticTokens, NEUMORPHIC_TOKENS, ThemeMode } from "@/theme/tokens";

export interface SecureVaultAdapter {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const memoryVault = new Map<string, string>();
const persistentKeystore = new Map<string, string>();

function getNativeExpoSecureStore(): SecureVaultAdapter | undefined {
  return (globalThis as unknown as { ExpoSecureStore?: SecureVaultAdapter }).ExpoSecureStore;
}

export function reloadSecureVaultFromDiskForTesting(): void {
  memoryVault.clear();
  for (const [k, v] of persistentKeystore.entries()) {
    memoryVault.set(k, v);
  }
}

export const SecureStore: SecureVaultAdapter = {
  async getItemAsync(key: string): Promise<string | null> {
    const nativeBridge = getNativeExpoSecureStore();
    if (nativeBridge) return nativeBridge.getItemAsync(key);
    if (!memoryVault.has(key) && persistentKeystore.has(key)) {
      memoryVault.set(key, persistentKeystore.get(key)!);
    }
    return memoryVault.get(key) ?? null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    const nativeBridge = getNativeExpoSecureStore();
    if (nativeBridge) {
      await nativeBridge.setItemAsync(key, value);
      return;
    }
    memoryVault.set(key, value);
    persistentKeystore.set(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    const nativeBridge = getNativeExpoSecureStore();
    if (nativeBridge) {
      await nativeBridge.deleteItemAsync(key);
      return;
    }
    memoryVault.delete(key);
    persistentKeystore.delete(key);
  },
};

export function clearSecureVaultForTesting(): void {
  memoryVault.clear();
  persistentKeystore.clear();
}

export interface MobileRouteState {
  currentPath: string;
  params: Record<string, string>;
  history: string[];
}

const routeState: MobileRouteState = { currentPath: "/(tabs)", params: {}, history: ["/(tabs)"] };
const routeListeners = new Set<() => void>();
const notifyRouteListeners = () => routeListeners.forEach((l) => l());

export const mobileRouter = {
  subscribe(listener: () => void): () => void {
    routeListeners.add(listener);
    return () => routeListeners.delete(listener);
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
    return { currentPath: routeState.currentPath, params: { ...routeState.params }, history: [...routeState.history] };
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

const EXTRUDED_BORDER: React.CSSProperties = {
  borderTop: `1px solid ${NEUMORPHIC_TOKENS.highlightBevel}`,
  borderLeft: `1px solid ${NEUMORPHIC_TOKENS.highlightBevel}`,
  borderRight: `1px solid ${NEUMORPHIC_TOKENS.shadowDark}`,
  borderBottom: `1px solid ${NEUMORPHIC_TOKENS.shadowDark}`,
  boxShadow: NEUMORPHIC_TOKENS.dualExtrudedShadow,
};

const INSET_BORDER: React.CSSProperties = {
  borderTop: `1px solid ${NEUMORPHIC_TOKENS.shadowDark}`,
  borderLeft: `1px solid ${NEUMORPHIC_TOKENS.shadowDark}`,
  borderRight: `1px solid ${NEUMORPHIC_TOKENS.highlightBevel}`,
  borderBottom: `1px solid ${NEUMORPHIC_TOKENS.highlightBevel}`,
  boxShadow: NEUMORPHIC_TOKENS.insetRecessedShadow,
};

export function ScreenShell({ testID, mode = "neumorphic", children, style }: NativeContainerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "section",
    {
      "data-testid": testID,
      style: { backgroundColor: tokens.surface.page, color: tokens.typography.main, minHeight: "100%", display: "flex", flexDirection: "column", gap: 14, ...style },
    },
    children
  );
}

export function SurfaceCard({ testID, mode = "neumorphic", children, style }: NativeContainerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "div",
    {
      "data-testid": testID,
      style: { backgroundColor: tokens.surface.card, ...EXTRUDED_BORDER, borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 12, ...style },
    },
    children
  );
}

export function NeumorphicCard(props: NativeContainerProps) {
  return SurfaceCard({ ...props, mode: "neumorphic" });
}

export function NeumorphicInsetWell({ testID, children, style }: NativeContainerProps) {
  return React.createElement(
    "div",
    {
      "data-testid": testID,
      "aria-label": testID,
      style: { backgroundColor: NEUMORPHIC_TOKENS.recessedWell, borderRadius: 14, ...INSET_BORDER, padding: 12, display: "flex", flexDirection: "column", gap: 8, ...style },
    },
    children
  );
}

export interface NeumorphicInputProps {
  testID?: string;
  accessibilityLabel?: string;
  value: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

export function NeumorphicInput({ testID, accessibilityLabel, value, placeholder, onChange, style }: NeumorphicInputProps) {
  return React.createElement("input", {
    "data-testid": testID,
    "aria-label": accessibilityLabel ?? testID,
    value,
    placeholder,
    onChange,
    style: { backgroundColor: NEUMORPHIC_TOKENS.recessedWell, color: NEUMORPHIC_TOKENS.headingText, borderRadius: 14, ...INSET_BORDER, padding: "10px 14px", fontSize: 13, ...style },
  });
}

export interface BottomSheetDrawerProps extends NativeContainerProps {
  title?: string;
}

export function BottomSheetDrawer({ testID = "mobile-bottom-sheet-drawer", title, mode = "neumorphic", children, style }: BottomSheetDrawerProps) {
  const tokens = getSemanticTokens(mode);
  return React.createElement(
    "div",
    {
      "data-testid": testID,
      "aria-label": testID,
      style: { backgroundColor: tokens.surface.card, ...EXTRUDED_BORDER, borderRadius: "24px 24px 16px 16px", padding: 18, display: "flex", flexDirection: "column", gap: 12, ...style },
    },
    React.createElement("div", { style: { width: 40, height: 4, borderRadius: 999, backgroundColor: NEUMORPHIC_TOKENS.shadowDark, alignSelf: "center" } }),
    title ? React.createElement("strong", { style: { fontSize: 15, color: tokens.typography.heading } }, title) : null,
    children
  );
}

export interface BadgePillProps {
  testID?: string;
  label: string;
  tone?: "brand" | "success" | "warning" | "neutral";
  mode?: ThemeMode;
}

export function BadgePill({ testID, label, tone = "brand", mode = "neumorphic" }: BadgePillProps) {
  const tokens = getSemanticTokens(mode);
  const bg = tone === "brand" ? tokens.brand.primaryMuted : NEUMORPHIC_TOKENS.recessedWell;
  const fg = tone === "brand" ? tokens.brand.primary : tone === "success" ? tokens.status.success : tone === "warning" ? tokens.status.warning : tokens.typography.body;
  return React.createElement(
    "span",
    {
      "data-testid": testID,
      style: { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, backgroundColor: bg, color: fg, border: `1px solid ${NEUMORPHIC_TOKENS.shadowDark}` },
    },
    label
  );
}

export interface ActionButtonProps {
  testID?: string;
  accessibilityLabel?: string;
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "accent" | "inset";
  mode?: ThemeMode;
  style?: React.CSSProperties;
  onPress?: () => void;
}

export function ActionButton({ testID, accessibilityLabel, label, disabled = false, variant = "primary", mode = "neumorphic", style, onPress }: ActionButtonProps) {
  const tokens = getSemanticTokens(mode);
  const isInset = variant === "inset";
  const bg = variant === "primary" || variant === "accent" ? NEUMORPHIC_TOKENS.primaryTeal : variant === "danger" ? tokens.status.danger : isInset ? NEUMORPHIC_TOKENS.recessedWell : NEUMORPHIC_TOKENS.extrudedCard;
  const fg = variant === "secondary" || isInset ? NEUMORPHIC_TOKENS.headingText : NEUMORPHIC_TOKENS.highlightBevel;
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
        ...(isInset ? INSET_BORDER : EXTRUDED_BORDER),
        borderRadius: 14,
        padding: "12px 16px",
        minHeight: 48,
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        ...style,
      },
    },
    label
  );
}

export function NeumorphicButton(props: ActionButtonProps) {
  return ActionButton({ ...props, mode: "neumorphic" });
}
