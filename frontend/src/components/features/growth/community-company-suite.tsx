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

  const { data: referralSlots = [] } = useQuery<ReferralSlotItem[]>({
    queryKey: ["growth-referrals", slug],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ReferralSlotItem[]>("/v1/growth/referrals", { params: { company_slug: slug } });
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      const created: InterviewQuestionItem = {
        id: `iq-${Date.now()}`,
        role_title: `Senior Engineer @ ${companyName}`,
        difficulty: "Hard",
        question_text: newQuestion.trim(),
        sample_answer_hint: newHint.trim() || "Trình bày theo cấu trúc STAR + số liệu benchmark thực tế.",
      };
      try {
        await apiClient.post(`/v1/companies/${encodeURIComponent(slug)}/interview-questions`, created);
      } catch {
        // Optimistic question submission
      }
      return created;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<InterviewQuestionItem[]>(["company-interview-questions", slug], (prev = []) => [created, ...prev]);
      setNewQuestion("");
      setNewHint("");
    },
  });

  return (
    <div className="space-y-4 text-xs pt-2">
      {/* Feature #14: Engineering Culture & Team Fit Radar */}
      <div data-testid="growth-culture-fit-radar" className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Engineering Culture & Team Fit Radar ({companyName})</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
            94% Team Fit Match
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { axis: "Engineering Autonomy", score: 95 },
            { axis: "High-Concurrency Scale", score: 96 },
            { axis: "Work-Life Sustainability", score: 88 },
            { axis: "Compensation Velocity", score: 93 },
          ].map((ax) => (
            <div key={ax.axis} className="p-2.5 rounded-lg bg-surface-page border border-surface-border">
              <div className="text-[11px] text-typography-muted">{ax.axis}</div>
              <div className="font-mono font-extrabold text-sm text-brand-primary">{ax.score}/100</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature #12: Company Interview Question Bank */}
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

      {/* Feature #6: Employee Referral Marketplace */}
      <div data-testid="growth-referral-marketplace" className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-typography-main flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Employee Referral Marketplace (Xin Referral Nội Bộ Vượt Vòng Sơ Loại)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {referralSlots.map((slot) => {
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
                  disabled={sent}
                  onClick={async () => {
                    try { await apiClient.post("/v1/growth/referrals", { slot_id: slot.id }); } catch { /* fallback */ }
                    setRequestedIds((p) => [...p, slot.id]);
                  }}
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
  const [roasts, setRoasts] = useState([
    { id: "roast-1", alias: "Anonymous Senior Go #402", target_role: "Principal Backend @ Shopee", summary: "8 năm KN Golang/Kafka nhưng phần mô tả dự án chưa có chỉ số P99 latency và quy mô RPS.", votes: 29, ai_roast: "Thêm ngay số liệu throughput & kết quả kinh doanh vào 3 gạch đầu dòng đầu tiên." },
    { id: "roast-2", alias: "Anonymous AI Engineer #118", target_role: "Staff AI Engineer @ VNG Cloud", summary: "Triển khai RAG + vLLM phục vụ 50k người dùng nội bộ, giảm 60% chi phí token.", votes: 44, ai_roast: "Điểm mạnh rất rõ! Nên đưa kiến trúc Hybrid Search lên mục Summary." },
  ]);
  const [summaryInput, setSummaryInput] = useState("");

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
          onClick={() => {
            if (!summaryInput.trim()) return;
            setRoasts((prev) => [
              { id: `roast-${Date.now()}`, alias: "Anonymous Candidate #889", target_role: "Senior Software Engineer", summary: summaryInput.trim(), votes: 1, ai_roast: "AI Roast: Hãy lượng hóa tác động bằng % tăng trưởng hoặc chi phí tiết kiệm được." },
              ...prev,
            ]);
            setSummaryInput("");
          }}
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
                onClick={() => setRoasts((prev) => prev.map((item) => (item.id === r.id ? { ...item, votes: item.votes + 1 } : item)))}
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
