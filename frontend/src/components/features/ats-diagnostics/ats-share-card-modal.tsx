"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ATSShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  score: number;
  roastComment?: string;
}

export function ATSShareCardModal({
  isOpen,
  onClose,
  jobTitle,
  score,
  roastComment = "CV này viết mượt như code đã pass CI/CD, nhưng còn thiếu vài số liệu định lượng STAR!",
}: ATSShareCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://belooga.vn/ats?score=${score}&ref=flex_card`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankBadge = (s: number) => {
    if (s >= 85) return { label: "🏆 Top 5% Sát Thủ ATS", color: "from-cyan-400 to-emerald-400 text-black" };
    if (s >= 70) return { label: "⚡ Top 20% Tiềm Năng", color: "from-blue-500 to-cyan-500 text-white" };
    return { label: "⚠️ Cần Cấp Cứu Lề & Font", color: "from-amber-500 to-rose-500 text-black" };
  };

  const rank = getRankBadge(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🧲</span>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Thẻ Bài ATS Cyberpunk — Flex Mạng Xã Hội
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base">
            ✕
          </button>
        </div>

        {/* The Cyberpunk Card Canvas */}
        <div
          data-testid="ats-flex-card-canvas"
          className="p-5 rounded-lg bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-cyan-500/60 shadow-xl shadow-cyan-500/10 space-y-3 relative overflow-hidden"
        >
          {/* Neon accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                BELOOGA AGENTIC VERIFIED
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{jobTitle || "Senior Software Engineer"}</h2>
            </div>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gradient-to-r ${rank.color}`}>
              {rank.label}
            </div>
          </div>

          {/* Big Score Display */}
          <div className="flex items-baseline gap-2 py-2">
            <span data-testid="flex-score-value" className="text-5xl font-black font-mono text-cyan-300 tracking-tighter">
              {score}
            </span>
            <span className="text-xl font-mono text-slate-500">/ 100 PTS</span>
          </div>

          {/* Roast Quote Box */}
          <div className="p-3 rounded bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-sans italic relative">
            <span className="text-cyan-400 font-bold mr-1">"</span>
            {roastComment}
            <span className="text-cyan-400 font-bold ml-1">"</span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
            <span>Powered by Belooga AI Engine</span>
            <span>belooga.vn/ats</span>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={handleCopyLink}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs h-8"
          >
            {copied ? "✓ Đã Copy Link!" : "🔗 Copy Link Flex Điểm"}
          </Button>

          <Button
            onClick={() => {
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  `https://belooga.vn/ats?score=${score}`
                )}`,
                "_blank"
              );
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-4"
          >
            Share LinkedIn
          </Button>

          <Button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs h-8 px-3"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
