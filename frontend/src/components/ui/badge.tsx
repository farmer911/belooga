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
    | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center font-medium rounded-full transition-colors";

    const variantStyles = {
      default:
        "bg-[#5bbbae]/15 text-[#21655e] border border-[#5bbbae]/30",
      primary:
        "bg-[#5bbbae] text-white shadow-xs",
      teal:
        "bg-[#5bbbae]/15 text-[#21655e] border border-[#5bbbae]/30",
      neutral:
        "bg-slate-100 text-[#515151] border border-slate-200",
      outline:
        "border border-[#5bbbae] text-[#5bbbae] bg-transparent hover:bg-[#5bbbae]/10",
      secondary:
        "bg-[#39a0e8]/15 text-[#39a0e8] border border-[#39a0e8]/30",
      destructive:
        "bg-red-50 text-red-700 border border-red-200",
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
