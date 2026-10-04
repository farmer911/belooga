import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "white" | "neutral" | "currentColor";
  label?: string;
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      className,
      size = "md",
      variant = "primary",
      label = "Loading...",
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      xs: "h-3.5 w-3.5",
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-10 w-10",
    };

    const variantStyles = {
      primary: "text-[#5bbbae]",
      white: "text-white",
      neutral: "text-[#737475]",
      currentColor: "text-current",
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <Loader2
          className={cn("animate-spin", sizeStyles[size], variantStyles[variant])}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";
