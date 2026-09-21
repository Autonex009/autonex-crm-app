import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { spacing, useTheme } from "../theme";
import { Button } from "./Button";
import { Spinner, Txt } from "./primitives";

/**
 * Canvas-coloured page container with safe-area insets.
 *
 * `top` is always claimed rather than left to the OS: the Android status bar is
 * translucent (see App.tsx) so that the canvas colour runs under it, which
 * means nothing else inserts that gap. `bottom` is left out by default because
 * the tab bar already owns that edge — a screen that has no tab bar under it
 * passes it explicitly.
 */
export function Screen({
  children,
  edges = ["top", "left", "right"],
}: {
  children: ReactNode;
  edges?: readonly Edge[];
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.canvas }]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

/**
 * Lifts its children clear of the on-screen keyboard.
 *
 * The two platforms need opposite things. iOS reports the keyboard but does not
 * resize the window, so the view has to be padded by hand. Android resizes the
 * window itself (`softwareKeyboardLayoutMode: "resize"` in app.json), and
 * adding padding on top of that double-counts the keyboard and leaves a gap the
 * height of it — so there the component is a plain passthrough.
 *
 * `offset` is what sits above the avoided area and must stay visible, normally
 * a screen header.
 */
export function KeyboardAvoider({
  children,
  offset = 0,
  style,
}: {
  children: ReactNode;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? offset : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/** Centered spinner for a first load. */
export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <Spinner size="large" />
      {label && (
        <Txt variant="label" color="muted" style={styles.gap}>
          {label}
        </Txt>
      )}
    </View>
  );
}

/**
 * Failed load. Always offers a retry: on a phone the usual cause is a dropped
 * connection, and pulling to refresh isn't discoverable on an empty screen.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Txt variant="heading">Something went wrong</Txt>
      <Txt variant="body" color="muted" style={styles.centerText}>
        {message}
      </Txt>
      {onRetry && (
        <View style={styles.gap}>
          <Button variant="secondary" onPress={onRetry}>
            Try again
          </Button>
        </View>
      )}
    </View>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.center}>
      <Txt variant="heading" color="muted">
        {title}
      </Txt>
      {detail && (
        <Txt variant="body" color="subtle" style={styles.centerText}>
          {detail}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  centerText: { textAlign: "center" },
  gap: { marginTop: spacing.sm },
});
