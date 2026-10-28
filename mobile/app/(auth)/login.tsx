import React, { useState } from "react";
import { router } from "expo-router";
import { useMobileLoginMutation } from "@/hooks/use-mobile-auth";
import { loginSchema } from "@/lib/schemas";
import { Body, Button, Card, ErrorText, Field, H1, Screen } from "@/lib/ui";

// Google sign-in is intentionally absent: the backend OAuth callback now requires a real
// authorization code + PKCE verifier, which needs expo-auth-session wiring. Email/password only.
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const loginMutation = useMobileLoginMutation();

  const handleSignIn = () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }
    setValidationError(null);
    loginMutation.mutate(parsed.data, {
      onSuccess: () => (router.canGoBack() ? router.back() : router.replace("/")),
    });
  };

  return (
    <Screen testID="mobile-login-screen">
      <Card testID="mobile-login-card">
        <H1 testID="mobile-login-title">Sign In to Belooga</H1>
        <Body testID="mobile-login-subtitle">
          Access your 60s video pitch studio and job application pipeline.
        </Body>
        {validationError ? (
          <Body testID="mobile-login-validation-error" tone="danger">
            {validationError}
          </Body>
        ) : null}
        <ErrorText testID="mobile-login-api-error" error={loginMutation.error} />
        <Field
          testID="mobile-login-email"
          value={email}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          onChangeText={setEmail}
        />
        <Field
          testID="mobile-login-password"
          value={password}
          placeholder="Password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onChangeText={setPassword}
          onSubmitEditing={handleSignIn}
        />
        <Button
          testID="mobile-login-submit"
          label={loginMutation.isPending ? "Signing In..." : "Sign In"}
          disabled={loginMutation.isPending}
          onPress={handleSignIn}
        />
        <Button
          testID="mobile-go-register"
          label="Create Candidate Account"
          variant="secondary"
          onPress={() => router.replace("/register")}
        />
      </Card>
    </Screen>
  );
}
