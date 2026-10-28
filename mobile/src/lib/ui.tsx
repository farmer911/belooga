import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { getSemanticTokens, NEUMORPHIC_TOKENS as N } from "@/theme/tokens";

const T = getSemanticTokens("neumorphic");

interface BoxProps {
  testID?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Scrollable screen body. Screens that render long lists use FlatList directly instead. */
export function Screen({ testID, children }: BoxProps) {
  return (
    <ScrollView
      testID={testID}
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({ testID, children, style }: BoxProps) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function Well({ testID, children, style }: BoxProps) {
  return (
    <View testID={testID} style={[styles.well, style]}>
      {children}
    </View>
  );
}

/** Horizontal wrapping row (chips, button groups). */
export function Row({ testID, children, style }: BoxProps) {
  return (
    <View testID={testID} style={[styles.row, style]}>
      {children}
    </View>
  );
}

export function Sheet({ testID, title, children }: BoxProps & { title?: string }) {
  return (
    <View testID={testID} style={styles.sheet}>
      <View style={styles.sheetHandle} />
      {title ? <Text style={styles.h2}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function H1({ testID, children }: { testID?: string; children: React.ReactNode }) {
  return (
    <Text testID={testID} style={styles.h1} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function H2({ testID, children }: { testID?: string; children: React.ReactNode }) {
  return (
    <Text testID={testID} style={styles.h2} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({
  testID,
  children,
  tone = "body",
}: {
  testID?: string;
  children: React.ReactNode;
  tone?: "body" | "brand" | "danger" | "success" | "warning";
}) {
  const color =
    tone === "brand"
      ? T.brand.primary
      : tone === "danger"
        ? T.status.danger
        : tone === "success"
          ? T.status.success
          : tone === "warning"
            ? T.status.warning
            : T.typography.body;
  return (
    <Text testID={testID} style={[styles.body, { color }]}>
      {children}
    </Text>
  );
}

export function Field({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={T.typography.muted}
      accessibilityLabel={props.accessibilityLabel ?? props.placeholder ?? props.testID}
      autoCapitalize="none"
      {...props}
      style={[styles.input, props.multiline ? styles.multiline : null, style]}
    />
  );
}

export type ButtonVariant = "primary" | "secondary" | "danger" | "inset";

export interface ButtonProps {
  testID?: string;
  accessibilityLabel?: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  testID,
  accessibilityLabel,
  label,
  onPress,
  disabled = false,
  variant = "primary",
  style,
}: ButtonProps) {
  const filled = variant === "primary" || variant === "danger";
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && { backgroundColor: N.primaryTeal },
        variant === "danger" && { backgroundColor: T.status.danger },
        variant === "inset" && styles.inset,
        (pressed || disabled) && { opacity: disabled ? 0.55 : 0.8 },
        style,
      ]}
    >
      <Text style={[styles.buttonLabel, { color: filled ? N.highlightBevel : N.headingText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Pill({
  testID,
  label,
  tone = "brand",
}: {
  testID?: string;
  label: string;
  tone?: "brand" | "success" | "warning" | "neutral";
}) {
  const color =
    tone === "brand"
      ? T.brand.primary
      : tone === "success"
        ? T.status.success
        : tone === "warning"
          ? T.status.warning
          : T.typography.body;
  return (
    <View
      testID={testID}
      style={[styles.pill, { backgroundColor: tone === "brand" ? T.brand.primaryMuted : N.recessedWell }]}
    >
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

/** Renders an API error from a react-query result; nothing when there is none. */
export function ErrorText({ testID, error }: { testID?: string; error: unknown }) {
  if (!error) return null;
  return (
    <Body testID={testID} tone="danger">
      {error instanceof Error ? error.message : "Request failed"}
    </Body>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: N.canvas },
  pageContent: { padding: 16, gap: 14 },
  card: {
    backgroundColor: N.extrudedCard,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    boxShadow: N.dualExtrudedShadow,
  },
  well: {
    backgroundColor: N.recessedWell,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    boxShadow: N.insetRecessedShadow,
  },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  sheet: {
    backgroundColor: N.extrudedCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    gap: 12,
    boxShadow: N.dualExtrudedShadow,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: N.shadowDark, alignSelf: "center" },
  h1: { fontSize: 20, fontWeight: "800", color: T.typography.heading },
  h2: { fontSize: 16, fontWeight: "700", color: T.typography.heading },
  body: { fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: N.recessedWell,
    color: N.headingText,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
    boxShadow: N.insetRecessedShadow,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  button: {
    backgroundColor: N.extrudedCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: N.dualExtrudedShadow,
  },
  inset: { backgroundColor: N.recessedWell, boxShadow: N.insetRecessedShadow },
  buttonLabel: { fontWeight: "700", fontSize: 13, textAlign: "center" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  pillLabel: { fontSize: 11, fontWeight: "700" },
});
