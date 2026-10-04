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
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#252525] placeholder:text-[#737475] transition-all",
          "border-[#d1d6da] focus:outline-none focus:ring-2 focus:ring-[#5bbbae] focus:border-transparent",
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
