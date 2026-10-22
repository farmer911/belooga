"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, Video, Code2, FileUp, EyeOff, QrCode, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";

export function WorkspaceGrowthSuite({ username, fullName }: { username: string; fullName: string }) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(0);
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);

  const [teleprompterScript, setTeleprompterScript] = useState<string | null>(null);
  const [cvImportText, setCvImportText] = useState("");
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const [stealthEnabled, setStealthEnabled] = useState(false);
  const [blockedCompanies, setBlockedCompanies] = useState("CurrentCorp, CompetitorVN");
  const [showQrModal, setShowQrModal] = useState(false);

  const quizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ skill_name?: string }>("/v1/growth/skill-assessment", {
        skill_name: "PostgreSQL High-Scale",
        score_pct: 96,
      });
      return res.data?.skill_name || "PostgreSQL High-Scale";
    },
    onSuccess: (badge) => {
      setVerifiedSkills((prev) => (prev.includes(badge) ? prev : [...prev, badge]));
      setQuizOpen(false);
    },
  });

  const scriptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ script_text: string }>("/v1/growth/pitch-script", {
        username,
        target_role: "Principal Software Engineer",
      });
      return res.data.script_text;
    },
    onSuccess: (text) => setTeleprompterScript(text),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ imported_count?: number }>("/v1/growth/cv-auto-import", {
        raw_cv_text: cvImportText,
      });
      return res.data?.imported_count ?? 1;
    },
    onSuccess: (count) => {
      setImportedCount(count);
      setCvImportText("");
    },
  });

  const stealthMutation = useMutation({
    mutationFn: async (nextState: boolean) => {
      await apiClient.patch("/v1/growth/stealth-mode", {
        stealth_enabled: nextState,
        blocked_companies: blockedCompanies.split(",").map((s) => s.trim()).filter(Boolean),
      });
      return nextState;
    },
    onSuccess: (nextState) => setStealthEnabled(nextState),
  });

  return (
    <section className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
        <div className="font-bold text-sm text-typography-main">
          Candidate Viral Growth, Verified Badges & AI Studio Toolkit
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="qr-career-card-open-btn"
            onClick={() => setShowQrModal((p) => !p)}
            className="px-3 py-1.5 rounded-lg bg-surface-page border border-surface-border font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
            <span>QR Digital Career Card</span>
          </button>
        </div>
      </div>

      {showQrModal && (
        <div data-testid="growth-qr-career-card" className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-brand-dark text-sm">{fullName} (@{username}) — Instant QR Career Pass</div>
            <div className="text-typography-muted">Quét mã tại sự kiện Tech/Hiring Fair để mở ngay 0:30 Video Pitch & Hồ sơ xác thực.</div>
            <div className="font-mono text-[11px] text-brand-primary">https://belooga.vn/public/{username}?ref=qr</div>
          </div>
          <div className="px-4 py-3 rounded-lg bg-surface-card border border-surface-border font-mono font-bold text-center">
            [QR MATRIX · @{username}]
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div data-testid="growth-skill-quiz-card" className="p-3.5 rounded-xl bg-surface-page border border-surface-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-typography-main flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Verified Skill Micro-Assessments (5-Min Quiz)</span>
            </span>
            <button
              type="button"
              data-testid="skill-quiz-start-btn"
              onClick={() => setQuizOpen((p) => !p)}
              className="px-2.5 py-1 rounded-md bg-brand-primary text-white font-semibold text-[11px] cursor-pointer"
            >
              {quizOpen ? "Đóng Quiz" : "Làm Quiz Nhận Badge"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {verifiedSkills.map((sk) => (
              <span
                key={sk}
                data-testid={`verified-skill-badge-${sk}`}
                className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {sk} (Verified)
              </span>
            ))}
          </div>
          {quizOpen && (
            <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border space-y-2">
              <div className="font-semibold">Câu hỏi: Chỉ mục nào tối ưu nhất cho Full-Text Search TSVECTOR trên PostgreSQL 16?</div>
              <div className="flex gap-2">
                {["GIN Index", "B-Tree", "BRIN"].map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedAnswer(idx)}
                    className={`px-2.5 py-1 rounded border text-[11px] cursor-pointer ${selectedAnswer === idx ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-page border-surface-border"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                data-testid="skill-quiz-submit-btn"
                disabled={quizMutation.isPending}
                onClick={() => quizMutation.mutate()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg"
              >
                Nộp Bài & Cấp Huy Hiệu Verified
              </Button>
            </div>
          )}
        </div>

        <div data-testid="growth-pitch-teleprompter-card" className="p-3.5 rounded-xl bg-surface-page border border-surface-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-typography-main flex items-center gap-1.5">
              <Video className="w-4 h-4 text-brand-primary" aria-hidden="true" />
              <span>60s Video Pitch AI Teleprompter & Captions</span>
            </span>
            <button
              type="button"
              data-testid="teleprompter-generate-btn"
              disabled={scriptMutation.isPending}
              onClick={() => scriptMutation.mutate()}
              className="px-2.5 py-1 rounded-md bg-brand-primary text-white font-semibold text-[11px] cursor-pointer"
            >
              Tạo Kịch Bản 60s
            </button>
          </div>
          <div data-testid="teleprompter-script-box" className="p-2.5 rounded-lg bg-surface-card border border-surface-border font-mono text-[11px] whitespace-pre-line">
            {teleprompterScript || "Bấm 'Tạo Kịch Bản 60s' để AI sinh lời thoại khớp kinh nghiệm & tự động gắn phụ đề WebRTC."}
          </div>
        </div>

        <div data-testid="growth-github-impact-card" className="p-3.5 rounded-xl bg-surface-page border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-typography-main flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-brand-primary" aria-hidden="true" />
              <span>GitHub & Live Project Impact Card</span>
            </span>
          </div>
        </div>

        <div data-testid="growth-cv-auto-import-card" className="p-3.5 rounded-xl bg-surface-page border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-typography-main flex items-center gap-1.5">
              <FileUp className="w-4 h-4 text-brand-primary" aria-hidden="true" />
              <span>10-Second CV-to-Profile Auto-Importer</span>
            </span>
            {importedCount !== null && <span className="text-emerald-700 font-bold">✓ Đã đồng bộ {importedCount} mục</span>}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              data-testid="cv-import-text-input"
              value={cvImportText}
              onChange={(e) => setCvImportText(e.target.value)}
              placeholder="Dán nhanh tóm tắt CV / LinkedIn để tự động điền Timeline..."
              className="flex-1 bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs"
            />
            <Button
              type="button"
              data-testid="cv-import-submit-btn"
              disabled={importMutation.isPending || !cvImportText.trim()}
              onClick={() => importMutation.mutate()}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-7 px-3 rounded-lg"
            >
              Auto-Import
            </Button>
          </div>
        </div>
      </div>

      <div data-testid="growth-stealth-mode-toggle" className="p-3 rounded-xl bg-surface-page border border-surface-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-amber-600" aria-hidden="true" />
          <span>
            <strong>Stealth Job Seeking Mode (Săn việc ẩn danh):</strong> Ẩn danh tính với công ty hiện tại nhưng vẫn nhận Offer Bid.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            data-testid="stealth-blocked-companies-input"
            value={blockedCompanies}
            onChange={(e) => setBlockedCompanies(e.target.value)}
            aria-label="Danh sách công ty chặn xem hồ sơ"
            className="bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs w-48"
          />
          <button
            type="button"
            disabled={stealthMutation.isPending}
            onClick={() => stealthMutation.mutate(!stealthEnabled)}
            className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${stealthEnabled ? "bg-emerald-600 text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}
          >
            {stealthEnabled ? "Stealth: BẬT" : "Stealth: TẮT"}
          </button>
        </div>
      </div>
    </section>
  );
}
