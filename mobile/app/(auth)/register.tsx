import React, { useState } from "react";
import { ActionButton, mobileRouter, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import { registerSchema } from "@/lib/schemas";
import { useMobileRegisterMutation } from "@/hooks/use-mobile-auth";

export default function MobileRegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const registerMutation = useMobileRegisterMutation();

  const handleRegister = async () => {
    const parsed = registerSchema.safeParse({
      firstName,
      lastName,
      username,
      email,
      password,
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid registration details");
      return;
    }
    setValidationError(null);
    await registerMutation.mutateAsync(parsed.data);
  };

  return (
    <ScreenShell testID="mobile-register-screen" mode="dark">
      <SurfaceCard testID="mobile-register-card" mode="dark">
        <h1 data-testid="mobile-register-title">Join Belooga Mobile</h1>
        {validationError ? (
          <div data-testid="mobile-register-validation-error">{validationError}</div>
        ) : null}
        <input
          data-testid="mobile-register-first-name"
          value={firstName}
          placeholder="First name"
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          data-testid="mobile-register-last-name"
          value={lastName}
          placeholder="Last name"
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          data-testid="mobile-register-username"
          value={username}
          placeholder="username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          data-testid="mobile-register-email"
          type="email"
          value={email}
          placeholder="you@company.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          data-testid="mobile-register-password"
          type="password"
          value={password}
          placeholder="Min 8 characters"
          onChange={(e) => setPassword(e.target.value)}
        />
        <ActionButton
          testID="mobile-register-submit"
          label={registerMutation.isPending ? "Creating Account..." : "Create Account"}
          disabled={registerMutation.isPending}
          onPress={handleRegister}
        />
        <ActionButton
          testID="mobile-go-login"
          label="Already have an account? Sign In"
          variant="secondary"
          onPress={() => mobileRouter.replace("/(auth)/login")}
        />
      </SurfaceCard>
    </ScreenShell>
  );
}
