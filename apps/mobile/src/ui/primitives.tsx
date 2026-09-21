import { memo, type ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { radius, spacing, toneColors, useTheme, type Tone } from "../theme";

/* -------------------------------------------------------------------------- */
/* Text                                                                        */
/* -------------------------------------------------------------------------- */

type TextVariant = "display" | "title" | "heading" | "body" | "label" | "caption";
type TextColor = "fg" | "muted" | "subtle" | "accent" | "danger" | "success";

const VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  heading: { fontSize: 15, fontWeight: "700" },
  body: { fontSize: 14, fontWeight: "500" },
  label: { fontSize: 12, fontWeight: "600" },
  caption: { fontSize: 11, fontWeight: "600" },
};

interface TxtProps {
  children: ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  /** Small-caps section label, as the web renders its field labels. */
  uppercase?: boolean;
}

/**
 * The only text component. Screens never reach for a bare <Text>, so type
 * scale and colour always come from the theme rather than a literal.
 */
export function Txt({
  children,
  variant = "body",
  color = "fg",
  numberOfLines,
  style,
  uppercase,
}: TxtProps) {
  const { colors } = useTheme();

  const tint = {
    fg: colors.fg,
    muted: colors.fgMuted,
    subtle: colors.fgSubtle,
    accent: colors.accent,
    danger: colors.badFg,
    success: colors.okFg,
  }[color];

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        VARIANTS[variant],
        { color: tint },
        uppercase && { textTransform: "uppercase", letterSpacing: 0.8 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A bordered surface. The web leans on borders and spacing rather than stacked
 * shadows, and this keeps that: one hairline, no elevation.
 */
export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { colors, dark } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.lg,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: dark ? 0.2 : 0.04,
          shadowRadius: 3,
          elevation: 1,
        },
        padded && { padding: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

export const Badge = memo(function Badge({
  children,
  tone = "neutral",
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const { colors } = useTheme();
  const { bg, fg } = toneColors(tone, colors);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: fg }]} />}
      <Text style={[styles.badgeText, { color: fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
});

export function Alert({ children, tone = "danger" }: { children: ReactNode; tone?: Tone }) {
  const { colors } = useTheme();
  const { bg, fg } = toneColors(tone, colors);

  return (
    <View style={[styles.alert, { backgroundColor: bg }]}>
      <Text style={[styles.alertText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={colors.accent} />;
}

/** Circle with initials, for members and owners. */
export function Avatar({ name, size = 32 }: { name?: string | null; size?: number }) {
  const { colors } = useTheme();
  const initials = (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accentSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.accentOn, fontSize: size * 0.38, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  alertText: { fontSize: 12, fontWeight: "600", flex: 1 },
});
