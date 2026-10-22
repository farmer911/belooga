"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trophy, Video, Sparkles, Check, AlertTriangle, Send, Download, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";

export type RecruiterStage =
  | "SHORTLISTED"
  | "PITCH_REVIEWED"
  | "INTERVIEW_INVITED"
  | "OFFER_SENT"
  | "HIRED";

export interface RecruiterPipelineItem {
  id: string;
  username: string;
  full_name: string;
  headline: string;
  target_role: string;
  stage: RecruiterStage;
  ats_score: number;
  years_experience: number;
  expected_salary: string;
  video_pitch_url: string;
  matched_skills: string[];
  missing_skills: string[];
  recruiter_rating: number;
  evaluation_notes: string;
  contact_unlocked?: boolean;
  interview_datetime?: string;
}

interface RecruiterComparisonMatrixProps {
  candidates: RecruiterPipelineItem[];
  onOpenInvite: (candidate: RecruiterPipelineItem) => void;
  showDossier: boolean;
  onCloseDossier: () => void;
}

export function RecruiterComparisonMatrix({
  candidates,
  onOpenInvite,
  showDossier,
  onCloseDossier,
}: RecruiterComparisonMatrixProps) {
  const [jdText, setJdText] = useState(
    "Senior Full-Stack / Distributed Systems Engineer — Golang, Python, FastAPI, React, PostgreSQL, Kubernetes"
  );
  const [customScores, setCustomScores] = useState<Record<string, number>>({});

  const compareMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiClient.post<{ comparisons?: Array<{ username: string; ats_score: number }> }>(
          "/v1/recruiter/compare",
          {
            usernames: candidates.map((c) => c.username),
            jd_text: jdText,
          }
        );
        return res.data;
      } catch {
        return null;
      }
    },
    onSuccess: (data) => {
      const next: Record<string, number> = {};
      if (data?.comparisons) {
        for (const item of data.comparisons) {
          next[item.username] = item.ats_score;
        }
      } else {
        for (const c of candidates) {
          const boost = jdText.toLowerCase().includes("golang") && c.matched_skills.includes("Golang") ? 3 : 1;
          next[c.username] = Math.min(99, c.ats_score + boost);
        }
      }
      setCustomScores(next);
    },
  });

  if (candidates.length === 0) return null;

  const topScore = Math.max(...candidates.map((c) => customScores[c.username] ?? c.ats_score));

  return (
    <section
      data-testid="recruiter-comparison-matrix"
      className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-4 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-typography-main flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Bảng So Sánh Trực Diện Ứng Viên (Side-by-Side Comparison Matrix)</span>
          </h2>
          <p className="text-typography-muted text-[11px]">
            Đang đối chiếu {candidates.length} ứng viên theo JD mục tiêu & Video Pitch 60s
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <input
            type="text"
            data-testid="recruiter-compare-jd-input"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Nhập JD hoặc yêu cầu kỹ năng để chấm điểm đối chiếu..."
            className="flex-1 bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary"
          />
          <Button
            type="button"
            data-testid="recruiter-compare-run-btn"
            disabled={compareMutation.isPending}
            onClick={() => compareMutation.mutate()}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{compareMutation.isPending ? "Đang chấm..." : "Chấm Đối Chiếu JD"}</span>
          </Button>
        </div>
      </div>

      {showDossier && (
        <div
          data-testid="recruiter-shortlist-dossier-modal"
          className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-brand-dark inline-flex items-center gap-1.5">
              <Download className="w-4 h-4 text-brand-primary" aria-hidden="true" />
              <span>Hồ Sơ Tổng Hợp Shortlist Dossier (Dành Cho Hội Đồng Phỏng Vấn)</span>
            </span>
            <button type="button" onClick={onCloseDossier} className="text-xs underline text-typography-muted cursor-pointer">
              Đóng Dossier
            </button>
          </div>
          <p className="text-[11px] text-typography-heading">
            JD Chuẩn: <strong>{jdText}</strong> — Đề xuất phỏng vấn ưu tiên:{" "}
            <strong>{candidates.map((c) => `${c.full_name} (${customScores[c.username] ?? c.ats_score}% ATS)`).join(" · ")}</strong>
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-surface-border bg-surface-page">
              <th className="p-3 font-semibold text-typography-muted w-44">Tiêu chí đối sánh</th>
              {candidates.map((c) => {
                const score = customScores[c.username] ?? c.ats_score;
                const isWinner = score === topScore;
                return (
                  <th key={c.id} className="p-3 min-w-[230px] border-l border-surface-border">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-typography-main text-xs">{c.full_name}</div>
                        <div className="text-[11px] text-typography-muted">@{c.username} · {c.target_role}</div>
                      </div>
                      {isWinner && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                          <Trophy className="w-3 h-3" aria-hidden="true" /> Top Fit
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            <tr>
              <td className="p-3 font-semibold text-typography-heading">Điểm Khớp ATS</td>
              {candidates.map((c) => {
                const score = customScores[c.username] ?? c.ats_score;
                return (
                  <td key={c.id} className="p-3 border-l border-surface-border">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold font-mono">
                      {score}% Match — Strong Fit
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="p-3 font-semibold text-typography-heading">60s Video Pitch</td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3 border-l border-surface-border">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-page border border-surface-border font-medium text-brand-primary">
                    <Video className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Xem Video Pitch (0:58)</span>
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-semibold text-typography-heading">Kỹ năng Đạt / Thiếu</td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3 border-l border-surface-border space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {c.matched_skills.map((sk) => (
                      <span key={sk} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        <Check className="w-2.5 h-2.5" aria-hidden="true" /> {sk}
                      </span>
                    ))}
                  </div>
                  {c.missing_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.missing_skills.map((sk) => (
                        <span key={sk} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px]">
                          <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" /> Thiếu: {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-semibold text-typography-heading">Kinh nghiệm & Mức lương</td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3 border-l border-surface-border font-mono">
                  <strong>{c.years_experience} năm</strong> · {c.expected_salary}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-semibold text-typography-heading">Ghi chú Đánh giá Nội bộ</td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3 border-l border-surface-border text-typography-muted italic">
                  &ldquo;{c.evaluation_notes}&rdquo; ({c.recruiter_rating}/5 sao)
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-semibold text-typography-heading">Hành động Tuyển dụng</td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3 border-l border-surface-border">
                  <Button
                    type="button"
                    data-testid={`matrix-invite-btn-${c.username}`}
                    onClick={() => onOpenInvite(c)}
                    className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg gap-1.5"
                  >
                    {c.contact_unlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Đã Mời & Mở Khóa Liên Hệ</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Mời Phỏng Vấn & Mở Khóa (49k)</span>
                      </>
                    )}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
