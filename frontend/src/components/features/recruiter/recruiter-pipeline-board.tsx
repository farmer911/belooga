"use client";

import React from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { RecruiterPipelineItem, RecruiterStage } from "@/components/features/recruiter/recruiter-comparison-matrix";

export const RECRUITER_STAGES: Array<{ id: RecruiterStage; label: string }> = [
  { id: "SHORTLISTED", label: "1. Đã Lưu (Shortlisted)" },
  { id: "PITCH_REVIEWED", label: "2. Đã Xem Video Pitch" },
  { id: "INTERVIEW_INVITED", label: "3. Mời Phỏng Vấn" },
  { id: "OFFER_SENT", label: "4. Đề Xuất Offer" },
  { id: "HIRED", label: "5. Đã Tuyển (Hired)" },
];

interface RecruiterPipelineBoardProps {
  items: RecruiterPipelineItem[];
  selectedUsernames: string[];
  onToggleCompare: (username: string) => void;
  onUpdateStage: (id: string, stage: RecruiterStage, evaluation_notes?: string) => void;
  onOpenInvite: (candidate: RecruiterPipelineItem) => void;
}

export function RecruiterPipelineBoard({
  items,
  selectedUsernames,
  onToggleCompare,
  onUpdateStage,
  onOpenInvite,
}: RecruiterPipelineBoardProps) {
  return (
    <div data-testid="recruiter-pipeline-board" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {RECRUITER_STAGES.map((st) => {
        const colItems = items.filter((p) => p.stage === st.id);
        return (
          <div key={st.id} data-testid={`recruiter-column-${st.id}`} className="p-3 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
            <div className="flex items-center justify-between border-b border-surface-border pb-2">
              <span className="text-xs font-bold text-typography-main">{st.label}</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-page text-[11px] font-bold">{colItems.length}</span>
            </div>
            <div className="space-y-2.5">
              {colItems.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-typography-muted border border-dashed border-surface-border rounded-lg">
                  Chưa có ứng viên ở bước này
                </div>
              ) : (
                colItems.map((item) => (
                  <div key={item.id} data-testid={`recruiter-pipeline-card-${item.id}`} className="p-3 rounded-lg bg-surface-page border border-surface-border space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary cursor-pointer">
                        <input
                          type="checkbox"
                          data-testid={`recruiter-compare-checkbox-${item.username}`}
                          checked={selectedUsernames.includes(item.username)}
                          onChange={() => onToggleCompare(item.username)}
                        />
                        <span>So sánh</span>
                      </label>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        {item.ats_score}% ATS
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-typography-main">{item.full_name}</div>
                      <div className="text-[11px] text-typography-muted">{item.headline}</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold text-typography-heading">{item.expected_salary}</span>
                      <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-current" aria-hidden="true" /> {item.recruiter_rating}/5
                      </span>
                    </div>
                    <input
                      type="text"
                      data-testid={`recruiter-notes-input-${item.id}`}
                      defaultValue={item.evaluation_notes}
                      onBlur={(e) => onUpdateStage(item.id, item.stage, e.target.value)}
                      className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-[11px] text-typography-muted"
                    />
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <select
                        aria-label="Chuyển giai đoạn tuyển dụng"
                        data-testid={`recruiter-stage-select-${item.id}`}
                        value={item.stage}
                        onChange={(e) => onUpdateStage(item.id, e.target.value as RecruiterStage)}
                        className="bg-surface-card border border-surface-border rounded px-1.5 py-1 text-[11px] text-typography-main flex-1"
                      >
                        {RECRUITER_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        data-testid={`recruiter-invite-open-btn-${item.username}`}
                        onClick={() => onOpenInvite(item)}
                        className="px-2.5 py-1 rounded bg-brand-primary hover:bg-brand-hover text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {item.contact_unlocked ? <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> : <Send className="w-3 h-3" aria-hidden="true" />}
                        <span>Mời PV</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
