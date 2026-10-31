"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorFallbackProps {
  error: Error & { digest?: string };
  retry: () => void;
}

/** Shared UI for app/error.tsx and app/global-error.tsx. Raw messages are shown in development only. */
export function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div role="alert" className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-4">
        <AlertTriangle className="mx-auto h-10 w-10 text-status-warning" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight text-typography-main">Something went wrong</h1>
        <p className="text-sm text-typography-muted">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="text-left text-xs whitespace-pre-wrap rounded-lg border border-surface-border bg-surface-card p-3 text-status-danger">
            {error.message}
          </pre>
        )}
        {error.digest && (
          <p className="text-xs text-typography-muted">
            Error reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={() => retry()} className="gap-2 bg-brand-primary hover:bg-brand-hover text-white">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
          </Button>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" aria-hidden="true" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
