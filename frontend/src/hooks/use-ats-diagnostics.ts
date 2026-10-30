"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
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

export interface ShortlistedCandidateItem {
  profile_id: string;
  username: string;
  full_name: string;
  headline: string;
  location: string;
  seeking_status: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  has_video_pitch: boolean;
  video_pitch_url?: string | null;
  avatar_url: string;
}

export interface TalentShortlistResult {
  job_title: string;
  company_name?: string | null;
  extracted_jd_skills: string[];
  pool_telemetry: {
    total_matching_candidates: number;
    video_verified_count: number;
    actively_looking_count: number;
    estimated_salary_p25_vnd: number;
    estimated_salary_p50_vnd: number;
    estimated_salary_p75_vnd: number;
    hiring_difficulty: string;
  };
  candidates: ShortlistedCandidateItem[];
}

export interface InterviewKitResult {
  job_title: string;
  company_name?: string | null;
  video_pitch_script_60s: string;
  star_interview_questions: Array<{
    focus_skill: string;
    question: string;
    star_coaching_tip: string;
  }>;
  closing_questions_for_hiring_manager: string[];
}

export interface ATSScanPayload {
  job_title: string;
  company_name?: string;
  jd_text: string;
  cv_text: string;
}

export function useATSDiagnostics() {
  const [result, setResult] = useState<ATSScanResult | null>(null);
  const [shortlist, setShortlist] = useState<TalentShortlistResult | null>(null);
  const [interviewKit, setInterviewKit] = useState<InterviewKitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"skills" | "star" | "warnings" | "shortlist">("skills");
  const [previewMode, setPreviewMode] = useState<"visual" | "bot_eye">("visual");

  const scanMutation = useMutation({
    mutationFn: async (payload: ATSScanPayload) => {
      // The scan is the product; the recruiter shortlist (signed-in only) and interview kit are extras
      // and must not fail the scan for anonymous visitors.
      const [scanRes, shortlistRes, kitRes] = await Promise.allSettled([
        apiClient.post<ATSScanResult>("/v1/match/ats-scan", payload),
        apiClient.post<TalentShortlistResult>("/v1/match/talent-shortlist", {
          job_title: payload.job_title,
          company_name: payload.company_name,
          jd_text: payload.jd_text,
          limit: 6,
          require_video_pitch: false,
        }),
        apiClient.post<InterviewKitResult>("/v1/match/interview-kit", payload),
      ]);
      if (scanRes.status === "rejected") throw scanRes.reason;
      return {
        scan: scanRes.value.data,
        shortlist: shortlistRes.status === "fulfilled" ? shortlistRes.value.data : null,
        kit: kitRes.status === "fulfilled" ? kitRes.value.data : null,
      };
    },
    onSuccess: (data) => {
      setError(null);
      setResult(data.scan);
      setShortlist(data.shortlist);
      setInterviewKit(data.kit);
    },
    onError: (err: unknown) => {
      let msg = "Không thể phân tích CV. Vui lòng thử lại.";
      if (typeof err === "object" && err !== null && "response" in err) {
        const resp = (err as { response?: { data?: { detail?: string } } }).response;
        if (resp?.data?.detail) {
          msg = resp.data.detail;
        }
      }
      setError(msg);
    },
  });

  const scanCV = useCallback(
    async (payload: ATSScanPayload) => {
      const res = await scanMutation.mutateAsync(payload);
      return res.scan;
    },
    [scanMutation]
  );

  return {
    result,
    shortlist,
    interviewKit,
    isLoading: scanMutation.isPending,
    error,
    activeTab,
    previewMode,
    setActiveTab,
    setPreviewMode,
    scanCV,
    setResult,
  };
}

