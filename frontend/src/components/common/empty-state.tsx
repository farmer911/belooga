import * as React from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonProps["variant"];
  icon?: React.ReactNode;
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  action?: EmptyStateAction | React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  const displayText = subtitle || description;

  const renderAction = () => {
    if (!action) return null;

    if (React.isValidElement(action)) {
      return <div className="mt-5">{action}</div>;
    }

    const { label, onClick, href, variant = "default", icon: actionIcon } = action as EmptyStateAction;

    const buttonContent = (
      <Button
        variant={variant}
        onClick={onClick}
        className={cn(
          "font-medium",
          variant === "default" && "bg-[#5bbbae] hover:bg-[#497d76] text-white"
        )}
      >
        {actionIcon && <span className="mr-2">{actionIcon}</span>}
        {label}
      </Button>
    );

    if (href) {
      return (
        <div className="mt-5">
          <Link href={href}>{buttonContent}</Link>
        </div>
      );
    }

    return <div className="mt-5">{buttonContent}</div>;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-[#d1d6da] bg-white transition-all",
        className
      )}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d7ecea] text-[#21655e] mb-4 shadow-2xs">
        {icon || <FolderOpen className="h-7 w-7" aria-hidden="true" />}
      </div>

      <h3 className="text-base font-semibold text-[#252525]">{title}</h3>

      {displayText && (
        <p className="text-sm text-[#737475] max-w-sm mt-1 leading-relaxed">
          {displayText}
        </p>
      )}

      {renderAction()}
    </div>
  );
}
