"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useJobTracker() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<TrackedJob[]>("/v1/tracker/jobs/");
      setJobs(response.data);
    } catch (err: unknown) {
      setError("Không thể tải danh sách ứng tuyển.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addJob = useCallback(async (payload: CreateTrackedJobPayload) => {
    try {
      const response = await apiClient.post<TrackedJob>("/v1/tracker/jobs/", payload);
      setJobs((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err: unknown) {
      throw err;
    }
  }, []);

  const moveStatus = useCallback(async (jobId: string, newStatus: KanbanStatus) => {
    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
    try {
      await apiClient.patch<TrackedJob>(`/v1/tracker/jobs/${jobId}/status`, { status: newStatus });
    } catch (err: unknown) {
      // Rollback on error
      fetchJobs();
      throw err;
    }
  }, [fetchJobs]);

  const deleteJob = useCallback(async (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    try {
      await apiClient.delete(`/v1/tracker/jobs/${jobId}`);
    } catch (err: unknown) {
      fetchJobs();
      throw err;
    }
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    fetchJobs,
    addJob,
    moveStatus,
    deleteJob,
  };
}
