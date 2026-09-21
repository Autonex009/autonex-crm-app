import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, View, type TextInput } from "react-native";
import { loginSchema, type LoginInput } from "@go-crm/types";

import { ApiError, authApi } from "../../lib/api";
import { zodResolver } from "../../lib/zodResolver";
import { useAuthStore } from "../../store/auth";
import { spacing } from "../../theme";
import { Alert, Button, Field, Txt } from "../../ui";
import { AuthLayout } from "./AuthLayout";
import { SsoButtons } from "./SsoButtons";

/**
 * Sign in. Validates against the shared `loginSchema` from @go-crm/types —
 * the same contract the web login form and the Go gateway enforce, so a
 * password the phone accepts is never rejected as malformed server-side.
 */
export function LoginScreen({ onSwitch }: { onSwitch: () => void }) {
  const setSession = useAuthStore((s) => s.setSession);
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver<LoginInput>(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      const { token, user } = await authApi.login(email, password);
      // Setting the session flips the root navigator to the app stack; there
      // is no navigate() call, the tree swaps underneath.
      setSession(token, user);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  });

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up your pipeline where you left it."
      footer={
        <Pressable onPress={onSwitch} hitSlop={10} accessibilityRole="button">
          <Txt variant="label" color="muted">
            Don't have an account? <Txt variant="label" color="accent">Create one</Txt>
          </Txt>
        </Pressable>
      }
    >
      <SsoButtons disabled={isSubmitting} />

      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <Field
            label="Email address"
            icon="mail"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email?.message}
            returnKeyType="next"
            // Moves to the password field rather than dismissing the keyboard,
            // which on Android is what "next" does by default here.
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <Field
            inputRef={passwordRef}
            label="Password"
            icon="lock"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="••••••••"
            secure
            autoComplete="current-password"
            textContentType="password"
            error={errors.password?.message}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        )}
      />

      {formError ? <Alert>{formError}</Alert> : null}

      <View style={styles.submit}>
        <Button block loading={isSubmitting} onPress={onSubmit}>
          Sign in
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: spacing.xs },
});
