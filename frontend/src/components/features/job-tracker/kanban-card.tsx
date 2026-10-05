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
    <div className="bg-white border border-surface-border rounded-lg p-3 space-y-2 hover:border-brand-primary hover:shadow-xs transition shadow-xs group">
      <div className="flex items-start justify-between gap-1">
        <div>
          <h4 className="font-semibold text-typography-main text-xs line-clamp-1">{job.position_title}</h4>
          <p className="text-[11px] text-brand-primary font-medium">{job.company_name}</p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 font-bold ${
            job.match_score >= 80
              ? "text-emerald-700 border-emerald-300 bg-emerald-50"
              : job.match_score >= 60
              ? "text-amber-700 border-amber-300 bg-amber-50"
              : "text-typography-muted border-surface-border bg-surface-page"
          }`}
        >
          {job.match_score}% Match
        </Badge>
      </div>

      {job.expected_salary && (
        <div className="text-[10px] text-typography-heading flex items-center gap-1 font-medium">
          <span>💰</span> {job.expected_salary}
        </div>
      )}

      {job.notes && (
        <p className="text-[10px] text-typography-body bg-surface-page p-1.5 rounded-md border border-surface-divider line-clamp-2">
          {job.notes}
        </p>
      )}

      {/* Action Footer */}
      <div className="pt-1.5 flex items-center justify-between border-t border-surface-divider text-[10px]">
        <button
          onClick={() => onDelete(job.id)}
          className="text-typography-muted hover:text-rose-600 transition cursor-pointer"
          title="Xóa công việc"
        >
          ✕
        </button>

        <div className="flex items-center gap-1">
          {prev && (
            <button
              onClick={() => onMove(job.id, prev)}
              className="px-2 py-0.5 bg-surface-page hover:bg-surface-divider text-typography-heading rounded border border-surface-border text-[10px] cursor-pointer"
              title="Lùi cột"
            >
              ←
            </button>
          )}
          {next && (
            <button
              onClick={() => onMove(job.id, next)}
              className="px-2 py-0.5 bg-teal-50/50 hover:bg-brand-overlay text-brand-dark rounded border border-teal-200 text-[10px] font-semibold cursor-pointer"
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
