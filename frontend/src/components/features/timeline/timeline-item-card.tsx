"use client";

import * as React from "react";
import { GripVertical, Trash2, Calendar, Briefcase } from "lucide-react";

export interface TimelineItemCardProps {
  id: string;
  index?: number;
  title: string;
  companyName: string;
  fromYear?: number | string;
  toYear?: number | string | null;
  currentlyWorkHere?: boolean;
  description?: string;
  isDraggable?: boolean;
  isDragged?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDelete?: () => void;
  isEditable?: boolean;
}

export const TimelineItemCard = React.memo(function TimelineItemCard({
  id,
  index,
  title,
  companyName,
  fromYear = 2022,
  toYear = "Present",
  currentlyWorkHere = false,
  description,
  isDraggable = true,
  isDragged = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  isEditable = true,
}: TimelineItemCardProps) {
  const companyInitials = companyName
    ? companyName.slice(0, 2).toUpperCase()
    : "EXP";

  const dateText = `${fromYear} — ${currentlyWorkHere ? "Present" : toYear || "Present"}`;

  return (
    <div
      data-testid="timeline-job-card"
      draggable={isDraggable ? "true" : undefined}
      onDragStart={isDraggable ? onDragStart : undefined}
      onDragOver={isDraggable ? onDragOver : undefined}
      onDrop={isDraggable ? onDrop : undefined}
      className={`group flex items-start gap-4 p-4 rounded-lg border transition-all select-none ${
        isDraggable ? "cursor-move" : ""
      } ${
        isDragged
          ? "opacity-40 border-dashed border-[#5bbbae] bg-slate-50"
          : isDragOver
          ? "border-[#5bbbae] bg-teal-50/40 shadow-md scale-[1.01]"
          : "border-[#d1d6da] bg-[#f8f9fa] hover:border-[#5bbbae]"
      }`}
    >
      {isEditable && isDraggable && (
        <div className="text-slate-400 group-hover:text-[#5bbbae] pt-1" data-testid="dnd-handle">
          <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
        </div>
      )}

      {/* Clean Badge Icon */}
      <div className="w-12 h-12 rounded-lg bg-[#5bbbae]/10 border border-[#5bbbae]/20 flex items-center justify-center flex-shrink-0 text-[#21655e] font-bold text-base">
        {companyInitials || <Briefcase className="w-5 h-5 text-[#5bbbae]" />}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#252525]">{title}</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {dateText}
            </span>
            {isEditable && onDelete && (
              <button
                type="button"
                data-testid="delete-experience-btn"
                onClick={onDelete}
                className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                title="Delete experience"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs font-semibold text-[#5bbbae]">{companyName}</p>
        {description && (
          <p className="text-xs text-[#666666] leading-relaxed pt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});
