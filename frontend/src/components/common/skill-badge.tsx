"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SkillBadgeProps {
  skill: string;
  onRemove?: (skill: string) => void;
  removable?: boolean;
  variant?: BadgeProps["variant"];
  size?: BadgeProps["size"];
  className?: string;
}

export function SkillBadge({
  skill,
  onRemove,
  removable,
  variant = "teal",
  size = "md",
  className,
}: SkillBadgeProps) {
  const isRemovable = removable ?? Boolean(onRemove);

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant={variant}
      size={size}
      className={cn(
        "inline-flex items-center gap-1.5 transition-all select-none",
        isRemovable && "pr-1.5",
        className
      )}
    >
      <span>{skill}</span>
      {isRemovable && (
        <button
          type="button"
          aria-label={`Remove ${skill}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(skill);
          }}
          className="inline-flex items-center justify-center rounded-full p-0.5 text-current opacity-70 hover:opacity-100 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current transition-opacity cursor-pointer"
        >
          <X className={iconSizes[size || "md"]} aria-hidden="true" />
        </button>
      )}
    </Badge>
  );
}
