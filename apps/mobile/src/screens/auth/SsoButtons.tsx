import { useState } from "react";
import {
  ActivityIndicator,
  Alert as RNAlert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ssoUrl } from "../../lib/api";
import { radius, spacing, useTheme } from "../../theme";
import { BrandIcon, Txt, type SsoProvider } from "../../ui";

const PROVIDERS: { key: SsoProvider; label: string }[] = [
  { key: "google", label: "Continue with Google" },
  { key: "github", label: "Continue with GitHub" },
];

/**
 * The identity-provider buttons, one per provider the gateway implements.
 *
 * Both are the same shape and weight on purpose: neither is the recommended
 * path, so promoting one with a filled treatment would be a lie about which
 * account the user has. The mark is what tells them apart.
 */
export function SsoButtons({ disabled }: { disabled?: boolean }) {
  const { colors, dark } = useTheme();
  const [pending, setPending] = useState<SsoProvider | null>(null);

  const handleSso = async (provider: SsoProvider) => {
    if (pending) return;
    setPending(provider);
    try {
      const url = ssoUrl(provider);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        RNAlert.alert("Unable to open browser", "Please check your network connection.");
      }
    } catch (err) {
      RNAlert.alert(
        "Sign in failed",
        err instanceof Error ? err.message : "Could not start SSO login.",
      );
    } finally {
      // The browser hands control back through a deep link, not a return from
      // this call, so the button has to un-stick on a timer. Without it a user
      // who cancels the browser is left staring at a dead control.
      setTimeout(() => setPending(null), 2500);
    }
  };

  return (
    <View style={styles.container}>
      {PROVIDERS.map(({ key, label }) => {
        const busy = pending === key;
        const inert = disabled || pending !== null;

        return (
          <Pressable
            key={key}
            onPress={() => void handleSso(key)}
            disabled={inert}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: inert, busy }}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed
                  ? colors.surfaceHover
                  : dark
                    ? colors.surfaceMuted
                    : colors.surface,
                borderColor: pressed ? colors.lineStrong : colors.line,
                opacity: inert && !busy ? 0.55 : 1,
                shadowOpacity: dark ? 0.25 : 0.05,
              },
            ]}
          >
            <View style={styles.icon}>
              {busy ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <BrandIcon provider={key} size={20} />
              )}
            </View>

            <Txt variant="heading" style={styles.label}>
              {label}
            </Txt>

            {/* Balances the icon so the label sits optically centred rather
                than pushed right by the mark. */}
            <View style={styles.icon} />
          </Pressable>
        );
      })}

      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: colors.line }]} />
        <Txt variant="caption" color="subtle" uppercase style={styles.dividerLabel}>
          or use your email
        </Txt>
        <View style={[styles.line, { backgroundColor: colors.line }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm + 2 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  icon: { width: 24, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerLabel: { fontSize: 10, letterSpacing: 0.8 },
});
