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
    <section className="lg:col-span-7 flex flex-col bg-slate-900/30 overflow-hidden">
      {/* Preview Mode Switcher Bar */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Chế độ xem:</span>
          <div className="bg-slate-950 p-0.5 rounded border border-slate-800 flex">
            <button
              onClick={() => setPreviewMode("visual")}
              className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                previewMode === "visual"
                  ? "bg-cyan-500 text-black font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📄 Visual Document
            </button>
            <button
              onClick={() => setPreviewMode("bot_eye")}
              className={`px-2.5 py-1 rounded transition text-xs font-medium flex items-center gap-1 ${
                previewMode === "bot_eye"
                  ? "bg-emerald-500 text-black font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🤖</span> Mắt Bot ATS Nhìn (Raw Text)
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          {previewMode === "visual"
            ? "Giao diện định dạng người thật nhìn"
            : "Cách thuật toán bot ATS bóc tách văn bản thô"}
        </div>
      </div>

      {/* Preview Canvas Area */}
      <div className="flex-1 p-6 overflow-y-auto flex justify-center items-start bg-slate-950/60">
        {previewMode === "visual" ? (
          /* Visual White Document Container (Standard A4 Paper Emulation) */
          <div className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded shadow-2xl font-sans text-xs space-y-4 border border-slate-200 min-h-[600px]">
            <div className="border-b pb-3">
              <h1 className="text-lg font-bold uppercase tracking-wide text-slate-950">
                {nameLine}
              </h1>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {contactLine}
              </p>
            </div>

            <div className="space-y-2 whitespace-pre-wrap leading-relaxed text-slate-800 font-normal">
              {bodyText}
            </div>
          </div>
        ) : (
          /* Bot-Eye Mode (Raw Terminal Monospace ATS Inspector) */
          <div className="w-full max-w-2xl bg-slate-950 border border-emerald-500/30 rounded-lg p-5 font-mono text-xs text-emerald-400 shadow-2xl relative space-y-2">
            <div className="flex justify-between items-center text-[10px] text-emerald-600 border-b border-emerald-950 pb-2">
              <span>[ATS_ENTITY_EXTRACTION_ENGINE_V2]</span>
              <span>PARSER_STATUS: OK (100% TEXT EXTRACTED)</span>
            </div>

            <div className="text-slate-400 text-[11px] mb-2">
              // Bot ATS loại bỏ toàn bộ đồ họa, màu sắc và chỉ đọc văn bản tuần tự như sau:
            </div>

            <pre className="text-emerald-300/90 whitespace-pre-wrap leading-relaxed bg-black/40 p-4 rounded border border-emerald-900/40 text-[11px]">
              {cvText}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
