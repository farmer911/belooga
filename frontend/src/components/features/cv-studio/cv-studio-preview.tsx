"use client";

import React, { useRef, useState } from "react";
import { CVData } from "./cv-studio-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CVStudioPreviewProps {
  cvData: CVData;
  fontSize: number;
  lineHeight: number;
  marginSize: number;
  snapOnePage: boolean;
}

export function CVStudioPreview({
  cvData,
  fontSize,
  lineHeight,
  marginSize,
  snapOnePage,
}: CVStudioPreviewProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="lg:col-span-5 flex flex-col bg-slate-900/50 h-full overflow-hidden">
      {/* Top Preview Control Bar */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Xem Trước A4 Chuẩn ATS</span>
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800 bg-emerald-950/40">
            Vector Precision
          </Badge>
          {snapOnePage && (
            <span
              data-testid="snap-indicator"
              className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono"
            >
              🔒 Khóa 1 trang A4
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-400 gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(70, z - 10))}
              className="hover:text-cyan-400 px-1 font-bold"
              title="Thu nhỏ"
            >
              -
            </button>
            <span className="w-9 text-center font-mono text-slate-200">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(130, z + 10))}
              className="hover:text-cyan-400 px-1 font-bold"
              title="Phóng to"
            >
              +
            </button>
          </div>

          <Button
            data-testid="btn-print-cv"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 h-7 flex items-center gap-1"
          >
            <span>🖨️</span> Xuất PDF
          </Button>
        </div>
      </div>

      {/* Sheet Container Viewport */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-950/40">
        <div
          ref={paperRef}
          data-testid="cv-preview-paper"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            padding: `${marginSize}in`,
            fontSize: `${fontSize}pt`,
            lineHeight: lineHeight,
          }}
          className={`w-[210mm] max-w-full bg-white text-slate-900 shadow-2xl rounded-sm transition-all duration-150 select-text ${
            snapOnePage ? "min-h-[297mm] max-h-[297mm] overflow-hidden" : "min-h-[297mm]"
          }`}
        >
          {/* Header Section */}
          <div className="border-b-2 border-slate-900 pb-2 mb-3">
            <h1
              data-testid="cv-preview-name"
              className="font-bold tracking-tight text-slate-900 uppercase"
              style={{ fontSize: `${fontSize * 1.75}pt`, lineHeight: 1.15 }}
            >
              {cvData.fullName || "HỌ VÀ TÊN ỨNG VIÊN"}
            </h1>
            <div
              data-testid="cv-preview-headline"
              className="font-semibold text-slate-700 tracking-wide mt-0.5"
              style={{ fontSize: `${fontSize * 1.1}pt` }}
            >
              {cvData.headline || "Chuyên Viên / Kỹ Sư Công Nghệ Thông Tin"}
            </div>
            <div className="text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 mt-1 font-normal text-[0.9em]">
              {cvData.email && <span>📧 {cvData.email}</span>}
              {cvData.phone && <span>📱 {cvData.phone}</span>}
              <span>📍 Hồ Chí Minh, Việt Nam</span>
              <span>🔗 linkedin.com/in/belooga-talent</span>
            </div>
          </div>

          {/* Professional Summary */}
          {cvData.summary && (
            <div className="mb-3">
              <h2 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-[1em]">
                Tóm Tắt Sự Nghiệp
              </h2>
              <p className="text-slate-800 text-justify font-normal leading-relaxed">
                {cvData.summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          <div data-testid="cv-preview-experience" className="mb-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-[1em]">
              Kinh Nghiệm Chuyên Môn
            </h2>
            <div className="space-y-2.5">
              {cvData.experience.map((exp, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">{exp.company}</span>
                    <span className="text-slate-500 font-mono text-[0.85em]">{exp.period}</span>
                  </div>
                  <div className="italic text-slate-700 font-medium text-[0.95em]">{exp.role}</div>
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-800">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="leading-snug">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          {cvData.skills && (
            <div data-testid="cv-preview-skills" className="mb-3">
              <h2 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-[1em]">
                Kỹ Năng Kỹ Thuật & Công Nghệ
              </h2>
              <p className="text-slate-800 leading-snug">
                <span className="font-semibold text-slate-900">Tech Stack: </span>
                {cvData.skills}
              </p>
            </div>
          )}

          {/* Education */}
          <div>
            <h2 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-[1em]">
              Học Vấn & Bằng Cấp
            </h2>
            <div className="flex justify-between items-baseline">
              <div>
                <span className="font-bold text-slate-900">Đại Học Bách Khoa / ĐH Quốc Gia</span>
                <span className="text-slate-600 block italic text-[0.95em]">Kỹ sư Khoa học Máy tính (GPA: 3.6/4.0)</span>
              </div>
              <span className="text-slate-500 font-mono text-[0.85em]">2017 - 2021</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
