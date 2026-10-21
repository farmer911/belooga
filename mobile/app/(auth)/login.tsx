import React, { useState } from "react";
import { ActionButton, mobileRouter, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import { loginSchema } from "@/lib/schemas";
import { useMobileLoginMutation } from "@/hooks/use-mobile-auth";

export default function MobileLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const loginMutation = useMobileLoginMutation();

  const handleSignIn = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }
    setValidationError(null);
    await loginMutation.mutateAsync(parsed.data);
  };

  return (
    <ScreenShell testID="mobile-login-screen" mode="dark">
      <SurfaceCard testID="mobile-login-card" mode="dark">
        <h1 data-testid="mobile-login-title">Sign In to Belooga Mobile</h1>
        <p data-testid="mobile-login-subtitle">
          Access your 60s video elevator pitch studio and job application pipeline.
        </p>
        {validationError ? (
          <div data-testid="mobile-login-validation-error">{validationError}</div>
        ) : null}
        {loginMutation.isError ? (
          <div data-testid="mobile-login-api-error">
            {loginMutation.error instanceof Error ? loginMutation.error.message : "Login failed"}
          </div>
        ) : null}
        <input
          data-testid="mobile-login-email"
          type="email"
          value={email}
          placeholder="you@company.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          data-testid="mobile-login-password"
          type="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <ActionButton
          testID="mobile-login-submit"
          label={loginMutation.isPending ? "Signing In..." : "Sign In"}
          disabled={loginMutation.isPending}
          onPress={handleSignIn}
        />
        <ActionButton
          testID="mobile-go-register"
          label="Create Candidate Account"
          variant="secondary"
          onPress={() => mobileRouter.push("/(auth)/register")}
        />
      </SurfaceCard>
    </ScreenShell>
  );
}
