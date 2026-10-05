"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useATSDiagnostics, ATSScanPayload } from "@/hooks/use-ats-diagnostics";
import { PRESET_VNG, PRESET_SHOPEE } from "@/components/features/ats-diagnostics/ats-presets";
import { ATSScorecard } from "@/components/features/ats-diagnostics/ats-scorecard";
import { ATSPreviewCanvas } from "@/components/features/ats-diagnostics/ats-preview-canvas";
import { ATSShareCardModal } from "@/components/features/ats-diagnostics/ats-share-card-modal";
import { MomoCheckoutDialog } from "@/components/features/payments/momo-checkout-dialog";

export default function ATSDiagnosticsPage() {
  const [jobTitle, setJobTitle] = useState(PRESET_VNG.job_title);
  const [companyName, setCompanyName] = useState(PRESET_VNG.company_name || "");
  const [jdText, setJdText] = useState(PRESET_VNG.jd_text);
  const [cvText, setCvText] = useState(PRESET_VNG.cv_text);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMomoOpen, setIsMomoOpen] = useState(false);

  const {
    result,
    isLoading,
    error,
    activeTab,
    previewMode,
    setActiveTab,
    setPreviewMode,
    scanCV,
  } = useATSDiagnostics();

  const handleScan = async () => {
    try {
      await scanCV({
        job_title: jobTitle,
        company_name: companyName,
        jd_text: jdText,
        cv_text: cvText,
      });
    } catch {
      // Error handled in hook state
    }
  };

  const applyPreset = (preset: ATSScanPayload) => {
    setJobTitle(preset.job_title);
    setCompanyName(preset.company_name || "");
    setJdText(preset.jd_text);
    setCvText(preset.cv_text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-400">Belooga Studio</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">ATS Diagnostics & JD Matcher</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-cyan-300 border-cyan-800">
            Zero Dead-Space
          </Badge>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Mẫu kiểm tra nhanh:</span>
          <button
            onClick={() => applyPreset(PRESET_VNG)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            Senior Go @ VNG
          </button>
          <button
            onClick={() => applyPreset(PRESET_SHOPEE)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            Frontend Lead @ Shopee
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            data-testid="btn-open-flex-card"
            className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900 text-purple-300 rounded border border-purple-700 transition text-[11px] flex items-center gap-1 font-semibold"
          >
            <span>🧲</span> Flex Thẻ Bài Điểm ATS
          </button>
          <Button
            onClick={handleScan}
            disabled={isLoading}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-4 h-8"
          >
            {isLoading ? <Spinner className="w-4 h-4 mr-2" /> : "⚡ "}
            {isLoading ? "Đang quét đa tác nhân..." : "Quét Điểm ATS Ngay"}
          </Button>
        </div>
      </div>

      {/* Main Workspace (Split-Pane Resizable Grid) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-140px)]">
        {/* LEFT PANE: Input & Interactive Diagnostics (45% -> 5 cols) */}
        <section className="lg:col-span-5 border-r border-slate-800 flex flex-col bg-slate-950/80 overflow-y-auto p-4 space-y-4">
          {/* Target Position Form */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Vị trí mục tiêu</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="vd: Senior Golang Backend"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Công ty tuyển dụng</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="vd: VNG Corporation"
              />
            </div>
          </div>

          {/* JD & CV Input Expanders */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-400 font-medium">Mô tả công việc (JD)</span>
                <span className="text-[10px] text-slate-500">{jdText.length} ký tự</span>
              </div>
              <textarea
                rows={4}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded p-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 resize-y"
                placeholder="Dán nội dung JD tuyển dụng tại đây..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-400 font-medium">Nội dung CV của bạn</span>
                <span className="text-[10px] text-slate-500">{cvText.length} ký tự</span>
              </div>
              <textarea
                rows={5}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded p-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 resize-y"
                placeholder="Dán văn bản CV của bạn tại đây..."
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-400">
              ⚠️ {error}
            </div>
          )}

          {/* Diagnostic Results Card (Appears after scan) */}
          {result ? (
            <ATSScorecard
              result={result}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onPayClick={() => setIsMomoOpen(true)}
            />
          ) : (
            <div className="p-8 border border-dashed border-slate-800 rounded-lg text-center text-slate-500 text-xs space-y-2">
              <div className="text-2xl">⚡</div>
              <div>Bấm nút <strong>"Quét Điểm ATS Ngay"</strong> ở thanh trên để bắt đầu phân tích đa tác nhân.</div>
            </div>
          )}
        </section>

        {/* RIGHT PANE: Dual-Mode Preview (55% -> 7 cols) */}
        <ATSPreviewCanvas
          cvText={cvText}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
        />
      </main>

      {/* Cyberpunk ATS Share Card Modal */}
      <ATSShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        jobTitle={jobTitle}
        score={result?.ats_score ?? 88}
      />

      {/* MoMo Checkout Modal */}
      <MomoCheckoutDialog
        isOpen={isMomoOpen}
        onClose={() => setIsMomoOpen(false)}
        packageType="MICRO_PASS_29K"
        amount={29000}
        orderInfo="Gói 1-Click Tối Ưu Lề CV Chuẩn ATS"
      />

      {/* Terminal Status Bar (Zero Dead-Space Standard) */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] text-slate-500 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span>Khung máy: <strong>Belooga High-Density Studio</strong></span>
          <span className="text-slate-700">|</span>
          <span>Độ phân giải: 100vh Fill</span>
          <span className="text-slate-700">|</span>
          <span>Thuật toán: Hybrid Regex + Gemini Flash Cascade</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-400">Hệ thống sẵn sàng</span>
        </div>
      </footer>
    </div>
  );
}
