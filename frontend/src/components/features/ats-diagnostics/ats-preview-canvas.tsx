"use client";

import React from "react";

interface ATSPreviewCanvasProps {
  cvText: string;
  previewMode: "visual" | "bot_eye";
  setPreviewMode: (mode: "visual" | "bot_eye") => void;
}

export function ATSPreviewCanvas({ cvText, previewMode, setPreviewMode }: ATSPreviewCanvasProps) {
  const lines = cvText.split("\n");
  const nameLine = lines[0] || "HỌ VÀ TÊN ỨNG VIÊN";
  const contactLine = lines[1] || "Email: candidate@dev.io | Phone: 0912345678";
  const bodyText = lines.slice(2).join("\n");

  return (
    <section className="lg:col-span-7 flex flex-col bg-surface-divider/40 overflow-hidden">
      {/* Preview Mode Switcher Bar */}
      <div className="border-b border-surface-border bg-white px-4 py-2 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-typography-heading font-medium">Chế độ xem:</span>
          <div className="bg-surface-page p-1 rounded-lg border border-surface-border flex gap-1">
            <button
              onClick={() => setPreviewMode("visual")}
              className={`px-3 py-1 rounded-md transition-colors text-xs font-medium cursor-pointer ${
                previewMode === "visual"
                  ? "bg-brand-primary text-white font-bold shadow-xs"
                  : "text-typography-muted hover:text-typography-main"
              }`}
            >
              📄 Visual Document
            </button>
            <button
              onClick={() => setPreviewMode("bot_eye")}
              className={`px-3 py-1 rounded-md transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer ${
                previewMode === "bot_eye"
                  ? "bg-brand-dark text-white font-bold shadow-xs"
                  : "text-typography-muted hover:text-typography-main"
              }`}
            >
              <span>🤖</span> Mắt Bot ATS Nhìn (Raw Text)
            </button>
          </div>
        </div>

        <div className="text-[11px] text-typography-muted">
          {previewMode === "visual"
            ? "Giao diện định dạng người thật nhìn"
            : "Cách thuật toán bot ATS bóc tách văn bản thô"}
        </div>
      </div>

      {/* Preview Canvas Area */}
      <div className="flex-1 p-6 overflow-y-auto flex justify-center items-start bg-surface-divider/60">
        {previewMode === "visual" ? (
          /* Visual White Document Container (Standard A4 Paper Emulation) */
          <div className="w-full max-w-2xl bg-white text-typography-main p-8 rounded-xl shadow-md font-sans text-xs space-y-4 border border-surface-border min-h-[600px]">
            <div className="border-b border-surface-divider pb-3">
              <h1 className="text-lg font-bold uppercase tracking-wide text-typography-main">
                {nameLine}
              </h1>
              <p className="text-typography-muted text-[11px] mt-0.5">
                {contactLine}
              </p>
            </div>

            <div className="space-y-2 whitespace-pre-wrap leading-relaxed text-typography-heading font-normal">
              {bodyText}
            </div>
          </div>
        ) : (
          /* Bot-Eye Mode (Raw Monospace ATS Inspector) */
          <div className="w-full max-w-2xl bg-neutral-900 border border-brand-accent/40 rounded-xl p-5 font-mono text-xs text-brand-accent shadow-lg relative space-y-2">
            <div className="flex justify-between items-center text-[10px] text-brand-primary border-b border-neutral-700 pb-2">
              <span>[ATS_ENTITY_EXTRACTION_ENGINE_V2]</span>
              <span>PARSER_STATUS: OK (100% TEXT EXTRACTED)</span>
            </div>

            <div className="text-neutral-400 text-[11px] mb-2">
              // Bot ATS loại bỏ toàn bộ đồ họa, màu sắc và chỉ đọc văn bản tuần tự như sau:
            </div>

            <pre className="text-emerald-300/90 whitespace-pre-wrap leading-relaxed bg-black/40 p-4 rounded-lg border border-neutral-700/60 text-[11px]">
              {cvText}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
