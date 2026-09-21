import type { ReactNode } from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, spacing, useTheme } from "../../theme";
import { AppLogo, KeyboardAvoider, ThemeToggle, Txt } from "../../ui";

/**
 * Shell for the two unauthenticated screens: brand mark, title, subtitle, then
 * the form on a raised surface.
 *
 * Insets are read rather than taken from a SafeAreaView because the content
 * scrolls: the padding has to live inside the scroll view, or the top of the
 * form is unreachable on a short screen with the keyboard up.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  // Android's inset is only reported once the status bar is translucent; on an
  // older device that reports nothing, its own measured height is the fallback.
  const top =
    insets.top || (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0);

  return (
    <KeyboardAvoider style={{ backgroundColor: colors.canvas }}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: top + spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        showsVerticalScrollIndicator={false}
        // Keeps the card centred on a tall screen but lets it scroll on a
        // short one instead of clipping.
        bounces={false}
      >
        <View style={styles.topBar}>
          <ThemeToggle size="sm" />
        </View>

        <View style={styles.brand}>
          <AppLogo size={60} rounded />
          <View style={styles.brandText}>
            <Txt variant="title">Dealbridge</Txt>
            <Txt variant="caption" color="subtle" uppercase>
              by Autonex AI
            </Txt>
          </View>
        </View>

        <View style={styles.head}>
          <Txt variant="display">{title}</Txt>
          <Txt variant="body" color="muted">
            {subtitle}
          </Txt>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
              shadowOpacity: dark ? 0.35 : 0.06,
            },
          ]}
        >
          {children}
        </View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", gap: spacing.lg },
  topBar: { alignItems: "flex-end", width: "100%" },
  brand: { alignItems: "center", gap: spacing.sm },
  brandText: { alignItems: "center", gap: 2 },
  head: { gap: 4 },
  card: {
    padding: spacing.md + 4,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  footer: { alignItems: "center" },
});
