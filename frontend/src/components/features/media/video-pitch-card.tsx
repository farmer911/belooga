"use client";

import * as React from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VideoPitchCardProps {
  posterUrl?: string;
  onPlayClick: () => void;
  onRecordClick?: () => void;
  isEditable?: boolean;
  testId?: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
}

export function VideoPitchCard({
  posterUrl,
  onPlayClick,
  onRecordClick,
  isEditable = false,
  testId = "pitch-thumbnail-card",
  badgeText,
  title = "0:30 Video Elevator Pitch",
  subtitle = "Your authentic personal introduction for recruiters.",
}: VideoPitchCardProps) {
  const displayPoster = posterUrl || "/images/home/matt-poster.png";

  return (
    <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#252525]">{title}</h2>
          <p className="text-xs text-[#737475]">{subtitle}</p>
        </div>

        {isEditable && onRecordClick ? (
          <Button
            data-testid="record-pitch-studio-btn"
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
            onClick={onRecordClick}
          >
            <Video className="w-3.5 h-3.5" /> Re-record Pitch Studio
          </Button>
        ) : badgeText ? (
          <span className="text-xs font-mono font-semibold text-[#5bbbae] bg-[#5bbbae]/10 px-2.5 py-1 rounded">
            {badgeText}
          </span>
        ) : null}
      </div>

      {/* Video Player Container with 54px hover play button */}
      <div
        data-testid={testId}
        className="start-content-video cursor-pointer shadow-md group relative rounded-lg overflow-hidden bg-black"
        onClick={onPlayClick}
      >
        <div className="modal-start" data-testid="play-pitch-modal-btn">
          <div className="video-play-icon" />
        </div>
        <img
          data-testid="candidate-poster-img"
          src={displayPoster}
          alt="Candidate Elevator Pitch"
          className="w-full h-80 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 0:30
        </div>
      </div>
    </div>
  );
}
