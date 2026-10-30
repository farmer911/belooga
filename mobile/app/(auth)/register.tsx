import React, { useState } from "react";
import { router } from "expo-router";
import { useMobileRegisterMutation } from "@/hooks/use-mobile-auth";
import { registerSchema } from "@/lib/schemas";
import { Body, Button, Card, ErrorText, Field, H1, Screen } from "@/lib/ui";

export default function RegisterScreen() {
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", password: "" });
  const [validationError, setValidationError] = useState<string | null>(null);
  const registerMutation = useMobileRegisterMutation();
  const update = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = () => {
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid registration details");
      return;
    }
    setValidationError(null);
    registerMutation.mutate(parsed.data, { onSuccess: () => router.replace("/") });
  };

  return (
    <Screen testID="mobile-register-screen">
      <Card testID="mobile-register-card">
        <H1 testID="mobile-register-title">Join Belooga</H1>
        {validationError ? (
          <Body testID="mobile-register-validation-error" tone="danger">
            {validationError}
          </Body>
        ) : null}
        <ErrorText testID="mobile-register-api-error" error={registerMutation.error} />
        <Field testID="mobile-register-first-name" value={form.firstName} placeholder="First name" autoCapitalize="words" onChangeText={update("firstName")} />
        <Field testID="mobile-register-last-name" value={form.lastName} placeholder="Last name" autoCapitalize="words" onChangeText={update("lastName")} />
        <Field testID="mobile-register-username" value={form.username} placeholder="username" onChangeText={update("username")} />
        <Field testID="mobile-register-email" value={form.email} placeholder="you@company.com" keyboardType="email-address" autoComplete="email" onChangeText={update("email")} />
        <Field testID="mobile-register-password" value={form.password} placeholder="Min 8 characters" secureTextEntry autoComplete="new-password" onChangeText={update("password")} />
        <Button
          testID="mobile-register-submit"
          label={registerMutation.isPending ? "Creating Account..." : "Create Account"}
          disabled={registerMutation.isPending}
          onPress={handleRegister}
        />
        <Button
          testID="mobile-go-login"
          label="Already have an account? Sign In"
          variant="secondary"
          onPress={() => router.replace("/login")}
        />
      </Card>
    </Screen>
  );
}
