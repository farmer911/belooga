import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "teal"
    | "neutral"
    | "outline"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center font-medium rounded-full transition-colors";

    const variantStyles = {
      default:
        "bg-brand-primary/15 text-brand-dark border border-brand-primary/30",
      primary:
        "bg-brand-primary text-white shadow-xs",
      teal:
        "bg-brand-primary/15 text-brand-dark border border-brand-primary/30",
      neutral:
        "bg-surface-divider text-typography-heading border border-surface-border",
      outline:
        "border border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary/10",
      secondary:
        "bg-brand-blue/15 text-brand-blue border border-brand-blue/30",
      success:
        "bg-status-success/15 text-status-success border border-status-success/30",
      warning:
        "bg-status-warning/15 text-status-warning border border-status-warning/30",
      info:
        "bg-status-info/15 text-status-info border border-status-info/30",
      destructive:
        "bg-status-danger/15 text-status-danger border border-status-danger/30",
    };

    const sizeStyles = {
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-2.5 py-1",
      lg: "text-sm px-3 py-1.5",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
