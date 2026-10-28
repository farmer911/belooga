"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { ErrorFallback, type ErrorFallbackProps } from "@/components/common/error-fallback";

export default function RouteError({ error, retry }: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorFallback error={error} retry={retry} />;
}
