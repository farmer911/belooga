"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import "./globals.css";
import { ErrorFallback, type ErrorFallbackProps } from "@/components/common/error-fallback";

// Replaces the root layout when it fails, so it renders its own <html>/<body>.
export default function GlobalError({ error, retry }: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-surface-page text-typography-main">
        <title>Something went wrong | Belooga</title>
        <ErrorFallback error={error} retry={retry} />
      </body>
    </html>
  );
}
