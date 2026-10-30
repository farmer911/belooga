"use client";

import React, { useRef, useState } from "react";
import { Lock, Printer, Mail, Phone, MapPin, Link2 } from "lucide-react";
import { CVData } from "./cv-studio-editor";
import { STANDARD_CV_SECTIONS } from "./cv-studio-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCandidatePdf } from "@/services/media-upload.service";

interface CVStudioPreviewProps {
  cvData: CVData;
  fontSize: number;
  lineHeight: number;
  marginSize: number;
  snapOnePage: boolean;
  username: string;
}

export function CVStudioPreview({
  cvData,
  fontSize,
  lineHeight,
  marginSize,
  snapOnePage,
  username,
}: CVStudioPreviewProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(100);

  const handlePrint = () => {
    void downloadCandidatePdf(username);
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  };

  return (
    <div className="lg:col-span-5 flex flex-col bg-surface-divider/40 h-full overflow-hidden">
      {/* Top Preview Control Bar */}
      <div className="border-b border-surface-border bg-surface-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-typography-main">Xem Trước A4 Chuẩn ATS</span>
          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50 font-semibold">
            Vector Precision
          </Badge>
          {snapOnePage && (
            <span
              data-testid="snap-indicator"
              className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50/50 border border-teal-200 text-brand-dark font-mono font-medium inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Khóa 1 trang A4</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-surface-page border border-surface-border rounded-lg px-2 py-0.5 text-[11px] text-typography-heading gap-1.5">
            <button
              type="button"
              aria-label="Zoom out CV preview"
              onClick={() => setZoom((z) => Math.max(70, z - 10))}
              className="hover:text-brand-primary px-1 font-bold cursor-pointer"
              title="Thu nhỏ"
            >
              -
            </button>
            <span className="w-9 text-center font-mono text-typography-main font-semibold">{zoom}%</span>
            <button
              type="button"
              aria-label="Zoom in CV preview"
              onClick={() => setZoom((z) => Math.min(130, z + 10))}
              className="hover:text-brand-primary px-1 font-bold cursor-pointer"
              title="Phóng to"
            >
              +
            </button>
          </div>

          <Button
            data-testid="btn-print-cv"
            onClick={handlePrint}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs px-3 h-7 rounded-lg shadow-xs flex items-center gap-1 font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Xuất PDF</span>
          </Button>
        </div>
      </div>

      {/* Sheet Container Viewport */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-surface-divider/60">
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
          className={`w-[210mm] max-w-full bg-surface-card text-typography-main shadow-lg rounded-sm transition-all duration-150 select-text border border-surface-border ${
            snapOnePage ? "min-h-[297mm] max-h-[297mm] overflow-hidden" : "min-h-[297mm]"
          }`}
        >
          {/* Header Section */}
          <div className="border-b-2 border-typography-main pb-2 mb-3">
            <h1
              data-testid="cv-preview-name"
              className="font-bold tracking-tight text-typography-main uppercase"
              style={{ fontSize: `${fontSize * 1.75}pt`, lineHeight: 1.15 }}
            >
              {cvData.fullName || "HỌ VÀ TÊN ỨNG VIÊN"}
            </h1>
            <div
              data-testid="cv-preview-headline"
              className="font-semibold text-typography-heading tracking-wide mt-0.5"
              style={{ fontSize: `${fontSize * 1.1}pt` }}
            >
              {cvData.headline || "Chuyên Viên / Kỹ Sư Công Nghệ Thông Tin"}
            </div>
          </div>

          {(cvData.sectionOrder ?? STANDARD_CV_SECTIONS).map((sectionName) => {
            if (sectionName === "Thông tin liên hệ") {
              return (
                <div key={sectionName} data-testid="cv-preview-contact" className="mb-3 pb-1.5 border-b border-surface-border text-typography-body flex flex-wrap gap-x-3 gap-y-0.5 font-normal text-[0.9em]">
                  {cvData.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3" aria-hidden="true" />
                      <span>{cvData.email}</span>
                    </span>
                  )}
                  {cvData.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" aria-hidden="true" />
                      <span>{cvData.phone}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    <span>{cvData.location || "Hồ Chí Minh, Việt Nam"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3" aria-hidden="true" />
                    <span>{cvData.linkedin || "linkedin.com/in/belooga-talent"}</span>
                  </span>
                </div>
              );
            }
            if (sectionName === "Tóm tắt sự nghiệp" && cvData.summary) {
              return (
                <div key={sectionName} className="mb-3">
                  <h2 className="font-bold uppercase tracking-wider text-typography-main border-b border-surface-border pb-0.5 mb-1 text-[1em]">
                    Tóm Tắt Sự Nghiệp
                  </h2>
                  <p className="text-typography-heading text-justify font-normal leading-relaxed">
                    {cvData.summary}
                  </p>
                </div>
              );
            }
            if (sectionName === "Kinh nghiệm làm việc") {
              return (
                <div key={sectionName} data-testid="cv-preview-experience" className="mb-3">
                  <h2 className="font-bold uppercase tracking-wider text-typography-main border-b border-surface-border pb-0.5 mb-1.5 text-[1em]">
                    Kinh Nghiệm Chuyên Môn
                  </h2>
                  <div className="space-y-2.5">
                    {cvData.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-typography-main">{exp.company}</span>
                          <span className="text-typography-muted font-mono text-[0.85em]">{exp.period}</span>
                        </div>
                        <div className="italic text-typography-heading font-medium text-[0.95em]">{exp.role}</div>
                        <ul className="list-disc list-outside pl-4 space-y-0.5 text-typography-heading">
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
              );
            }
            if (sectionName === "Dự án tiêu biểu") {
              const projects = cvData.projects ?? [
                {
                  name: "Belooga High-Scale Talent Engine",
                  role: "Lead Backend Architect",
                  tech: "Golang, FastAPI, PostgreSQL 16 GIN, Redis 7",
                  impact: "Reduced p95 full-text search latency to 11ms across 500k+ candidate profiles.",
                },
              ];
              if (!projects.length) return null;
              return (
                <div key={sectionName} data-testid="cv-preview-projects" className="mb-3">
                  <h2 className="font-bold uppercase tracking-wider text-typography-main border-b border-surface-border pb-0.5 mb-1 text-[1em]">
                    Dự Án Tiêu Biểu
                  </h2>
                  <div className="space-y-1.5">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-typography-main">{proj.name} <span className="italic font-normal text-typography-heading">({proj.role})</span></span>
                          <span className="text-typography-muted font-mono text-[0.85em]">{proj.tech}</span>
                        </div>
                        <p className="text-typography-heading leading-snug">{proj.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (sectionName === "Kỹ năng chuyên môn" && cvData.skills) {
              return (
                <div key={sectionName} data-testid="cv-preview-skills" className="mb-3">
                  <h2 className="font-bold uppercase tracking-wider text-typography-main border-b border-surface-border pb-0.5 mb-1 text-[1em]">
                    Kỹ Năng Kỹ Thuật & Công Nghệ
                  </h2>
                  <p className="text-typography-heading leading-snug">
                    <span className="font-semibold text-typography-main">Tech Stack: </span>
                    {cvData.skills}
                  </p>
                </div>
              );
            }
            if (sectionName === "Học vấn & Bằng cấp") {
              const eduItems = cvData.education ?? [
                {
                  school: "Đại Học Bách Khoa / ĐH Quốc Gia",
                  degree: "Kỹ sư Khoa học Máy tính (GPA: 3.6/4.0)",
                  period: "2017 - 2021",
                },
              ];
              return (
                <div key={sectionName} className="mb-2">
                  <h2 className="font-bold uppercase tracking-wider text-typography-main border-b border-surface-border pb-0.5 mb-1 text-[1em]">
                    Học Vấn & Bằng Cấp
                  </h2>
                  <div className="space-y-1.5">
                    {eduItems.map((edu, idx) => (
                      <div key={idx} className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-typography-main">{edu.school}</span>
                          <span className="text-typography-muted block italic text-[0.95em]">{edu.degree}</span>
                        </div>
                        <span className="text-typography-muted font-mono text-[0.85em]">{edu.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
