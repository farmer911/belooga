"use client";

import * as React from "react";
import { Camera, Zap } from "lucide-react";
import { AudioVisualizerMeter } from "@/components/common/audio-visualizer-meter";
import { Resolution, AspectRatio, getResolutionConfig, getAspectRatioClass } from "@/lib/studio-config";

export interface StudioViewfinderProps {
  recordedVideoUrl: string | null;
  mediaStream: MediaStream | null;
  attachWebcamRef: (node: HTMLVideoElement | null) => void;
  selectedResolution: Resolution;
  selectedRatio: AspectRatio;
  audioMeterLevel: number;
  isRecording: boolean;
  recordingSeconds: number;
  formatTimer: (secs: number) => string;
  isPrompterActive: boolean;
  isOpen: boolean;
  children?: React.ReactNode; // Teleprompter overlay
}

export function StudioViewfinder({
  recordedVideoUrl,
  mediaStream,
  attachWebcamRef,
  selectedResolution,
  selectedRatio,
  audioMeterLevel,
  isRecording,
  recordingSeconds,
  formatTimer,
  isPrompterActive,
  isOpen,
  children,
}: StudioViewfinderProps) {
  return (
    <div className={`relative ${getAspectRatioClass(selectedRatio)} mx-auto bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center transition-all duration-300`}>
      {recordedVideoUrl ? (
        <video src={recordedVideoUrl} controls autoPlay playsInline className="w-full h-full object-contain" />
      ) : mediaStream ? (
        <>
          <video
            data-testid="studio-live-cam"
            ref={attachWebcamRef}
            autoPlay
            playsInline
            muted
            style={{
              transform: "scaleX(-1) translateZ(0)",
              WebkitTransform: "scaleX(-1) translateZ(0)",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
            className="w-full h-full object-cover"
          />

          {/* Viewfinder HUD */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
            <div className="flex flex-wrap justify-between items-start gap-1 w-full">
              <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 shadow-lg shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold tracking-wide">ACTIVE</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 font-normal">30 FPS</span>
              </div>
              <div
                data-testid="studio-hud-quality"
                className="bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-slate-200 border border-slate-700/60 shadow-lg flex items-center gap-1 shrink-0"
              >
                <span className="text-[#5bbbae] font-bold">HD {selectedResolution}</span>
                <span className="text-slate-500">•</span>
                <span>{selectedRatio}</span>
                {selectedRatio === "16:9" && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-semibold">{getResolutionConfig(selectedResolution, selectedRatio).label}</span>
                  </>
                )}
              </div>
            </div>

            {/* Guides */}
            {selectedRatio === "9:16" ? (
              <div className={`self-center w-36 h-56 border-2 border-white/25 border-dashed rounded-full flex items-center justify-center pointer-events-none ${isPrompterActive ? "opacity-30" : "opacity-100"}`}>
                <span className="text-[10px] text-white/50 tracking-wider font-medium text-center px-2">Portrait Guide</span>
              </div>
            ) : selectedRatio === "1:1" ? (
              <div className={`self-center w-40 h-40 border-2 border-white/25 border-dashed rounded-full flex items-center justify-center pointer-events-none ${isPrompterActive ? "opacity-30" : "opacity-100"}`}>
                <span className="text-[10px] text-white/50 tracking-wider font-medium text-center px-2">Square Guide</span>
              </div>
            ) : (
              <div className={`self-center w-48 h-56 border-2 border-white/25 border-dashed rounded-full flex items-center justify-center pointer-events-none ${isPrompterActive ? "opacity-30" : "opacity-100"}`}>
                <span className="text-[11px] text-white/50 tracking-wider font-medium text-center px-2">Position Face Here</span>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-end text-xs text-slate-400 gap-1 w-full">
              <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700/60 shadow-lg">
                <AudioVisualizerMeter stream={mediaStream} isActive={isOpen} width={42} height={14} />
                <span className="text-[10px] font-mono text-slate-300 ml-0.5">
                  {audioMeterLevel > 5 ? "Active" : "Ready"}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700/60 shadow-lg font-mono text-[10px]">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Zap className="w-3 h-3 text-cyan-400" /> GPU HW-Accel
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-[#5bbbae] font-medium hidden sm:inline">Studio Pro v2.2</span>
              </div>
            </div>
          </div>

          {children}
        </>
      ) : (
        <div className="text-center p-6 space-y-2">
          <Camera className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Live Camera Studio Ready</p>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 animate-pulse shadow-xl z-30">
          <span className="w-2.5 h-2.5 rounded-full bg-white" /> REC {formatTimer(recordingSeconds)} / 05:00
        </div>
      )}
    </div>
  );
}
