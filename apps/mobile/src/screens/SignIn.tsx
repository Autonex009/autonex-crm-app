import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { HAIRLINE, spacing, useTheme } from "../theme";
import { Button, Gap, Overline, Txt } from "../ui";

/**
 * Sign in.
 *
 * Email and password only. SSO is deliberately absent: the gateway's flow ends
 * in a browser redirect to the web app's origin carrying the token in a URL
 * fragment, which a native app cannot receive. Wiring it up needs
 * expo-auth-session and a custom-scheme callback on the server, and neither
 * exists yet — offering a button that cannot work would be worse than omitting
 * it.
 */
export function SignInScreen() {
  const t = useTheme();
  const setSession = useAuth((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      // The client stores the refresh token in the Keychain itself; setting the
      // session here is what flips the navigator over to the tabs.
      const { token, user } = await api.login(email.trim(), password);
      setSession(token, user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const field = [
    styles.input,
    { backgroundColor: t.surface, borderColor: t.line, color: t.fg.default },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.canvas }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <View style={[styles.dot, { backgroundColor: t.accent }]} />
        </View>
        <Gap size="lg" />
        <Overline>Autonex</Overline>
        <Gap size="xs" />
        <Txt variant="display">DealBridge</Txt>
        <Gap size="sm" />
        <Txt variant="body" tone="muted">
          Your pipeline, and the alerts that matter.
        </Txt>

        <Gap size="2xl" />

        <Overline>Email</Overline>
        <Gap size="xs" />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@autonexai360.com"
          placeholderTextColor={t.fg.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          style={field}
        />

        <Gap size="md" />

        <Overline>Password</Overline>
        <Gap size="xs" />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={t.fg.subtle}
          secureTextEntry
          textContentType="password"
          onSubmitEditing={submit}
          returnKeyType="go"
          style={field}
        />

        {error ? (
          <>
            <Gap size="md" />
            <Txt variant="caption" tone="bad">
              {error}
            </Txt>
          </>
        ) : null}

        <Gap size="lg" />
        <Button
          title="Sign in"
          onPress={submit}
          loading={busy}
          disabled={!email.trim() || !password}
        />

        <Gap size="lg" />
        <Txt variant="caption" tone="subtle" style={{ textAlign: "center" }}>
          Signing in on a shared phone takes over its notifications.
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["2xl"],
  },
  brandMark: { flexDirection: "row" },
  dot: { width: 28, height: 28, borderRadius: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: HAIRLINE,
    paddingHorizontal: spacing.sm + 4,
    fontSize: 16,
  },
});
