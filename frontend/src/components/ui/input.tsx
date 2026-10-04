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
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#252525] placeholder:text-[#737475] transition-all",
          "border-[#d1d6da] focus:outline-none focus:ring-2 focus:ring-[#5bbbae] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60",
          error && "border-red-500 text-red-950 focus:ring-red-400 focus:border-transparent",
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
            <div className="absolute left-3 flex items-center pointer-events-none text-[#737475]">
              {leftIcon}
            </div>
          )}
          {inputElement}
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[#737475]">
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
