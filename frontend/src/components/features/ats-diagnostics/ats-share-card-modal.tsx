"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

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
    if (s >= 85) return { label: "🏆 Top 5% Sát Thủ ATS", color: "from-brand-accent to-brand-primary text-teal-950" };
    if (s >= 70) return { label: "⚡ Top 20% Tiềm Năng", color: "from-blue-400 to-brand-accent text-teal-950" };
    return { label: "⚠️ Cần Cấp Cứu Lề & Font", color: "from-amber-400 to-rose-400 text-teal-950" };
  };

  const rank = getRankBadge(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-surface-border rounded-xl max-w-xl w-full p-5 space-y-4 shadow-xl relative">
        <div className="flex items-center justify-between border-b border-surface-divider pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🧲</span>
            <h3 className="text-sm font-bold text-typography-main uppercase tracking-wider">
              Thẻ Bài ATS Belooga — Flex Mạng Xã Hội
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-typography-muted hover:text-typography-main text-lg font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* The Card Canvas */}
        <div
          data-testid="ats-flex-card-canvas"
          className="p-6 rounded-xl bg-gradient-to-br from-brand-dark via-teal-900 to-teal-950 border-2 border-brand-primary shadow-lg space-y-3 relative overflow-hidden text-white"
        >
          {/* Subtle brand glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-mono text-brand-accent uppercase tracking-widest font-semibold">
                BELOOGA AGENTIC VERIFIED
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{jobTitle || "Senior Software Engineer"}</h2>
            </div>
            <div className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gradient-to-r ${rank.color} shadow-xs`}>
              {rank.label}
            </div>
          </div>

          {/* Big Score Display */}
          <div className="flex items-baseline gap-2 py-2">
            <span data-testid="flex-score-value" className="text-5xl font-black font-mono text-brand-accent tracking-tighter">
              {score}
            </span>
            <span className="text-xl font-mono text-white/60">/ 100 PTS</span>
          </div>

          {/* Roast Quote Box */}
          <div className="p-3 rounded-lg bg-black/25 border border-white/10 text-xs text-white/90 font-sans italic relative">
            <span className="text-brand-accent font-bold mr-1">"</span>
            {roastComment}
            <span className="text-brand-accent font-bold ml-1">"</span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-white/60 font-mono pt-1">
            <span>Powered by Belooga AI Engine</span>
            <span>belooga.vn/ats</span>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={handleCopyLink}
            className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs h-8 rounded-lg shadow-xs"
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 px-4 rounded-lg shadow-xs"
          >
            Share LinkedIn
          </Button>

          <Button
            onClick={onClose}
            className="bg-white hover:bg-surface-page text-typography-heading hover:text-typography-main border border-surface-border text-xs h-8 px-3 rounded-lg shadow-xs"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
