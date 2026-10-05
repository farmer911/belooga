"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CVStudioSidebar } from "@/components/features/cv-studio/cv-studio-sidebar";
import { CVStudioEditor, CVData } from "@/components/features/cv-studio/cv-studio-editor";
import { CVStudioPreview } from "@/components/features/cv-studio/cv-studio-preview";

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
  const [cvData, setCvData] = useState<CVData>(SAMPLE_CV_DATA);
  const [fontSize, setFontSize] = useState<number>(10.0);
  const [lineHeight, setLineHeight] = useState<number>(1.3);
  const [marginSize, setMarginSize] = useState<number>(0.6);
  const [snapOnePage, setSnapOnePage] = useState<boolean>(true);

  const handleResetSample = () => {
    setCvData(SAMPLE_CV_DATA);
    setFontSize(10.0);
    setLineHeight(1.3);
    setMarginSize(0.6);
  };

  const handleAutoFit = () => {
    setFontSize(9.6);
    setLineHeight(1.25);
    setMarginSize(0.5);
    setSnapOnePage(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-400">Belooga Studio</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-medium">Pro CV Studio (Dynamic UI Adjuster)</span>
          <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-800">
            Zero Dead-Space
          </Badge>
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800">
            100% ATS Safe
          </Badge>
        </div>

        {/* Quick presets and tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSample}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition text-[11px]"
          >
            ↺ Nạp Mẫu Chuẩn
          </button>
          <button
            onClick={handleAutoFit}
            className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 transition text-[11px]"
          >
            ⚡ Tự Động Tối Ưu Lề
          </button>
          <Link href="/ats-diagnostics">
            <Button
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-3 h-7 flex items-center gap-1"
            >
              <span>🎯</span> Sang Quét ATS
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 3-Column Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-140px)]">
        {/* Left Column (3 cols): Layout & Typography Controls */}
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

        {/* Center Column (4 cols): STAR Form Content Editor */}
        <CVStudioEditor
          cvData={cvData}
          onChange={setCvData}
        />

        {/* Right Column (5 cols): Live Vector A4 Paper Preview */}
        <CVStudioPreview
          cvData={cvData}
          fontSize={fontSize}
          lineHeight={lineHeight}
          marginSize={marginSize}
          snapOnePage={snapOnePage}
        />
      </main>

      {/* Terminal Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] text-slate-500 flex justify-between items-center">
        <div>Hệ điều hành soạn thảo CV: <strong>Belooga Pro CV Engine</strong> (Chuẩn Vector A4)</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-400">Trạng thái: Sẵn sàng xuất bản chuẩn ATS</span>
        </div>
      </footer>
    </div>
  );
}
