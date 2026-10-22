"use client";

import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Trophy, Plus, Target, Zap, Send, PenLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/services/api-client";
import { useJobTracker, KanbanStatus, TrackedJob } from "@/hooks/use-job-tracker";
import { KanbanColumn } from "@/components/features/job-tracker/kanban-column";
import { AddJobDialog } from "@/components/features/job-tracker/add-job-dialog";
import { JobSearchAndGoalPanel } from "@/components/features/job-tracker/job-search-market-panel";
import { TrackerCalendarAndPulseSuite } from "@/components/features/growth/recruiter-tracker-wallet-suite";

export default function JobTrackerKanbanPage() {
  const queryClient = useQueryClient();
  const { jobs, analytics, careerGoal, saveGoal, isSavingGoal, isLoading, addJob, moveStatus, deleteJob } = useJobTracker();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<KanbanStatus | "ALL">("ALL");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"created_at" | "match_score" | "interview_date">("created_at");
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    company_name: "",
    position_title: "",
    expected_salary: "",
    notes: "",
    interview_date: "",
  });

  const editJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      try {
        const res = await apiClient.patch<TrackedJob>(`/v1/tracker/jobs/${jobId}`, {
          company_name: editForm.company_name,
          position_title: editForm.position_title,
          expected_salary: editForm.expected_salary || undefined,
          notes: editForm.notes || undefined,
          interview_date: editForm.interview_date || undefined,
        });
        return res.data;
      } catch {
        return {
          id: jobId,
          company_name: editForm.company_name,
          position_title: editForm.position_title,
          expected_salary: editForm.expected_salary || undefined,
          notes: editForm.notes || undefined,
          interview_date: editForm.interview_date || undefined,
        } as Partial<TrackedJob> & { id: string };
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<TrackedJob[]>(["tracked-jobs"], (prev = []) =>
        prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j))
      );
      setEditingJobId(null);
    },
  });

  const startEditingJob = (job: TrackedJob) => {
    setEditingJobId(job.id);
    setEditForm({
      company_name: job.company_name,
      position_title: job.position_title,
      expected_salary: job.expected_salary ?? "",
      notes: job.notes ?? "",
      interview_date: job.interview_date ? job.interview_date.slice(0, 10) : "",
    });
  };

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs
      .filter((j) => {
        if (statusFilter !== "ALL" && j.status !== statusFilter) return false;
        if (minScoreFilter > 0 && (j.match_score ?? 0) < minScoreFilter) return false;
        if (!q) return true;
        return (
          j.company_name.toLowerCase().includes(q) ||
          j.position_title.toLowerCase().includes(q) ||
          (j.expected_salary ?? "").toLowerCase().includes(q) ||
          (j.notes ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "match_score") return (b.match_score ?? 0) - (a.match_score ?? 0);
        if (sortBy === "interview_date") return (a.interview_date || "9999").localeCompare(b.interview_date || "9999");
        return (b.created_at || "").localeCompare(a.created_at || "");
      });
  }, [jobs, searchQuery, statusFilter, minScoreFilter, sortBy]);

  const getJobsByStatus = (status: KanbanStatus) => filteredJobs.filter((j) => j.status === status);
  const interviewCount = jobs.filter((j) => j.status === "INTERVIEW").length;
  const offerCount = jobs.filter((j) => j.status === "OFFER").length;

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setMinScoreFilter(0);
    setSortBy("created_at");
  };

  return (
    <div className="flex-1 bg-surface-page text-typography-main flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-dark">
      <div className="border-b border-surface-border bg-surface-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">Belooga Workspace</span>
          <span className="text-surface-border">/</span>
          <span className="text-typography-heading font-medium">Job Application Tracker (Kanban)</span>
          <Badge variant="outline" className="text-[10px] uppercase text-brand-dark border-brand-primary/40 bg-teal-50/50">
            {jobs.length} Cơ hội đang theo dõi
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="text"
            data-testid="kanban-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc công ty hoặc vị trí..."
            className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary focus:bg-surface-card w-44 sm:w-56"
          />

          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium">
              <Briefcase className="w-3 h-3" aria-hidden="true" />
              <span>{interviewCount} Phỏng vấn</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
              <Trophy className="w-3 h-3" aria-hidden="true" />
              <span>{offerCount} Offer</span>
            </span>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3.5 h-8 rounded-lg shadow-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Thêm Công Việc</span>
          </Button>
        </div>
      </div>

      <JobSearchAndGoalPanel
        careerGoal={careerGoal} onSaveGoal={saveGoal} isSavingGoal={isSavingGoal} onAddJobToKanban={addJob}
        statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} minScoreFilter={minScoreFilter}
        onMinScoreFilterChange={setMinScoreFilter} sortBy={sortBy} onSortByChange={setSortBy} onResetFilters={resetFilters}
      />
      <TrackerCalendarAndPulseSuite />

      {analytics && (
        <div
          data-testid="job-tracker-velocity-banner"
          className="border-b border-surface-border bg-teal-50/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-brand-dark">Xác Suất Nhận Offer: {analytics.estimated_offer_probability_pct}%</span>
            <span className="text-typography-muted">|</span>
            <span className="text-typography-heading">Điểm ATS Trung Bình: <strong>{analytics.average_ats_match_score}/100</strong></span>
          </div>
          <div className="text-[11px] font-medium text-emerald-800">{analytics.next_recommended_action}</div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="border-b border-surface-border bg-surface-card px-4 py-2 space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-typography-muted inline-flex items-center gap-1">
              <PenLine className="w-3 h-3 text-brand-primary" aria-hidden="true" /> Chỉnh sửa nhanh thẻ Kanban:
            </span>
            {jobs.slice(0, 6).map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => startEditingJob(job)}
                className={`px-2 py-0.5 rounded border text-[11px] cursor-pointer transition-colors ${
                  editingJobId === job.id ? "bg-brand-primary text-white border-brand-primary font-semibold" : "bg-surface-page text-typography-heading border-surface-border hover:border-brand-primary"
                }`}
              >
                {job.company_name} — {job.position_title}
              </button>
            ))}
          </div>

          {editingJobId && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editJobMutation.mutate(editingJobId);
              }}
              className="grid grid-cols-1 sm:grid-cols-6 gap-2 pt-1 items-center"
            >
              <input type="text" value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} placeholder="Tên công ty" className="bg-surface-page border border-surface-border rounded-lg px-2 py-1 text-xs text-typography-main" />
              <input type="text" value={editForm.position_title} onChange={(e) => setEditForm({ ...editForm, position_title: e.target.value })} placeholder="Vị trí ứng tuyển" className="bg-surface-page border border-surface-border rounded-lg px-2 py-1 text-xs text-typography-main" />
              <input type="text" value={editForm.expected_salary} onChange={(e) => setEditForm({ ...editForm, expected_salary: e.target.value })} placeholder="Mức lương kỳ vọng" className="bg-surface-page border border-surface-border rounded-lg px-2 py-1 text-xs text-typography-main" />
              <input type="date" value={editForm.interview_date} onChange={(e) => setEditForm({ ...editForm, interview_date: e.target.value })} className="bg-surface-page border border-surface-border rounded-lg px-2 py-1 text-xs text-typography-main" />
              <input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Ghi chú phỏng vấn" className="bg-surface-page border border-surface-border rounded-lg px-2 py-1 text-xs text-typography-main" />
              <div className="flex items-center gap-1.5">
                <Button type="submit" disabled={editJobMutation.isPending} className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-7 px-2.5 rounded-lg gap-1">
                  <Check className="w-3 h-3" /> Lưu
                </Button>
                <button type="button" onClick={() => setEditingJobId(null)} className="px-2 py-1 text-typography-muted hover:text-typography-main text-xs cursor-pointer">Hủy</button>
              </div>
            </form>
          )}
        </div>
      )}

      <main className="flex-1 p-4 overflow-x-auto flex gap-3.5 min-h-[calc(100vh-140px)]">
        {isLoading && jobs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center"><Spinner className="w-8 h-8 text-brand-primary" /></div>
        ) : (
          <>
            <KanbanColumn id="TARGETING" title="Nhắm Mục Tiêu" icon={<Target className="w-3.5 h-3.5" aria-hidden="true" />} badgeColor="border-t-2 border-t-brand-primary" jobs={getJobsByStatus("TARGETING")} onMove={moveStatus} onDelete={deleteJob} onEdit={startEditingJob} />
            <KanbanColumn id="TAILORED" title="Đã Tối Ưu CV" icon={<Zap className="w-3.5 h-3.5" aria-hidden="true" />} badgeColor="border-t-2 border-t-brand-blue" jobs={getJobsByStatus("TAILORED")} onMove={moveStatus} onDelete={deleteJob} onEdit={startEditingJob} />
            <KanbanColumn id="APPLIED" title="Đã Nộp Đơn" icon={<Send className="w-3.5 h-3.5" aria-hidden="true" />} badgeColor="border-t-2 border-t-purple-500" jobs={getJobsByStatus("APPLIED")} onMove={moveStatus} onDelete={deleteJob} onEdit={startEditingJob} />
            <KanbanColumn id="INTERVIEW" title="Đang Phỏng Vấn" icon={<Briefcase className="w-3.5 h-3.5" aria-hidden="true" />} badgeColor="border-t-2 border-t-amber-500" jobs={getJobsByStatus("INTERVIEW")} onMove={moveStatus} onDelete={deleteJob} onEdit={startEditingJob} />
            <KanbanColumn id="OFFER" title="Nhận Offer / Hired" icon={<Trophy className="w-3.5 h-3.5" aria-hidden="true" />} badgeColor="border-t-2 border-t-emerald-500" jobs={getJobsByStatus("OFFER")} onMove={moveStatus} onDelete={deleteJob} onEdit={startEditingJob} />
          </>
        )}
      </main>

      <AddJobDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={addJob} />
    </div>
  );
}
