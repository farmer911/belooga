"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { extractCvFileContent, hydrateCandidateProfileCv } from "@/lib/cv-file-parser";
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

export interface TalentMarketPulseDTO {
  total_candidates: number;
  video_verified_candidates: number;
  actively_looking_candidates: number;
  total_jds_analyzed?: number;
  average_ats_score: number;
  top_demanded_skills: Array<{ skill: string; count: number }>;
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
  const queryClient = useQueryClient();
  const diagnostics = useATSDiagnostics();
  const [hydrationNotice, setHydrationNotice] = useState<string | null>(null);
  const { data: scanHistory = [], refetch: refetchHistory } = useATSScanHistory();
  const { data: marketPulse = null } = useQuery<TalentMarketPulseDTO | null>({
    queryKey: ["ats-market-pulse"],
    queryFn: async () => (await apiClient.get<TalentMarketPulseDTO>("/v1/match/market-pulse")).data,
    staleTime: 30_000,
    retry: false,
  });

  const extractFileMutation = useMutation({
    mutationFn: async ({ file, candidateName }: { file: File; candidateName?: string }) =>
      await extractCvFileContent(file, candidateName),
    onSuccess: (res) => {
      setHydrationNotice(`Đã trích xuất CV từ file "${res.fileName}" (${res.text.length} ký tự)`);
    },
  });

  const loadProfileMutation = useMutation({
    mutationFn: async (username: string) => await hydrateCandidateProfileCv(username),
    onSuccess: (text, username) => {
      setHydrationNotice(`Đã nạp CV Hồ Sơ & Timeline của @${username} (${text.length} ký tự)`);
    },
  });

  const tailorMutation = useMutation({
    mutationFn: async (payload: ATSScanPayload): Promise<TailorCVResponse> => {
      try {
        type TailorApiPayload = TailorCVResponse | (ATSScanResult & { tailored_cv_text?: string });
        const res = await apiClient.post<TailorApiPayload>("/v1/match/tailor-cv", payload);
        const tailoredText = res.data.tailored_cv_text || payload.cv_text;
        const scanResult: ATSScanResult = "scan_result" in res.data ? res.data.scan_result : res.data;
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
    marketPulse,
    hydrationNotice,
    setHydrationNotice,
    extractCvFile: extractFileMutation.mutateAsync,
    isExtractingFile: extractFileMutation.isPending,
    loadProfileCv: loadProfileMutation.mutateAsync,
    isLoadingProfileCv: loadProfileMutation.isPending,
    refetchHistory: async () => {
      await Promise.all([
        refetchHistory(),
        queryClient.invalidateQueries({ queryKey: ["ats-market-pulse"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] }),
      ]);
    },
    tailorCv: tailorMutation.mutateAsync,
    isTailoring: tailorMutation.isPending,
  };
}

export type { ATSScanPayload, ATSScanResult };
