"use client";

import { LogIn } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth-store";

/** Shown in place of a user-bound page when nobody is signed in (spinner until the session bootstrap finishes). */
export function SignInPrompt({ next, description }: { next: string; description: string }) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      {isHydrated ? (
        <EmptyState
          data-testid="sign-in-prompt"
          className="max-w-md w-full"
          icon={<LogIn className="h-7 w-7" aria-hidden="true" />}
          title="Sign in required"
          description={description}
          action={{ label: "Sign in", href: `/login?next=${encodeURIComponent(next)}` }}
        />
      ) : (
        <Spinner size="lg" />
      )}
    </div>
  );
}
