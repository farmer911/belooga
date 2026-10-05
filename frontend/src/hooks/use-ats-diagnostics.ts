"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/services/api-client";

export interface STARAnalysisItem {
  original_text: string;
  critique: string;
  suggested_star_rewrite: string;
  metrics_detected: string[];
}

export interface ATSScanResult {
  match_id?: string;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  star_analysis: STARAnalysisItem[];
  parse_warnings: string[];
  breakdown: {
    hard_skills_score?: number;
    impact_score?: number;
    formatting_score?: number;
  };
  created_at: string;
}

export interface ATSScanPayload {
  job_title: string;
  company_name?: string;
  jd_text: string;
  cv_text: string;
}

export function useATSDiagnostics() {
  const [result, setResult] = useState<ATSScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"skills" | "star" | "warnings">("skills");
  const [previewMode, setPreviewMode] = useState<"visual" | "bot_eye">("visual");

  const scanCV = useCallback(async (payload: ATSScanPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<ATSScanResult>("/v1/match/ats-scan", payload);
      setResult(response.data);
      return response.data;
    } catch (err: unknown) {
      let msg = "Không thể phân tích CV. Vui lòng thử lại.";
      if (typeof err === "object" && err !== null && "response" in err) {
        const resp = (err as { response?: { data?: { detail?: string } } }).response;
        if (resp?.data?.detail) {
          msg = resp.data.detail;
        }
      }
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    result,
    isLoading,
    error,
    activeTab,
    previewMode,
    setActiveTab,
    setPreviewMode,
    scanCV,
    setResult,
  };
}
