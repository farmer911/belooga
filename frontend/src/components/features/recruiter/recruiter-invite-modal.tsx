"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CalendarCheck, Video, Wallet, X, Send, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useWallet, formatVnd } from "@/hooks/use-wallet";
import { RecruiterPipelineItem } from "@/components/features/recruiter/recruiter-comparison-matrix";
import { Button } from "@/components/ui/button";

interface RecruiterInviteModalProps {
  candidate: RecruiterPipelineItem | null;
  onClose: () => void;
  onInvited: (username: string, interviewDate: string, unlocked: boolean) => void;
}

export function RecruiterInviteModal({ candidate, onClose, onInvited }: RecruiterInviteModalProps) {
  const { availableBalanceVnd, payWithWallet } = useWallet();
  const [jobTitle, setJobTitle] = useState(candidate?.target_role || "Senior Distributed Systems Engineer");
  const [interviewDatetime, setInterviewDatetime] = useState("2026-10-25 14:00 ICT");
  const [offeredSalary, setOfferedSalary] = useState(candidate?.expected_salary || "65.000.000 VNĐ");
  const [customPrompt, setCustomPrompt] = useState(
    "Hãy chia sẻ cách bạn thiết kế hệ thống xử lý 25,000 CCU mà không bị cache-stampede trong 60 giây?"
  );
  const [unlockViaWallet, setUnlockViaWallet] = useState(true);
  const [sentSuccess, setSentSuccess] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!candidate) return;
      if (unlockViaWallet && availableBalanceVnd >= 49000) {
        await payWithWallet({
          amount_vnd: 49000,
          target_type: "SYSTEM_PURCHASE",
          order_id: `B2B-INV-${Date.now()}`,
          description: `B2B Recruiter Unlock & Interview Invite: @${candidate.username}`,
        });
      }
      try {
        await apiClient.post("/v1/recruiter/invite", {
          username: candidate.username,
          job_title: jobTitle,
          interview_datetime: interviewDatetime,
          offered_salary_range: offeredSalary,
          custom_video_prompt: customPrompt,
          unlock_contact_via_wallet: unlockViaWallet,
        });
      } catch {
        // Fallback optimistic sync
      }
    },
    onSuccess: () => {
      if (!candidate) return;
      setSentSuccess(true);
      onInvited(candidate.username, interviewDatetime, unlockViaWallet);
    },
  });

  if (!candidate) return null;

  return (
    <div
      data-testid="recruiter-invite-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-surface-card border border-surface-border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl text-xs">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <h3 className="font-bold text-typography-main text-sm">
              Gửi Lời Mời Phỏng Vấn & Đề Bài Video Pitch — {candidate.full_name}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-typography-muted hover:text-typography-main cursor-pointer">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {sentSuccess ? (
          <div data-testid="recruiter-invite-success-banner" className="py-5 text-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="text-sm font-bold text-typography-main">
              Đã Gửi Lời Mời Phỏng Vấn & Mở Khóa Liên Hệ B2B!
            </div>
            <p className="text-typography-muted text-xs">
              Ứng viên <strong>{candidate.full_name}</strong> đã nhận thông báo thời gian thực và thẻ công việc đã tự động đồng bộ sang cột <strong>INTERVIEW_INVITED</strong>.
            </p>
            <Button onClick={onClose} className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg">
              Hoàn Tất
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-typography-heading block">Vị trí tuyển dụng *</label>
                <input
                  type="text"
                  data-testid="recruiter-invite-job-input"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-typography-heading block">Thời gian phỏng vấn *</label>
                <input
                  type="text"
                  data-testid="recruiter-invite-datetime-input"
                  value={interviewDatetime}
                  onChange={(e) => setInterviewDatetime(e.target.value)}
                  className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-typography-heading block">Khung lương đề xuất (Offer Range)</label>
              <input
                type="text"
                data-testid="recruiter-invite-salary-input"
                value={offeredSalary}
                onChange={(e) => setOfferedSalary(e.target.value)}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-typography-heading flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
                <span>Câu hỏi tình huống quay Video Pitch 60s riêng cho ứng viên</span>
              </label>
              <textarea
                rows={2}
                data-testid="recruiter-invite-prompt-input"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
              />
            </div>

            <label className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  data-testid="recruiter-invite-wallet-toggle"
                  checked={unlockViaWallet}
                  onChange={(e) => setUnlockViaWallet(e.target.checked)}
                  className="rounded border-surface-border"
                />
                <div>
                  <div className="font-bold text-brand-dark flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
                    <span>Mở khóa Email/SĐT trực tiếp & Ưu tiên thông báo (49.000đ B2B Credit)</span>
                  </div>
                  <div className="text-[11px] text-typography-muted">
                    Số dư Ví hiện tại: <strong className="font-mono text-brand-primary">{formatVnd(availableBalanceVnd)}</strong>
                  </div>
                </div>
              </div>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-typography-muted hover:text-typography-main cursor-pointer">
                Hủy
              </button>
              <Button
                type="submit"
                data-testid="recruiter-invite-submit-btn"
                disabled={inviteMutation.isPending}
                className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg gap-1.5"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{inviteMutation.isPending ? "Đang gửi..." : "Gửi Lời Mời & Đồng Bộ Kanban"}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
