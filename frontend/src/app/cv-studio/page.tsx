"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, Target, RotateCcw, Sparkles, CloudUpload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";
import { queueOfflineMutation } from "@/components/providers/service-worker-provider";
import { CVStudioSidebar } from "@/components/features/cv-studio/cv-studio-sidebar";
import { CVStudioEditor, CVData } from "@/components/features/cv-studio/cv-studio-editor";
import { CVStudioPreview } from "@/components/features/cv-studio/cv-studio-preview";

interface MarketPulseResponse {
  total_active_candidates?: number;
  video_pitch_adoption_rate?: number;
  skill_scarcity_index?: Array<{ skill: string; scarcity_score?: number; salary_premium_pct?: string }>;
  skills?: Array<{ skill: string; scarcity_index: number; median_salary_vnd: number }>;
}

const SAMPLE_CV_DATA: CVData = {
  fullName: "NGUYỄN VĂN AN",
  email: "an.nguyen@belooga.vn",
  phone: "+84 901 234 567",
  headline: "Senior Backend Engineer | Golang, Distributed Systems & Kubernetes",
  summary:
    "Kỹ sư Backend với hơn 5 năm kinh nghiệm thiết kế kiến trúc microservices chịu tải cao, thông lượng 50k RPS, tối ưu hóa cơ sở dữ liệu PostgreSQL & Redis cho các nền tảng Fintech và E-commerce.",
  experience: [
    {
      company: "VNG Corporation",
      role: "Senior Backend Engineer",
      period: "2022 - Hiện tại",
      bullets: [
        "Thiết kế và triển khai core payment engine xử lý 30,000 TPS với p99 latency < 25ms bằng Golang và Kafka.",
        "Tái cấu trúc truy vấn PostgreSQL, triển khai Redis cluster caching giúp giảm 45% tải DB chính.",
        "Áp dụng gRPC và Protobuf tối ưu băng thông internal microservices giảm 60% payload size.",
      ],
    },
    {
      company: "FPT Software",
      role: "Software Engineer",
      period: "2020 - 2022",
      bullets: [
        "Phát triển module xác thực OAuth2 & JWT bảo mật cao phục vụ hơn 500,000 người dùng hoạt động hàng ngày.",
        "Tự động hóa quy trình CI/CD với GitLab CI & Docker, rút ngắn thời gian release từ 2 ngày xuống 25 phút.",
      ],
    },
  ],
  skills:
    "Golang, Python, PostgreSQL, Redis, Kafka, Docker, Kubernetes, gRPC, CI/CD, Microservices Architecture, Linux",
};

export default function CVStudioPage() {
  const user = useAuthStore((s) => s.user);
  const activeUsername = user?.username || "alexnguyen";
  const [cvData, setCvData] = useState<CVData>(SAMPLE_CV_DATA);
  const [fontSize, setFontSize] = useState<number>(10.0);
  const [lineHeight, setLineHeight] = useState<number>(1.3);
  const [marginSize, setMarginSize] = useState<number>(0.6);
  const [snapOnePage, setSnapOnePage] = useState<boolean>(true);
  const [savedCloud, setSavedCloud] = useState(false);

  const { data: marketPulse = null } = useQuery<MarketPulseResponse | null>({
    queryKey: ["cv-studio-market-pulse"],
    queryFn: async () => (await apiClient.get<MarketPulseResponse>("/v1/match/market-pulse")).data,
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: cvData.fullName,
        email: cvData.email,
        phone: cvData.phone,
        headline: cvData.headline,
        summary: cvData.summary,
        skills: cvData.skills,
        font_size: fontSize,
        line_height: lineHeight,
        margin_size: marginSize,
        snap_one_page: snapOnePage,
        experience: cvData.experience,
      };
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueOfflineMutation({ url: `/v1/profile/${activeUsername}/cv-draft/`, method: "PUT", body: payload });
        return payload;
      }
      return (await apiClient.put(`/v1/profile/${activeUsername}/cv-draft/`, payload)).data;
    },
    onSuccess: () => {
      setSavedCloud(true);
      setTimeout(() => setSavedCloud(false), 2500);
    },
  });

  const starAudit = useMemo(() => {
    const allBullets = cvData.experience.flatMap((e) => e.bullets).filter((b) => b.trim().length > 0);
    const quantified = allBullets.filter((b) => /\d+(?:%|ms|k|M|x|TPS|RPS|\+)/i.test(b) || /\d+/.test(b)).length;
    const ratio = allBullets.length > 0 ? Math.round((quantified / allBullets.length) * 100) : 0;
    const skillCount = cvData.skills.split(",").filter((s) => s.trim().length > 0).length;
    const readability = Math.min(100, Math.round(ratio * 0.6 + Math.min(40, skillCount * 4)));
    return { ratio, readability, skillCount };
  }, [cvData]);

  const handleResetSample = () => {
    setCvData(SAMPLE_CV_DATA); setFontSize(10.0); setLineHeight(1.3); setMarginSize(0.6);
  };

  const handleAutoFit = () => {
    setFontSize(9.6); setLineHeight(1.25); setMarginSize(0.5); setSnapOnePage(true);
  };

  const handleInjectSkill = (skill: string) => {
    if (!cvData.skills.toLowerCase().includes(skill.toLowerCase())) {
      setCvData({ ...cvData, skills: `${cvData.skills}, ${skill}` });
    }
  };

  return (
    <div className="flex-1 bg-surface-page text-typography-main flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-dark">
      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-surface-border bg-surface-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">Belooga Studio</span>
          <span className="text-surface-border">/</span>
          <span className="text-typography-heading font-medium">Pro CV Studio (Dynamic UI Adjuster)</span>
          <Badge variant="outline" className="text-[10px] text-brand-dark border-brand-primary/40 bg-teal-50/50">
            Zero Dead-Space
          </Badge>
          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
            100% ATS Safe
          </Badge>
        </div>

        {/* Quick presets and tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetSample}
            className="px-2.5 py-1 bg-surface-page hover:bg-surface-divider text-typography-heading rounded-md border border-surface-border transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Nạp Mẫu Chuẩn</span>
          </button>
          <button
            onClick={handleAutoFit}
            className="px-2.5 py-1 bg-teal-50/50 hover:bg-brand-overlay text-brand-dark rounded-md border border-teal-200 transition-colors text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3" aria-hidden="true" />
            <span>Tự Động Tối Ưu Lề</span>
          </button>
          <button
            type="button"
            data-testid="btn-save-cv-cloud"
            disabled={saveDraftMutation.isPending}
            onClick={() => saveDraftMutation.mutate()}
            className="px-2.5 py-1 bg-surface-card hover:bg-surface-page text-typography-heading rounded-md border border-surface-border transition-colors text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            {savedCloud ? <Check className="w-3 h-3 text-emerald-600" /> : <CloudUpload className="w-3 h-3 text-brand-primary" />}
            <span>{savedCloud ? "Đã Lưu Cloud" : "Lưu Bản Nháp Cloud"}</span>
          </button>
          <Link href="/ats-diagnostics">
            <Button className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3 h-7 rounded-lg shadow-xs flex items-center gap-1">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sang Quét ATS</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time STAR Metric Density & 1-Click Market Keyword Injector */}
      <div
        data-testid="cv-studio-ats-density-bar"
        className="border-b border-surface-border bg-teal-50/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-teal-900 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Live ATS Auditor:
          </span>
          <Badge className="bg-teal-600 text-white border-none text-[10px]">
            ATS Readability: {starAudit.readability}/100
          </Badge>
          <Badge variant="outline" className="bg-surface-card border-teal-200 text-teal-800 text-[10px]">
            STAR Metric Density: {starAudit.ratio}%
          </Badge>
        </div>
        {marketPulse && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-600 font-medium">+Chèn nhanh kỹ năng khan hiếm:</span>
            {(marketPulse.skill_scarcity_index ?? marketPulse.skills ?? []).slice(0, 4).map((s) => (
              <button
                key={s.skill}
                type="button"
                onClick={() => handleInjectSkill(s.skill)}
                className="px-2 py-0.5 rounded bg-surface-card hover:bg-teal-50 border border-teal-200 text-teal-800 font-semibold transition-colors cursor-pointer"
              >
                + {s.skill}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main 3-Column Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-140px)]">
        <CVStudioSidebar
          fontSize={fontSize}
          setFontSize={setFontSize}
          lineHeight={lineHeight}
          setLineHeight={setLineHeight}
          marginSize={marginSize}
          setMarginSize={setMarginSize}
          snapOnePage={snapOnePage}
          setSnapOnePage={setSnapOnePage}
        />
        <CVStudioEditor cvData={cvData} onChange={setCvData} />
        <CVStudioPreview
          cvData={cvData}
          fontSize={fontSize}
          lineHeight={lineHeight}
          marginSize={marginSize}
          snapOnePage={snapOnePage}
        />
      </main>

      <footer className="border-t border-surface-border bg-surface-card px-4 py-2 text-[11px] text-typography-muted flex justify-between items-center shadow-xs">
        <div>Hệ điều hành soạn thảo CV: <strong className="text-typography-main">Belooga Pro CV Engine</strong> (Chuẩn Vector A4)</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-700 font-medium">Trạng thái: Sẵn sàng xuất bản chuẩn ATS</span>
        </div>
      </footer>
    </div>
  );
}
