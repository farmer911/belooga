"use client";

import React from "react";
import { TrackedJob, KanbanStatus } from "@/hooks/use-job-tracker";
import { Badge } from "@/components/ui/badge";

interface KanbanCardProps {
  job: TrackedJob;
  onMove: (jobId: string, newStatus: KanbanStatus) => void;
  onDelete: (jobId: string) => void;
}

const NEXT_STATUS: Record<KanbanStatus, KanbanStatus | null> = {
  TARGETING: "TAILORED",
  TAILORED: "APPLIED",
  APPLIED: "INTERVIEW",
  INTERVIEW: "OFFER",
  OFFER: null,
};

const PREV_STATUS: Record<KanbanStatus, KanbanStatus | null> = {
  TARGETING: null,
  TAILORED: "TARGETING",
  APPLIED: "TAILORED",
  INTERVIEW: "APPLIED",
  OFFER: "INTERVIEW",
};

export function KanbanCard({ job, onMove, onDelete }: KanbanCardProps) {
  const next = NEXT_STATUS[job.status];
  const prev = PREV_STATUS[job.status];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-3 space-y-2 hover:border-slate-700 transition shadow-sm group">
      <div className="flex items-start justify-between gap-1">
        <div>
          <h4 className="font-semibold text-slate-200 text-xs line-clamp-1">{job.position_title}</h4>
          <p className="text-[11px] text-cyan-400 font-medium">{job.company_name}</p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 font-bold ${
            job.match_score >= 80
              ? "text-emerald-400 border-emerald-800 bg-emerald-950/40"
              : job.match_score >= 60
              ? "text-amber-400 border-amber-800 bg-amber-950/40"
              : "text-slate-400 border-slate-800"
          }`}
        >
          {job.match_score}% Match
        </Badge>
      </div>

      {job.expected_salary && (
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span>💰</span> {job.expected_salary}
        </div>
      )}

      {job.notes && (
        <p className="text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80 line-clamp-2">
          {job.notes}
        </p>
      )}

      {/* Action Footer */}
      <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-[10px]">
        <button
          onClick={() => onDelete(job.id)}
          className="text-slate-500 hover:text-rose-400 transition"
          title="Xóa công việc"
        >
          ✕
        </button>

        <div className="flex items-center gap-1">
          {prev && (
            <button
              onClick={() => onMove(job.id, prev)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px]"
              title="Lùi cột"
            >
              ←
            </button>
          )}
          {next && (
            <button
              onClick={() => onMove(job.id, next)}
              className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 text-[10px] font-semibold"
              title="Tiến cột tiếp theo"
            >
              Tiếp →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
