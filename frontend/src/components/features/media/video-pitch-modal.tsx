"use client";

import * as React from "react";
import { Video, X, Play, VolumeX } from "lucide-react";
import { useVideoPlayer } from "@/hooks/use-video-player";

export interface VideoPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  videoUrl?: string;
  posterUrl?: string;
}

export function VideoPitchModal({
  isOpen,
  onClose,
  candidateName,
  videoUrl,
  posterUrl,
}: VideoPitchModalProps) {
  const {
    videoRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    togglePlay,
    toggleMute,
    replay,
    pause,
    onLoadedData,
    onPlay,
    onPause,
    onTimeUpdate,
    onDurationChange,
    onEnded,
  } = useVideoPlayer(30);

  if (!isOpen) return null;

  const handleClose = () => {
    pause();
    onClose();
  };

  const src = videoUrl || "/images/home/Ava_s_Video.mp4";
  const poster = posterUrl || "/images/home/matt-poster.png";

  const curM = Math.floor(currentTime / 60);
  const curS = String(Math.floor(currentTime % 60)).padStart(2, "0");
  const durM = Math.floor(duration / 60);
  const durS = String(Math.floor(duration % 60)).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        data-testid="pitch-video-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl space-y-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#5bbbae]" />
            <div>
              <h3 className="text-base font-semibold text-white">
                0:30 Video Pitch — {candidateName}
              </h3>
              <p className="text-xs text-slate-400">
                {candidateName} • Authentic Candidate Voice
              </p>
            </div>
          </div>
          <button
            data-testid="close-pitch-modal-btn"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors relative z-10 shrink-0 flex items-center justify-center min-w-[32px] min-h-[32px]"
            aria-label="Close video player"
          >
            <X className="w-5 h-5 lucide-x" />
          </button>
        </div>

        {/* Interactive Video Viewport */}
        <div
          className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer overflow-hidden"
          onClick={togglePlay}
        >
          <video
            data-testid="modal-video-player"
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            playsInline
            preload="auto"
            onLoadedData={onLoadedData}
            onPlay={onPlay}
            onPause={onPause}
            onTimeUpdate={onTimeUpdate}
            onDurationChange={onDurationChange}
            onEnded={onEnded}
            className="w-full h-full object-contain"
          />

          {/* Big Centered Play Button Overlay when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all hover:bg-black/30 pointer-events-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#5bbbae] text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(91,187,174,0.6)] transform group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" />
              </div>
              <span className="mt-3 text-xs sm:text-sm font-semibold text-white tracking-wide bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/60 shadow">
                Click to Play Pitch
              </span>
            </div>
          )}

          {/* Floating Muted Banner if browser blocked unmuted autoplay */}
          {isPlaying && isMuted && (
            <button
              type="button"
              data-testid="video-mute-toggle"
              onClick={toggleMute}
              className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105 animate-bounce pointer-events-auto"
            >
              <VolumeX className="w-4 h-4" />
              <span>Click to Unmute Sound 🔊</span>
            </button>
          )}
        </div>

        {/* Video Footer Telemetry & Duration */}
        <div className="p-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-300">
              {curM}:{curS} / {durM}:{durS}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">1080p HD Streaming</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#5bbbae] font-medium hidden sm:inline">
              Belooga Verified Authentic Media
            </span>
            <button
              type="button"
              onClick={replay}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
            >
              Replay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
