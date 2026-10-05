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
    <div className="flex-1 min-w-[260px] max-w-[320px] bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
      {/* Column Header */}
      <div className={`p-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 ${badgeColor}`}>
        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
          {jobs.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[350px]">
        {jobs.length === 0 ? (
          <div className="h-32 border border-dashed border-slate-800/80 rounded flex items-center justify-center text-slate-600 text-[11px]">
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
