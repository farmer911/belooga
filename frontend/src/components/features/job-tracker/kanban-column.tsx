"use client";

import React from "react";
import { TrackedJob, KanbanStatus } from "@/hooks/use-job-tracker";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  id: KanbanStatus;
  title: string;
  badgeColor: string;
  icon: string;
  jobs: TrackedJob[];
  onMove: (jobId: string, newStatus: KanbanStatus) => void;
  onDelete: (jobId: string) => void;
}

export function KanbanColumn({
  id,
  title,
  badgeColor,
  icon,
  jobs,
  onMove,
  onDelete,
}: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[260px] max-w-[320px] bg-surface-divider/60 border border-surface-border rounded-xl flex flex-col overflow-hidden shadow-xs">
      {/* Column Header */}
      <div className={`p-3 border-b border-surface-border flex items-center justify-between bg-white ${badgeColor}`}>
        <div className="flex items-center gap-1.5 font-bold text-xs text-typography-main">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-page text-typography-heading font-bold border border-surface-border">
          {jobs.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[350px]">
        {jobs.length === 0 ? (
          <div className="h-32 border border-dashed border-surface-border rounded-lg flex items-center justify-center text-typography-muted text-[11px] bg-white/50">
            Chưa có công việc
          </div>
        ) : (
          jobs.map((job) => (
            <KanbanCard key={job.id} job={job} onMove={onMove} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
