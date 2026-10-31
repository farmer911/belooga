import * as React from "react";
import { cn } from "@/lib/utils";

export { cn };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variantStyles = {
      default: "bg-brand-primary text-white hover:bg-brand-hover",
      secondary: "bg-brand-blue text-white hover:bg-brand-blue/90",
      outline:
        "border border-brand-primary text-brand-primary hover:bg-brand-primary/10",
      ghost: "hover:bg-surface-divider text-typography-heading",
      destructive: "bg-status-danger text-white hover:bg-status-danger/90",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      default: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
