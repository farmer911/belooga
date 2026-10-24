"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Users, Download, Plus } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RecruiterComparisonMatrix,
  RecruiterPipelineItem,
  RecruiterStage,
} from "@/components/features/recruiter/recruiter-comparison-matrix";
import { RecruiterInviteModal } from "@/components/features/recruiter/recruiter-invite-modal";
import { RecruiterPipelineBoard } from "@/components/features/recruiter/recruiter-pipeline-board";
import { TopCandidatesLeaderboard } from "@/components/features/search/top-candidates-leaderboard";
import { RecruiterAnalyticsPanel } from "@/components/features/analytics/multi-persona-analytics";
import { RecruiterReverseBidAndRoiSuite } from "@/components/features/growth/recruiter-tracker-wallet-suite";
import { prependAndInvalidateList } from "@/lib/query-cache-utils";

export default function RecruiterHiringHubPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [inviteTarget, setInviteTarget] = useState<RecruiterPipelineItem | null>(null);
  const [showDossier, setShowDossier] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: pipeline = [] } = useQuery<RecruiterPipelineItem[]>({
    queryKey: ["recruiter-pipeline"],
    queryFn: async () => {
      const res = await apiClient.get<RecruiterPipelineItem[]>("/v1/recruiter/pipeline");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const stageMutation = useMutation({
    mutationFn: async ({ id, stage, evaluation_notes }: { id: string; stage: RecruiterStage; evaluation_notes?: string }) => {
      await apiClient.patch(`/v1/recruiter/pipeline/${id}`, { stage, evaluation_notes });
      return { id, stage, evaluation_notes };
    },
    onSuccess: ({ id, stage, evaluation_notes }) => {
      queryClient.setQueryData<RecruiterPipelineItem[]>(["recruiter-pipeline"], (prev = []) =>
        prev.map((item) =>
          item.id === id ? { ...item, stage, evaluation_notes: evaluation_notes ?? item.evaluation_notes } : item
        )
      );
    },
  });

  const addCandidateMutation = useMutation({
    mutationFn: async (username: string) => {
      const clean = username.trim().replace(/^@/, "");
      const res = await apiClient.post<RecruiterPipelineItem>("/v1/recruiter/pipeline", {
        username: clean,
        target_role: "Principal Engineer",
      });
      return res.data;
    },
    onSuccess: (created) => {
      prependAndInvalidateList(queryClient, ["recruiter-pipeline"], created);
      setNewUsername("");
      setShowAddForm(false);
    },
  });

  const filteredPipeline = useMemo(
    () => (roleFilter === "ALL" ? pipeline : pipeline.filter((p) => p.target_role === roleFilter)),
    [pipeline, roleFilter]
  );

  const comparedCandidates = useMemo(
    () => pipeline.filter((c) => selectedUsernames.includes(c.username)).slice(0, 3),
    [pipeline, selectedUsernames]
  );

  const toggleCompare = (username: string) => {
    setSelectedUsernames((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev.slice(-2), username]
    );
  };

  return (
    <div data-testid="recruiter-hub-page" className="flex-1 bg-surface-page text-typography-main flex flex-col font-sans">
      <div className="border-b border-surface-border bg-surface-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Briefcase className="w-4 h-4 text-brand-primary" aria-hidden="true" />
          <h1 className="font-bold text-typography-main text-sm">B2B Recruiter Hiring Command Center</h1>
          <Badge variant="outline" className="text-[10px] text-brand-dark border-brand-primary/40 bg-teal-50/50">
            {pipeline.length} Ứng viên trong phễu
          </Badge>
          <select
            aria-label="Lọc theo vị trí tuyển dụng"
            data-testid="recruiter-job-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main"
          >
            <option value="ALL">Tất cả vị trí ({pipeline.length})</option>
            <option value="Principal Engineer">Principal Engineer</option>
            <option value="Staff Full-Stack Engineer">Staff Full-Stack Engineer</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="recruiter-compare-open-btn"
            onClick={() => document.querySelector('[data-testid="recruiter-comparison-matrix"]')?.scrollIntoView({ behavior: "smooth" })}
            className="px-3 py-1.5 rounded-lg bg-brand-overlay text-brand-dark border border-brand-primary/40 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
            <span>So Sánh ({comparedCandidates.length}/3)</span>
          </button>

          <button
            type="button"
            data-testid="recruiter-export-dossier-btn"
            onClick={() => setShowDossier(true)}
            className="px-3 py-1.5 rounded-lg bg-surface-page border border-surface-border text-typography-heading hover:border-brand-primary font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
            <span>Xuất Shortlist Dossier</span>
          </button>

          <Button
            type="button"
            data-testid="recruiter-add-candidate-btn"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg gap-1"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Thêm Ứng Viên</span>
          </Button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCandidateMutation.mutate(newUsername);
          }}
          className="border-b border-surface-border bg-surface-card px-4 py-2.5 flex items-center gap-2 text-xs"
        >
          <input
            type="text"
            data-testid="recruiter-add-username-input"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Nhập username ứng viên (VD: phucnguyen)..."
            className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main w-64"
            required
          />
          <Button type="submit" className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3 rounded-lg">
            Lưu Vào Shortlist
          </Button>
        </form>
      )}

      <div className="flex-1 p-4 space-y-5 max-w-7xl w-full mx-auto">
        <RecruiterAnalyticsPanel />
        <RecruiterReverseBidAndRoiSuite />
        <TopCandidatesLeaderboard variant="spotlight" />
        <RecruiterPipelineBoard
          items={filteredPipeline}
          selectedUsernames={selectedUsernames}
          onToggleCompare={toggleCompare}
          onUpdateStage={(id, stage, evaluation_notes) => stageMutation.mutate({ id, stage, evaluation_notes })}
          onOpenInvite={(cand) => setInviteTarget(cand)}
        />

        <RecruiterComparisonMatrix
          candidates={comparedCandidates}
          onOpenInvite={(cand) => setInviteTarget(cand)}
          showDossier={showDossier}
          onCloseDossier={() => setShowDossier(false)}
        />
      </div>

      <RecruiterInviteModal
        candidate={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onInvited={(username, interviewDate, unlocked) => {
          queryClient.setQueryData<RecruiterPipelineItem[]>(["recruiter-pipeline"], (prev = []) =>
            prev.map((item) =>
              item.username === username
                ? { ...item, stage: "INTERVIEW_INVITED", interview_datetime: interviewDate, contact_unlocked: unlocked }
                : item
            )
          );
        }}
      />
    </div>
  );
}
