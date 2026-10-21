import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScreenShell } from "@/lib/native-runtime";
import { useMobileAuthStore } from "@/store/auth-store";

export const mobileQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export interface RootLayoutProps {
  children?: React.ReactNode;
}

export default function MobileRootLayout({ children }: RootLayoutProps) {
  const isHydrated = useMobileAuthStore((s) => s.isHydrated);

  return (
    <QueryClientProvider client={mobileQueryClient}>
      <ScreenShell testID="mobile-root-shell" mode="dark">
        {isHydrated ? children : <div data-testid="mobile-hydrating-indicator">Loading Secure Vault...</div>}
      </ScreenShell>
    </QueryClientProvider>
  );
}
