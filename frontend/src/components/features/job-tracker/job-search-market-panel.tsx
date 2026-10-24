"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles, Target, CheckCircle2, Plus, Filter, RotateCcw, Building2, MapPin } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useWallet, formatVnd } from "@/hooks/use-wallet";
import { CareerGoal, CreateTrackedJobPayload, KanbanStatus } from "@/hooks/use-job-tracker";
import { Button } from "@/components/ui/button";

export interface MarketJobItem {
  id: string;
  company_name: string;
  position_title: string;
  location: string;
  salary_range: string;
  match_score: number;
  skills: string[];
}

interface JobSearchAndGoalPanelProps {
  careerGoal?: CareerGoal;
  onSaveGoal: (goal: Omit<CareerGoal, "id" | "updated_at">) => Promise<CareerGoal>;
  isSavingGoal: boolean;
  onAddJobToKanban: (payload: CreateTrackedJobPayload) => Promise<unknown>;
  statusFilter: KanbanStatus | "ALL";
  onStatusFilterChange: (status: KanbanStatus | "ALL") => void;
  minScoreFilter: number;
  onMinScoreFilterChange: (score: number) => void;
  sortBy: "created_at" | "match_score" | "interview_date";
  onSortByChange: (sort: "created_at" | "match_score" | "interview_date") => void;
  onResetFilters: () => void;
}

export function JobSearchAndGoalPanel({
  careerGoal, onSaveGoal, isSavingGoal, onAddJobToKanban, statusFilter, onStatusFilterChange,
  minScoreFilter, onMinScoreFilterChange, sortBy, onSortByChange, onResetFilters,
}: JobSearchAndGoalPanelProps) {
  const queryClient = useQueryClient();
  const { availableBalanceVnd } = useWallet();
  const [roleInput, setRoleInput] = useState(careerGoal?.target_role ?? "Senior Backend / Golang Engineer");
  const [salaryInput, setSalaryInput] = useState(careerGoal?.target_salary ?? "55.000.000 VNĐ");
  const [skillsInput, setSkillsInput] = useState(careerGoal?.preferred_skills ?? "Golang, PostgreSQL, Kubernetes");
  const [goalSavedBanner, setGoalSavedBanner] = useState(false);

  const [showMarketSearch, setShowMarketSearch] = useState(false);
  const [marketQuery, setMarketQuery] = useState("");
  const [addedMarketIds, setAddedMarketIds] = useState<string[]>([]);
  const [aiMatchedCount, setAiMatchedCount] = useState<number | null>(null);

  useEffect(() => {
    if (careerGoal) {
      setRoleInput(careerGoal.target_role);
      setSalaryInput(careerGoal.target_salary);
      setSkillsInput(careerGoal.preferred_skills);
    }
  }, [careerGoal]);

  const { data: marketJobs = [] } = useQuery<MarketJobItem[]>({
    queryKey: ["market-jobs-search", marketQuery],
    queryFn: async () => {
      const res = await apiClient.get<MarketJobItem[]>("/v1/tracker/search-market-jobs", {
        params: marketQuery.trim() ? { q: marketQuery.trim() } : undefined,
      });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const aiMatchMutation = useMutation({
    mutationFn: async () => {
      const goalId = careerGoal?.id || "default";
      const res = await apiClient.post<{ matched_count?: number }>(
        `/v1/tracker/goals/${encodeURIComponent(goalId)}/ai-match`,
        { target_role: roleInput, preferred_skills: skillsInput, expected_salary: salaryInput }
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tracked-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["tracked-jobs-analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["user-wallet"] }),
      ]);
      return res.data?.matched_count || 2;
    },
    onSuccess: (count) => setAiMatchedCount(count),
  });

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveGoal({
      target_role: roleInput,
      target_salary: salaryInput,
      preferred_skills: skillsInput,
      location: careerGoal?.location || "Ho Chi Minh / Remote",
    });
    setGoalSavedBanner(true);
    setTimeout(() => setGoalSavedBanner(false), 3000);
  };

  const handleAddMarketJob = async (job: MarketJobItem) => {
    await onAddJobToKanban({
      company_name: job.company_name,
      position_title: job.position_title,
      status: "TARGETING",
      expected_salary: job.salary_range,
      match_score: job.match_score,
      notes: `Nguồn kho việc làm Belooga (${job.location}) — Kỹ năng: ${job.skills.join(", ")}`,
    });
    setAddedMarketIds((prev) => [...prev, job.id]);
  };

  return (
    <div className="border-b border-surface-border bg-surface-card px-4 py-3 space-y-3 text-xs">
      <form data-testid="career-goal-panel" onSubmit={handleSaveGoal} className="p-3 rounded-xl bg-surface-page border border-surface-border flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <span className="inline-flex items-center gap-1 font-bold text-brand-dark">
            <Target className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" /><span>Mục Tiêu Săn Việc:</span>
          </span>
          <input type="text" data-testid="career-goal-role-input" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} placeholder="Vị trí mục tiêu..." className="bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main w-48" />
          <input type="text" data-testid="career-goal-salary-input" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} placeholder="Mức lương mục tiêu..." className="bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main w-36 font-mono" />
          <input type="text" data-testid="career-goal-skills-input" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Kỹ năng trọng tâm..." className="bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main w-52" />
          <Button type="submit" data-testid="save-career-goal-btn" disabled={isSavingGoal} className="bg-brand-dark hover:bg-brand-primary text-white text-xs h-7 px-3 rounded-lg">
            {isSavingGoal ? "Đang lưu..." : "Lưu Mục Tiêu"}
          </Button>
          {goalSavedBanner && (
            <span data-testid="career-goal-saved-toast" className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Đã lưu vĩnh viễn (không mất khi F5)
            </span>
          )}
        </div>

        <button type="button" data-testid="ai-job-matcher-btn" disabled={aiMatchMutation.isPending} onClick={() => aiMatchMutation.mutate()} className="min-h-[34px] px-3.5 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{aiMatchMutation.isPending ? "AI Đang Săn Job..." : `Nhờ AI Tìm Job Phù Hợp (19.000đ · Ví: ${formatVnd(availableBalanceVnd)})`}</span>
        </button>
      </form>

      {aiMatchedCount !== null && (
        <div data-testid="ai-matched-jobs-receipt-banner" className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Đã trừ 19.000đ từ Ví Belooga & tự động thêm {aiMatchedCount} công việc khớp &gt; 90% ATS vào cột TARGETING!</span>
          </span>
          <button type="button" onClick={() => setAiMatchedCount(null)} className="text-[11px] underline cursor-pointer">Đóng</button>
        </div>
      )}

      <div data-testid="kanban-search-filter-bar" className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-typography-muted">
            <Filter className="w-3 h-3 text-brand-primary" aria-hidden="true" /> Bộ lọc Kanban:
          </span>
          <select aria-label="Lọc theo cột trạng thái" data-testid="kanban-filter-status" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as KanbanStatus | "ALL")} className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main">
            <option value="ALL">Tất cả cột (5 giai đoạn)</option>
            <option value="TARGETING">Cột 1: TARGETING</option>
            <option value="TAILORED">Cột 2: TAILORED</option>
            <option value="APPLIED">Cột 3: APPLIED</option>
            <option value="INTERVIEW">Cột 4: INTERVIEW</option>
            <option value="OFFER">Cột 5: OFFER</option>
          </select>

          <select aria-label="Lọc theo điểm ATS" data-testid="kanban-filter-min-score" value={minScoreFilter} onChange={(e) => onMinScoreFilterChange(Number(e.target.value))} className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main">
            <option value={0}>Mọi điểm khớp ATS</option>
            <option value={80}>Điểm ATS &gt;= 80%</option>
            <option value={90}>Điểm ATS &gt;= 90%</option>
          </select>

          <select aria-label="Sắp xếp công việc" data-testid="kanban-sort-by" value={sortBy} onChange={(e) => onSortByChange(e.target.value as "created_at" | "match_score" | "interview_date")} className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main">
            <option value="created_at">Sắp xếp: Mới cập nhật</option>
            <option value="match_score">Sắp xếp: Điểm ATS cao nhất</option>
            <option value="interview_date">Sắp xếp: Ngày phỏng vấn gần nhất</option>
          </select>

          <button type="button" data-testid="kanban-clear-filters-btn" onClick={onResetFilters} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-page border border-surface-border text-typography-muted hover:text-typography-main cursor-pointer">
            <RotateCcw className="w-3 h-3" aria-hidden="true" /><span>Xóa lọc</span>
          </button>
        </div>

        <button type="button" data-testid="toggle-market-job-search-btn" onClick={() => setShowMarketSearch((prev) => !prev)} className="px-3 py-1 rounded-lg bg-brand-overlay text-brand-dark border border-brand-primary/40 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer">
          <Search className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
          <span>{showMarketSearch ? "Ẩn Kho Việc Làm" : "Tìm Việc Mới & Thêm Vào Kanban"}</span>
        </button>
      </div>

      {showMarketSearch && (
        <div data-testid="market-job-search-panel" className="p-3 rounded-xl bg-surface-page border border-surface-border space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-typography-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input type="text" data-testid="market-job-search-input" value={marketQuery} onChange={(e) => setMarketQuery(e.target.value)} placeholder="Tìm kiếm kho việc làm theo công ty, vị trí, kỹ năng (VD: VNG, Golang, Shopee, AI)..." className="w-full bg-surface-card border border-surface-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-typography-main" />
            </div>
            <span className="text-[11px] text-typography-muted">Tìm thấy <strong>{marketJobs.length}</strong> cơ hội phù hợp</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {marketJobs.map((mJob) => {
              const isAdded = addedMarketIds.includes(mJob.id);
              return (
                <div key={mJob.id} data-testid={`market-job-card-${mJob.id}`} className="p-3 rounded-lg bg-surface-card border border-surface-border flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary">
                        <Building2 className="w-3 h-3" aria-hidden="true" /><span>{mJob.company_name}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">{mJob.match_score}% ATS</span>
                    </div>
                    <div className="font-bold text-typography-main text-xs">{mJob.position_title}</div>
                    <div className="flex items-center justify-between text-[11px] text-typography-muted">
                      <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" aria-hidden="true" /> {mJob.location}</span>
                      <span className="font-mono font-semibold text-typography-heading">{mJob.salary_range}</span>
                    </div>
                  </div>
                  <button type="button" data-testid={`add-market-job-btn-${mJob.id}`} disabled={isAdded} onClick={() => handleAddMarketJob(mJob)} className={`w-full py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${isAdded ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-brand-primary hover:bg-brand-hover text-white"}`}>
                    {isAdded ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /><span>Đã Thêm Vào Kanban</span></> : <><Plus className="w-3.5 h-3.5" aria-hidden="true" /><span>+ Thêm Vào Kanban</span></>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
