"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { useATSDiagnostics, ATSScanPayload, ATSScanResult } from "./use-ats-diagnostics";

export interface ATSScanHistoryItem {
  id?: string;
  match_id?: string;
  job_title: string;
  company_name?: string;
  ats_score: number;
  created_at?: string;
}

export function useATSScanHistory() {
  return useQuery<ATSScanHistoryItem[]>({
    queryKey: ["ats-scan-history"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ATSScanHistoryItem[] | { items?: ATSScanHistoryItem[] }>("/v1/match/history");
        return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      } catch {
        return [];
      }
    },
    retry: false,
  });
}

export function useATSScan() {
  const diagnostics = useATSDiagnostics();
  const { data: scanHistory = [], refetch: refetchHistory } = useATSScanHistory();
  return {
    ...diagnostics,
    scanHistory,
    refetchHistory,
  };
}

export type { ATSScanPayload, ATSScanResult };
