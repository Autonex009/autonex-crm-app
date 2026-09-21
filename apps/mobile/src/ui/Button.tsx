import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, useTheme } from "../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Fills the row, as auth forms and sheet footers want. */
  block?: boolean;
  icon?: ReactNode;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  loading,
  disabled,
  block,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const inert = disabled || loading;

  const skin = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: "transparent" },
    secondary: { bg: colors.surface, fg: colors.fg, border: colors.lineStrong },
    ghost: { bg: "transparent", fg: colors.fgMuted, border: "transparent" },
    danger: { bg: colors.badSolid, fg: "#ffffff", border: "transparent" },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      // The pressed state is a flat opacity step rather than a colour swap:
      // it reads the same in both themes and costs nothing to animate.
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: skin.bg,
          borderColor: skin.border,
          opacity: inert ? 0.5 : pressed ? 0.85 : 1,
        },
        block && { alignSelf: "stretch" },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={skin.fg} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={[styles.label, { color: skin.fg }]}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontSize: 14, fontWeight: "700" },
});
