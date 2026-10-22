"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, HelpCircle, Compass, Flame, ThumbsUp, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";

interface ReferralSlotItem {
  id: string;
  company_name: string;
  referrer_name: string;
  referrer_role: string;
  target_positions: string[];
  bonus_vnd: number;
}

interface InterviewQuestionItem {
  id: string;
  role_title: string;
  difficulty: string;
  question_text: string;
  sample_answer_hint: string;
}

interface CvRoastItem {
  id: string;
  alias: string;
  target_role: string;
  summary: string;
  votes: number;
  ai_roast: string;
}

export function CompanyGrowthSuite({ slug, companyName }: { slug: string; companyName: string }) {
  const queryClient = useQueryClient();
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newHint, setNewHint] = useState("");

  const { data: questions = [] } = useQuery<InterviewQuestionItem[]>({
    queryKey: ["company-interview-questions", slug],
    queryFn: async () => {
      const res = await apiClient.get<InterviewQuestionItem[]>(`/v1/companies/${encodeURIComponent(slug)}/interview-questions`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: referrals = [] } = useQuery<ReferralSlotItem[]>({
    queryKey: ["company-referral-slots", slug],
    queryFn: async () => {
      const res = await apiClient.get<ReferralSlotItem[]>("/v1/growth/referrals", {
        params: { company_slug: slug },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<InterviewQuestionItem>(
        `/v1/companies/${encodeURIComponent(slug)}/interview-questions`,
        {
          role_title: `Senior Engineer @ ${companyName}`,
          difficulty: "Hard",
          question_text: newQuestion.trim(),
          sample_answer_hint: newHint.trim() || "Trình bày theo cấu trúc STAR + số liệu benchmark thực tế.",
        }
      );
      return res.data;
    },
    onSuccess: (created) => {
      if (created) {
        queryClient.setQueryData<InterviewQuestionItem[]>(["company-interview-questions", slug], (prev = []) => [created, ...prev]);
      }
      setNewQuestion("");
      setNewHint("");
      queryClient.invalidateQueries({ queryKey: ["company-interview-questions", slug] });
    },
  });

  const requestReferralMutation = useMutation({
    mutationFn: async (slotId: string) => {
      await apiClient.post("/v1/growth/referrals", { slot_id: slotId });
      return slotId;
    },
    onSuccess: (slotId) => {
      setRequestedIds((p) => [...p, slotId]);
    },
  });

  return (
    <div className="space-y-4 text-xs pt-2">
      <div data-testid="growth-culture-fit-radar" className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Engineering Culture & Team Fit Radar ({companyName})</span>
          </span>
        </div>
      </div>

      <div data-testid="company-interview-questions-section" className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Kho Câu Hỏi Phỏng Vấn Thực Tế ({questions.length} câu hỏi xác thực)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {questions.map((q) => (
            <div key={q.id} className="p-3 rounded-lg bg-surface-page border border-surface-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-typography-main">{q.role_title}</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">{q.difficulty}</span>
              </div>
              <p className="font-semibold text-typography-heading">{q.question_text}</p>
              <p className="text-[11px] text-emerald-700">Gợi ý: {q.sample_answer_hint}</p>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newQuestion.trim()) return;
            addQuestionMutation.mutate();
          }}
          className="flex flex-wrap gap-2 pt-1"
        >
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Đóng góp câu hỏi phỏng vấn thực tế tại công ty này..."
            className="flex-1 min-w-[220px] bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs"
          />
          <input
            type="text"
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            placeholder="Gợi ý hướng giải quyết..."
            className="w-64 bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs"
          />
          <Button type="submit" data-testid="company-question-submit-btn" className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg">
            + Thêm Câu Hỏi
          </Button>
        </form>
      </div>

      <div data-testid="growth-referral-marketplace" className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Employee Referral Marketplace (Xin Referral Nội Bộ Vượt Vòng Sơ Loại)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {referrals.map((slot) => {
            const sent = requestedIds.includes(slot.id);
            return (
              <div key={slot.id} className="p-3 rounded-lg bg-surface-page border border-surface-border flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-typography-main">{slot.referrer_name} · {slot.referrer_role} ({slot.company_name})</div>
                  <div className="text-[11px] text-typography-muted">Vị trí: {slot.target_positions.join(", ")} · Thưởng Referral: {slot.bonus_vnd.toLocaleString("vi-VN")}đ</div>
                </div>
                <Button
                  type="button"
                  data-testid={`referral-request-btn-${slot.id}`}
                  disabled={sent || requestReferralMutation.isPending}
                  onClick={() => requestReferralMutation.mutate(slot.id)}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-7 px-3 rounded-lg shrink-0"
                >
                  {sent ? "✓ Đã Gửi Hồ Sơ" : "Xin Referral"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CommunityCvRoastSection() {
  const queryClient = useQueryClient();
  const [summaryInput, setSummaryInput] = useState("");

  const { data: roasts = [] } = useQuery<CvRoastItem[]>({
    queryKey: ["community-cv-roasts"],
    queryFn: async () => {
      const res = await apiClient.get<CvRoastItem[]>("/v1/growth/cv-roasts");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const submitRoastMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<CvRoastItem>("/v1/growth/cv-roasts", {
        summary: summaryInput.trim(),
      });
      return res.data;
    },
    onSuccess: (created) => {
      if (created) {
        queryClient.setQueryData<CvRoastItem[]>(["community-cv-roasts"], (prev = []) => [created, ...prev]);
      }
      setSummaryInput("");
      queryClient.invalidateQueries({ queryKey: ["community-cv-roasts"] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (roastId: string) => {
      await apiClient.post(`/v1/growth/cv-roasts/${roastId}/vote`, {});
      return roastId;
    },
    onSuccess: (roastId) => {
      queryClient.setQueryData<CvRoastItem[]>(["community-cv-roasts"], (prev = []) =>
        prev.map((item) => (item.id === roastId ? { ...item, votes: item.votes + 1 } : item))
      );
    },
  });

  return (
    <section data-testid="growth-cv-roast-section" className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-sm text-typography-main flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span>Anonymous CV Roast & Resume Battle (Cộng Đồng Góp Ý CV Ẩn Danh)</span>
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={summaryInput}
          onChange={(e) => setSummaryInput(e.target.value)}
          placeholder="Đăng ẩn danh 1 đoạn CV của bạn để cộng đồng & AI Roast thẳng thắn..."
          className="flex-1 bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs"
        />
        <Button
          type="button"
          data-testid="cv-roast-submit-btn"
          disabled={submitRoastMutation.isPending || !summaryInput.trim()}
          onClick={() => submitRoastMutation.mutate()}
          className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3.5 rounded-lg"
        >
          Đăng CV Ẩn Danh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {roasts.map((r) => (
          <div key={r.id} className="p-3.5 rounded-xl bg-surface-page border border-surface-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-typography-main">{r.alias} · {r.target_role}</span>
              <button
                type="button"
                data-testid={`cv-roast-vote-btn-${r.id}`}
                onClick={() => voteMutation.mutate(r.id)}
                className="px-2 py-0.5 rounded bg-surface-card border border-surface-border font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ThumbsUp className="w-3 h-3 text-brand-primary" aria-hidden="true" /> {r.votes}
              </button>
            </div>
            <p className="text-typography-body">{r.summary}</p>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" /> {r.ai_roast}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
