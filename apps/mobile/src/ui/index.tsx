import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

import { HAIRLINE, spacing, tabular, type, useTheme } from "../theme";

/**
 * The whole component vocabulary, in one file.
 *
 * Small and co-located on purpose: these are eight primitives that every screen
 * composes, and splitting them across eight files would mean eight imports per
 * screen to express "a label over a number".
 */

// --- type ---

type Variant = keyof typeof type;
type Tone = "default" | "muted" | "subtle" | "accent" | "ok" | "warn" | "bad";

interface TxtProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  /** Tabular figures, for anything that sits in a column of numbers. */
  numeric?: boolean;
}

export function Txt({ variant = "body", tone = "default", numeric, style, ...rest }: TxtProps) {
  const t = useTheme();
  const colour: Record<Tone, string> = {
    default: t.fg.default,
    muted: t.fg.muted,
    subtle: t.fg.subtle,
    accent: t.accent,
    ok: t.status.ok,
    warn: t.status.warn,
    bad: t.status.bad,
  };
  return (
    <Text
      {...rest}
      style={[type[variant] as TextStyle, { color: colour[tone] }, numeric && tabular, style]}
    />
  );
}

/** Section label: 11pt, uppercase, tracked. The editorial signature. */
export function Overline({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return (
    <Txt variant="overline" tone="subtle" style={[{ textTransform: "uppercase" }, style]}>
      {children}
    </Txt>
  );
}

// --- layout ---

/** A hairline divider. The main structural device — used instead of borders. */
export function Divider({ inset = 0 }: { inset?: number }) {
  const t = useTheme();
  return <View style={{ height: HAIRLINE, backgroundColor: t.line, marginLeft: inset }} />;
}

/** Vertical space, so screens do not sprinkle magic margins. */
export function Gap({ size = "md" }: { size?: keyof typeof spacing }) {
  return <View style={{ height: spacing[size] }} />;
}

/**
 * A tappable list row.
 *
 * Presses tint the whole row rather than scaling or fading it: on a list of
 * hairline-separated rows, a scale transform makes neighbouring dividers jump.
 */
export function Row({ children, style, ...rest }: PressableProps & { children: ReactNode }) {
  const t = useTheme();
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: pressed ? t.surfacePressed : "transparent",
        },
        style as ViewStyle,
      ]}
    >
      {children}
    </Pressable>
  );
}

// --- status ---

export type StatusTone = "info" | "success" | "warning" | "danger" | "neutral";

/**
 * A 6pt dot. Replaces the coloured pill you would use on the web.
 *
 * A pill sets a filled rectangle against every row and, twenty rows down, the
 * fills are what you see instead of the content. A dot carries the same state
 * in a tenth of the ink.
 */
export function StatusDot({ tone = "neutral" }: { tone?: StatusTone }) {
  const t = useTheme();
  const colour: Record<StatusTone, string> = {
    info: t.status.info,
    success: t.status.ok,
    warning: t.status.warn,
    danger: t.status.bad,
    neutral: t.fg.subtle,
  };
  return (
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colour[tone],
      }}
    />
  );
}

/** Label with a leading dot — "● Negotiation". */
export function StatusLabel({ tone, children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <View style={styles.inline}>
      <StatusDot tone={tone} />
      <Txt variant="caption" tone="muted">
        {children}
      </Txt>
    </View>
  );
}

// --- states ---

export function Loading() {
  const t = useTheme();
  return (
    <View style={styles.centre}>
      <ActivityIndicator color={t.fg.subtle} />
    </View>
  );
}

/**
 * Empty state. Takes a title and a line of explanation — never just "No data",
 * which tells someone nothing about whether it is broken or simply empty.
 */
export function Empty({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.centre}>
      <Txt variant="bodyStrong" tone="muted">
        {title}
      </Txt>
      {detail ? (
        <>
          <Gap size="xs" />
          <Txt variant="caption" tone="subtle" style={{ textAlign: "center" }}>
            {detail}
          </Txt>
        </>
      ) : null}
    </View>
  );
}

/** Error state that shows the real message — a generic one helps nobody debug. */
export function Failed({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong loading this.";
  return (
    <View style={styles.centre}>
      <Txt variant="bodyStrong" tone="bad">
        Could not load
      </Txt>
      <Gap size="xs" />
      <Txt variant="caption" tone="subtle" style={{ textAlign: "center" }}>
        {message}
      </Txt>
      {onRetry ? (
        <>
          <Gap size="md" />
          <Button title="Try again" onPress={onRetry} variant="secondary" />
        </>
      ) : null}
    </View>
  );
}

// --- button ---

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ title, onPress, variant = "primary", disabled, loading }: ButtonProps) {
  const t = useTheme();
  const fill = {
    primary: t.accent,
    secondary: "transparent",
    danger: "transparent",
  }[variant];
  const label = {
    primary: t.fg.onAccent,
    secondary: t.fg.default,
    danger: t.status.bad,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: fill,
          borderWidth: variant === "primary" ? 0 : HAIRLINE,
          borderColor: t.line,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={label} size="small" />
      ) : (
        <Txt variant="bodyStrong" style={{ color: label }}>
          {title}
        </Txt>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.xs + 2 },
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    minHeight: 200,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
