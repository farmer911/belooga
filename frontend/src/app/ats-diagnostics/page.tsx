"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Share2, Zap, AlertTriangle, History, Upload, UserCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth-store";
import { useATSScan, ATSScanPayload, ATSScanHistoryItem } from "@/hooks/use-ats-Scan";
import { PRESET_VNG, PRESET_SHOPEE } from "@/components/features/ats-diagnostics/ats-presets";
import { ATSScorecard } from "@/components/features/ats-diagnostics/ats-scorecard";
import { ATSPreviewCanvas } from "@/components/features/ats-diagnostics/ats-preview-canvas";
import { ATSShareCardModal } from "@/components/features/ats-diagnostics/ats-share-card-modal";
import { MomoCheckoutDialog } from "@/components/features/payments/momo-checkout-dialog";
import { MockInterviewAndOutreachSuite } from "@/components/features/growth/career-acceleration-suite";

function SharedScoreBadge() {
  const searchParams = useSearchParams();
  const sharedScore = searchParams.get("score");
  if (!sharedScore) return null;
  return (
    <Badge data-testid="shared-ats-score-banner" variant="outline" className="text-[10px] font-bold text-emerald-700 border-emerald-300 bg-emerald-50">
      Điểm ATS được chia sẻ: {sharedScore}/100
    </Badge>
  );
}

export default function ATSDiagnosticsPage() {
  const user = useAuthStore((s) => s.user);
  const activeUsername = user?.username || "alexnguyen";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobTitle, setJobTitle] = useState(PRESET_VNG.job_title);
  const [companyName, setCompanyName] = useState(PRESET_VNG.company_name || "");
  const [jdText, setJdText] = useState(PRESET_VNG.jd_text);
  const [cvText, setCvText] = useState(PRESET_VNG.cv_text);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMomoOpen, setIsMomoOpen] = useState(false);

  const {
    result, shortlist, interviewKit, isLoading, error,
    activeTab, previewMode, setActiveTab, setPreviewMode, scanCV, setResult,
    scanHistory, marketPulse, hydrationNotice,
    extractCvFile, isExtractingFile, loadProfileCv, isLoadingProfileCv,
    refetchHistory, tailorCv,
  } = useATSScan();

  const handleScan = async (overrideCvText?: string) => {
    const targetCv = (overrideCvText ?? cvText).trim();
    if (!targetCv) return;
    try {
      await scanCV({ job_title: jobTitle, company_name: companyName, jd_text: jdText, cv_text: targetCv });
      void refetchHistory();
    } catch { /* error managed in hook */ }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const extracted = await extractCvFile({ file, candidateName: activeUsername });
    if (extracted.text) {
      setCvText(extracted.text);
      await handleScan(extracted.text);
    }
  };

  const handleLoadProfileCv = async () => {
    const hydratedText = await loadProfileCv(activeUsername);
    if (hydratedText) {
      setCvText(hydratedText);
      await handleScan(hydratedText);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const res = await tailorCv({ job_title: jobTitle, company_name: companyName, jd_text: jdText, cv_text: cvText });
      if (res.tailored_cv_text) setCvText(res.tailored_cv_text);
      if (res.scan_result) setResult(res.scan_result);
      void refetchHistory();
    } catch { /* error managed in hook */ }
  };

  const handleSelectHistory = (item: ATSScanHistoryItem) => {
    setJobTitle(item.job_title); setCompanyName(item.company_name || "");
    setResult({
      match_id: item.match_id || item.id, ats_score: item.ats_score,
      matched_skills: item.matched_skills ?? ["Golang", "PostgreSQL", "Docker"], missing_skills: item.missing_skills ?? [],
      star_analysis: result?.star_analysis ?? [], parse_warnings: [],
      breakdown: { hard_skills_score: item.ats_score, impact_score: item.ats_score, formatting_score: 95 },
      created_at: item.created_at || new Date().toISOString(),
    });
  };

  const applyPreset = (preset: ATSScanPayload) => {
    setJobTitle(preset.job_title); setCompanyName(preset.company_name || ""); setJdText(preset.jd_text); setCvText(preset.cv_text);
  };

  return (
    <div className="flex-1 flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-dark">
      <div className="border-b border-surface-border bg-surface-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-brand-primary">Belooga Studio</span>
          <span className="text-surface-border">/</span>
          <span className="text-typography-heading font-medium">ATS Diagnostics & JD Matcher</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-brand-dark border-brand-primary/40 bg-brand-overlay">Zero Dead-Space</Badge>
          {marketPulse?.total_jds_analyzed !== undefined && (
            <Badge data-testid="market-pulse-jds-badge" variant="outline" className="text-[10px] font-semibold text-typography-heading border-surface-border bg-surface-page">
              {marketPulse.total_jds_analyzed} JDs Analyzed
            </Badge>
          )}
          <Suspense fallback={null}><SharedScoreBadge /></Suspense>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-typography-muted font-medium">Mẫu kiểm tra nhanh:</span>
          <button onClick={() => applyPreset(PRESET_VNG)} className="px-2.5 py-1 bg-surface-page hover:bg-surface-divider text-typography-heading hover:text-typography-main rounded-md border border-surface-border transition-colors text-xs font-medium cursor-pointer">Senior Go @ VNG</button>
          <button onClick={() => applyPreset(PRESET_SHOPEE)} className="px-2.5 py-1 bg-surface-page hover:bg-surface-divider text-typography-heading hover:text-typography-main rounded-md border border-surface-border transition-colors text-xs font-medium cursor-pointer">Frontend Lead @ Shopee</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsShareModalOpen(true)} data-testid="btn-open-flex-card" className="px-2.5 py-1.5 bg-teal-50/50 hover:bg-brand-overlay text-brand-dark rounded-lg border border-teal-200 transition-colors text-[11px] flex items-center gap-1.5 font-semibold shadow-xs cursor-pointer">
            <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Flex Thẻ Bài Điểm ATS</span>
          </button>
          <Button onClick={() => handleScan()} disabled={isLoading} className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-4 h-8 rounded-lg shadow-xs gap-1.5">
            {isLoading ? <Spinner className="w-4 h-4" /> : <Zap className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{isLoading ? "Đang quét đa tác nhân..." : "Quét Điểm ATS Ngay"}</span>
          </Button>
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-140px)]">
        <section className="lg:col-span-5 border-r border-surface-border flex flex-col bg-surface-card overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-typography-heading mb-1 font-medium">Vị trí mục tiêu</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary focus:bg-surface-card" placeholder="vd: Senior Golang Backend" />
            </div>
            <div>
              <label className="block text-typography-heading mb-1 font-medium">Công ty tuyển dụng</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary focus:bg-surface-card" placeholder="vd: VNG Corporation" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-typography-heading font-medium">Mô tả công việc (JD)</span>
                <span className="text-[10px] text-typography-muted">{jdText.length} ký tự</span>
              </div>
              <textarea rows={4} value={jdText} onChange={(e) => setJdText(e.target.value)} className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-xs text-typography-main font-mono focus:outline-none focus:border-brand-primary focus:bg-surface-card resize-y" placeholder="Dán nội dung JD tuyển dụng tại đây..." />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs gap-2">
                <span className="text-typography-heading font-medium">Nội dung CV của bạn (.pdf, .docx, .txt)</span>
                <div className="flex items-center gap-1.5">
                  <input ref={fileInputRef} data-testid="ats-cv-file-input" type="file" accept=".pdf,.docx,.doc,.txt,.md" onChange={handleFileUpload} className="hidden" />
                  <button type="button" data-testid="btn-load-profile-cv" disabled={isLoadingProfileCv} onClick={handleLoadProfileCv} className="px-2 py-0.5 rounded bg-surface-page hover:bg-surface-divider border border-surface-border text-[10px] font-semibold text-typography-heading inline-flex items-center gap-1 cursor-pointer disabled:opacity-50">
                    <UserCheck className="w-3 h-3 text-brand-primary" /> {isLoadingProfileCv ? "Đang nạp..." : "Nạp CV Hồ Sơ"}
                  </button>
                  <button type="button" data-testid="btn-upload-cv-file" disabled={isExtractingFile} onClick={() => fileInputRef.current?.click()} className="px-2 py-0.5 rounded bg-surface-page hover:bg-surface-divider border border-surface-border text-[10px] font-semibold text-typography-heading inline-flex items-center gap-1 cursor-pointer disabled:opacity-50">
                    <Upload className="w-3 h-3 text-brand-primary" /> {isExtractingFile ? "Đang đọc file..." : "Tải File CV"}
                  </button>
                  <span className="text-[10px] text-typography-muted">{cvText.length} ký tự</span>
                </div>
              </div>
              {hydrationNotice && (
                <div data-testid="cv-hydration-status" className="mb-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{hydrationNotice}</span>
                </div>
              )}
              <textarea data-testid="ats-cv-textarea" rows={5} value={cvText} onChange={(e) => setCvText(e.target.value)} className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-xs text-typography-main font-mono focus:outline-none focus:border-brand-primary focus:bg-surface-card resize-y" placeholder="Dán văn bản CV hoặc tải lên file PDF/DOCX..." />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <ATSScorecard result={result} shortlist={shortlist} interviewKit={interviewKit} activeTab={activeTab} setActiveTab={setActiveTab} onPayClick={() => setIsMomoOpen(true)} />
          ) : (
            <div className="p-6 border border-dashed border-surface-border rounded-xl text-center text-typography-muted text-xs space-y-2 bg-surface-page/50 flex flex-col items-center">
              <Zap className="w-6 h-6 text-brand-primary" aria-hidden="true" />
              <div>Bấm nút <strong>&quot;Quét Điểm ATS Ngay&quot;</strong> ở thanh trên để bắt đầu phân tích đa tác nhân.</div>
            </div>
          )}
          <MockInterviewAndOutreachSuite jobTitle={jobTitle} companyName={companyName} />
          {scanHistory.length > 0 && (
            <div className="p-3 rounded-xl bg-surface-page border border-surface-border space-y-1.5 text-xs">
              <div className="font-semibold text-typography-main flex items-center gap-1.5 text-[11px]">
                <History className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
                <span>Lịch sử quét ATS gần đây ({scanHistory.length})</span>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {scanHistory.slice(0, 5).map((item, idx) => (
                  <button key={item.id || item.match_id || idx} type="button" onClick={() => handleSelectHistory(item)} className="w-full flex items-center justify-between text-[11px] bg-surface-card hover:border-brand-primary px-2.5 py-1 rounded border border-surface-border transition-colors cursor-pointer text-left">
                    <span className="truncate font-medium text-typography-heading">{item.job_title} {item.company_name ? `@ ${item.company_name}` : ""}</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-brand-primary border-brand-primary/30">{item.ats_score}/100</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <ATSPreviewCanvas cvText={cvText} previewMode={previewMode} setPreviewMode={setPreviewMode} />
      </main>

      <ATSShareCardModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} jobTitle={jobTitle} score={result?.ats_score ?? 88} />
      <MomoCheckoutDialog isOpen={isMomoOpen} onClose={() => setIsMomoOpen(false)} packageType="MICRO_PASS_29K" amount={29000} orderInfo="Gói 1-Click Tối Ưu Lề CV Chuẩn ATS" onPaymentSuccess={handlePaymentSuccess} />

      <footer className="border-t border-surface-border bg-surface-card px-4 py-2 text-[11px] text-typography-muted flex flex-wrap justify-between items-center gap-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span>Khung máy: <strong className="text-typography-main">Belooga High-Density Studio</strong></span>
          <span className="text-surface-border">|</span>
          <span>Độ phân giải: 100vh Fill</span>
          <span className="text-surface-border">|</span>
          <span>Thuật toán: Hybrid Regex + Gemini Flash Cascade</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-700 font-medium">Hệ thống sẵn sàng</span>
        </div>
      </footer>
    </div>
  );
}
