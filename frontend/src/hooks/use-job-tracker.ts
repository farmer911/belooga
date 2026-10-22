"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useJobTracker() {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, error: rawError, refetch } = useQuery<TrackedJob[]>({
    queryKey: ["tracked-jobs"],
    queryFn: async () => {
      const response = await apiClient.get<TrackedJob[]>("/v1/tracker/jobs/");
      return response.data;
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
    const response = await apiClient.post<TrackedJob>("/v1/tracker/jobs/", payload);
    queryClient.setQueryData<TrackedJob[]>(["tracked-jobs"], (prev = []) => [response.data, ...prev]);
    void refetchAnalytics();
    void queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    return response.data;
  }, [queryClient, refetchAnalytics]);

  const moveStatus = useCallback(async (jobId: string, newStatus: KanbanStatus) => {
    queryClient.setQueryData<TrackedJob[]>(["tracked-jobs"], (prev = []) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
    try {
      await apiClient.patch<TrackedJob>(`/v1/tracker/jobs/${jobId}/status`, { status: newStatus });
      void refetchAnalytics();
      void queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    } catch (err: unknown) {
      await refetch();
      throw err;
    }
  }, [queryClient, refetch, refetchAnalytics]);

  const deleteJob = useCallback(async (jobId: string) => {
    queryClient.setQueryData<TrackedJob[]>(["tracked-jobs"], (prev = []) =>
      prev.filter((j) => j.id !== jobId)
    );
    try {
      await apiClient.delete(`/v1/tracker/jobs/${jobId}`);
      void refetchAnalytics();
      void queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    } catch (err: unknown) {
      await refetch();
      throw err;
    }
  }, [queryClient, refetch, refetchAnalytics]);

  return {
    jobs,
    analytics,
    isLoading,
    error,
    fetchJobs,
    addJob,
    moveStatus,
    deleteJob,
  };
}

