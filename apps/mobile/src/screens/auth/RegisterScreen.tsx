import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { loginSchema } from "@go-crm/types";
import { z } from "zod";

import { ApiError, authApi } from "../../lib/api";
import { zodResolver } from "../../lib/zodResolver";
import { useAuthStore } from "../../store/auth";
import { Alert, Button, Field, Txt } from "../../ui";
import { AuthLayout } from "./AuthLayout";
import { SsoButtons } from "./SsoButtons";

/**
 * Registration contract, identical to apps/web/src/app/auth/schemas.ts: the
 * shared email/password rules plus a client-only confirmation field.
 */
const registerSchema = loginSchema
  .extend({
    name: z.string().optional(),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterScreen({ onSwitch }: { onSwitch: () => void }) {
  const setSession = useAuthStore((s) => s.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver<RegisterInput>(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password, name }) => {
    setFormError(null);
    try {
      const { token, user } = await authApi.register(email, password, name || undefined);
      setSession(token, user);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  });

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your access with Google or create a password."
      footer={
        <Pressable onPress={onSwitch} hitSlop={8}>
          <Txt variant="label" color="muted">
            Already have an account? <Txt variant="label" color="accent">Sign in</Txt>
          </Txt>
        </Pressable>
      }
    >
      <SsoButtons />

      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <Field
            label="Full name"
            icon="user"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Optional"
            autoCapitalize="words"
            autoComplete="name"
            error={errors.name?.message}
          />
        )}
      />

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
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <Field
            label="Password"
            icon="lock"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="At least 8 characters"
            secure
            autoComplete="new-password"
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <Field
            label="Confirm password"
            icon="lock"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Re-enter your password"
            secure
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        )}
      />

      {formError ? <Alert>{formError}</Alert> : null}

      <View>
        <Button block loading={isSubmitting} onPress={onSubmit}>
          Create account
        </Button>
      </View>
    </AuthLayout>
  );
}
