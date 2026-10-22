"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";

export type KanbanStatus = "TARGETING" | "TAILORED" | "APPLIED" | "INTERVIEW" | "OFFER";

export interface TrackedJob {
  id: string;
  candidate_identity_id?: string;
  company_name: string;
  position_title: string;
  status: KanbanStatus;
  expected_salary?: string;
  match_score: number;
  interview_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTrackedJobPayload {
  company_name: string;
  position_title: string;
  status?: KanbanStatus;
  expected_salary?: string;
  match_score?: number;
  notes?: string;
}

export interface JobPipelineAnalytics {
  total_tracked: number;
  stage_counts: Record<string, number>;
  average_ats_match_score: number;
  estimated_offer_probability_pct: number;
  pipeline_velocity_status: string;
  next_recommended_action: string;
}

export interface CareerGoal {
  id: string;
  target_role: string;
  target_salary: string;
  preferred_skills: string;
  location: string;
  updated_at: string;
}

let memoryJobs: TrackedJob[] = [];
let memoryGoal: CareerGoal | null = null;
let localJobSeq = 1;

function readLocalJobs(): TrackedJob[] {
  return memoryJobs;
}

function writeLocalJobs(items: TrackedJob[]): void {
  memoryJobs = items;
}

function readLocalGoal(): CareerGoal | null {
  return memoryGoal;
}

function writeLocalGoal(goal: CareerGoal): void {
  memoryGoal = goal;
}

export function useJobTracker() {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, error: rawError, refetch } = useQuery<TrackedJob[]>({
    queryKey: ["tracked-jobs"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<TrackedJob[]>("/v1/tracker/jobs/");
        const serverJobs = response.data || [];
        const localJobs = readLocalJobs();
        const serverIds = new Set(serverJobs.map((j) => j.id));
        const merged = [...serverJobs, ...localJobs.filter((lj) => !serverIds.has(lj.id))];
        writeLocalJobs(merged);
        return merged;
      } catch {
        return readLocalJobs();
      }
    },
  });

  const { data: careerGoal } = useQuery<CareerGoal>({
    queryKey: ["career-goal"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<CareerGoal>("/v1/tracker/goals");
        if (res.data?.target_role) {
          writeLocalGoal(res.data);
          return res.data;
        }
      } catch {
        // Fallback to local persisted goal
      }
      return (
        readLocalGoal() ?? {
          id: "goal-default",
          target_role: "Senior Backend / Golang Engineer",
          target_salary: "55.000.000 VNĐ",
          preferred_skills: "Golang, PostgreSQL, Kubernetes, System Design",
          location: "Ho Chi Minh / Remote",
          updated_at: new Date().toISOString(),
        }
      );
    },
  });

  const saveGoalMutation = useMutation({
    mutationFn: async (payload: Omit<CareerGoal, "id" | "updated_at">) => {
      const nextGoal: CareerGoal = {
        id: careerGoal?.id || "goal-1",
        ...payload,
        updated_at: new Date().toISOString(),
      };
      writeLocalGoal(nextGoal);
      try {
        const res = await apiClient.post<CareerGoal>("/v1/tracker/goals", payload);
        if (res.data?.target_role) {
          writeLocalGoal(res.data);
          return res.data;
        }
      } catch {
        // Persisted locally as fallback
      }
      return nextGoal;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["career-goal"], saved);
    },
  });

  const { data: analytics = null, refetch: refetchAnalytics } = useQuery<JobPipelineAnalytics>({
    queryKey: ["tracked-jobs-analytics"],
    queryFn: async () => {
      const response = await apiClient.get<JobPipelineAnalytics>("/v1/tracker/jobs/analytics");
      return response.data;
    },
  });

  const error = rawError ? "Không thể tải danh sách ứng tuyển." : null;

  const fetchJobs = useCallback(async () => {
    await Promise.all([refetch(), refetchAnalytics()]);
  }, [refetch, refetchAnalytics]);

  const addJob = useCallback(async (payload: CreateTrackedJobPayload) => {
    let created: TrackedJob;
    try {
      const response = await apiClient.post<TrackedJob>("/v1/tracker/jobs/", payload);
      created = response.data;
    } catch {
      created = {
        id: `local-job-${Date.now()}-${localJobSeq++}`,
        company_name: payload.company_name,
        position_title: payload.position_title,
        status: payload.status ?? "TARGETING",
        expected_salary: payload.expected_salary,
        match_score: payload.match_score ?? 85,
        notes: payload.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    queryClient.setQueryData<TrackedJob[]>(["tracked-jobs"], (prev = []) => {
      const next = [created, ...prev];
      writeLocalJobs(next);
      return next;
    });
    void refetchAnalytics();
    void queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    return created;
  }, [queryClient, refetchAnalytics]);

  const moveStatus = useCallback(async (jobId: string, newStatus: KanbanStatus) => {
    queryClient.setQueryData<TrackedJob[]>(["tracked-jobs"], (prev = []) => {
      const next = prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j));
      writeLocalJobs(next);
      return next;
    });
    try {
      await apiClient.patch<TrackedJob>(`/v1/tracker/jobs/${jobId}/status`, { status: newStatus });
      void refetchAnalytics();
      void queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    } catch {
      // Keep local update if guest/local job
    }
  }, [queryClient, refetchAnalytics]);

  const deleteJob = useCallback(async (jobId: string) => {
    queryClient.setQueryData<TrackedJob[]>(["tracked-jobs"], (prev = []) => {
      const next = prev.filter((j) => j.id !== jobId);
      writeLocalJobs(next);
      return next;
    });
    try {
      await apiClient.delete(`/v1/tracker/jobs/${jobId}`);
      void refetchAnalytics();
      void queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    } catch {
      // Keep local deletion
    }
  }, [queryClient, refetchAnalytics]);

  return {
    jobs,
    analytics,
    careerGoal,
    saveGoal: saveGoalMutation.mutateAsync,
    isSavingGoal: saveGoalMutation.isPending,
    isLoading,
    error,
    fetchJobs,
    addJob,
    moveStatus,
    deleteJob,
  };
}
