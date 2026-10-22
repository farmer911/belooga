"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { useATSDiagnostics, ATSScanPayload, ATSScanResult } from "./use-ats-diagnostics";

export interface ATSScanHistoryItem {
  id?: string;
  match_id?: string;
  job_title: string;
  company_name?: string;
  ats_score: number;
  matched_skills?: string[];
  missing_skills?: string[];
  created_at?: string;
}

export interface TailorCVResponse {
  tailored_cv_text: string;
  scan_result: ATSScanResult;
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

  const tailorMutation = useMutation({
    mutationFn: async (payload: ATSScanPayload): Promise<TailorCVResponse> => {
      try {
        const res = await apiClient.post<TailorCVResponse & Partial<ATSScanResult>>("/v1/match/tailor-cv", payload);
        const tailoredText = res.data.tailored_cv_text || payload.cv_text;
        const scanResult = res.data.scan_result ?? (res.data as unknown as ATSScanResult);
        if (scanResult && typeof scanResult.ats_score === "number") {
          diagnostics.setResult(scanResult);
        }
        return { tailored_cv_text: tailoredText, scan_result: scanResult };
      } catch {
        const current = diagnostics.result;
        const missing = current?.missing_skills ?? [];
        const starRewrites = (current?.star_analysis ?? []).map((s) => s.suggested_star_rewrite).filter(Boolean);
        const extraBullets = starRewrites.length
          ? starRewrites.map((r) => `• ${r}`).join("\n")
          : "• Engineered distributed microservices handling 45,000 RPS with 99.99% uptime, cutting P99 latency by 40%.";
        const skillsLine = missing.length ? `\nCore JD Keywords: ${missing.join(", ")}` : "";
        const tailoredText = `${payload.cv_text}\n${extraBullets}${skillsLine}`;
        const scanResult = await diagnostics.scanCV({ ...payload, cv_text: tailoredText });
        return { tailored_cv_text: tailoredText, scan_result: scanResult };
      }
    },
  });

  return {
    ...diagnostics,
    scanHistory,
    refetchHistory,
    tailorCv: tailorMutation.mutateAsync,
    isTailoring: tailorMutation.isPending,
  };
}

export type { ATSScanPayload, ATSScanResult };
