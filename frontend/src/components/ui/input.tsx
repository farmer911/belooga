import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        className={cn(
          "w-full rounded-lg border bg-surface-card px-3.5 py-2.5 text-sm text-typography-main placeholder:text-typography-muted transition-all",
          "border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-surface-divider disabled:opacity-60",
          error && "border-status-danger text-status-danger focus:ring-status-danger/40 focus:border-transparent",
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          className
        )}
        {...props}
      />
    );

    if (leftIcon || rightIcon) {
      return (
        <div className="relative w-full flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-typography-muted">
              {leftIcon}
            </div>
          )}
          {inputElement}
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-typography-muted">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return inputElement;
  }
);
Input.displayName = "Input";
