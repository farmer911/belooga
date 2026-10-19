import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        className={cn(
          "w-full rounded-lg border bg-surface-card px-3.5 py-2.5 text-sm text-typography-main placeholder:text-typography-muted transition-all",
          "border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60",
          error && "border-red-500 text-red-950 focus:ring-red-400 focus:border-transparent",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
