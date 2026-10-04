"use client";

import * as React from "react";
import { Camera, Mic, Sliders, FileText, Upload, Edit3, Maximize2, Minimize2 } from "lucide-react";
import { Resolution, AspectRatio } from "@/lib/studio-config";

export interface StudioToolbarProps {
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (id: string) => void;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  onAudioDeviceChange: (id: string) => void;
  audioMeterLevel: number;
  selectedResolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
  isRecording: boolean;
  hasRecordedVideo: boolean;
  // Prompter controls
  teleprompterEnabled: boolean;
  onTogglePrompter: () => void;
  isPrompterCollapsed: boolean;
  onToggleCollapsePrompter: () => void;
  onImportClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onEditClick: () => void;
}

export function StudioToolbar({
  videoDevices,
  selectedDeviceId,
  onDeviceChange,
  audioDevices,
  selectedAudioDeviceId,
  onAudioDeviceChange,
  audioMeterLevel,
  selectedResolution,
  onResolutionChange,
  selectedRatio,
  onRatioChange,
  isRecording,
  hasRecordedVideo,
  teleprompterEnabled,
  onTogglePrompter,
  isPrompterCollapsed,
  onToggleCollapsePrompter,
  onImportClick,
  onFileChange,
  fileInputRef,
  onEditClick,
}: StudioToolbarProps) {
  const isControlsLocked = isRecording || hasRecordedVideo;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Camera Device Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
          <Camera className="w-3.5 h-3.5 text-[#5bbbae] shrink-0" />
          <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Camera:</span>
          <select
            data-testid="camera-device-select"
            value={selectedDeviceId}
            onChange={(e) => onDeviceChange(e.target.value)}
            disabled={isControlsLocked}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
          >
            {videoDevices.length > 0 ? (
              videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-slate-900 text-white">
                  {dev.label || `Camera ${idx + 1}`}
                </option>
              ))
            ) : (
              <option value="" className="bg-slate-900 text-white">Default Camera</option>
            )}
          </select>
        </div>

        {/* 2. Microphone Selector & Badge */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
          <Mic className={`w-3.5 h-3.5 shrink-0 transition-colors ${audioMeterLevel > 5 ? "text-emerald-400" : "text-[#5bbbae]"}`} />
          <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Mic:</span>
          <select
            data-testid="audio-device-select"
            value={selectedAudioDeviceId}
            onChange={(e) => onAudioDeviceChange(e.target.value)}
            disabled={isControlsLocked}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
          >
            {audioDevices.length > 0 ? (
              audioDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-slate-900 text-white">
                  {dev.label || `Microphone ${idx + 1}`}
                </option>
              ))
            ) : (
              <option value="" className="bg-slate-900 text-white">Default Microphone</option>
            )}
          </select>
          <div
            data-testid="mic-recognition-badge"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
              audioMeterLevel > 5
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-slate-800/80 border-slate-700/60 text-slate-400"
            }`}
            title="Microphone Status"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${audioMeterLevel > 5 ? "bg-emerald-400 animate-ping" : "bg-emerald-500"}`} />
            <span className="hidden md:inline">{audioMeterLevel > 5 ? "Live" : "Detected"}</span>
          </div>
        </div>

        {/* 3. Resolution Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
          <Sliders className="w-3.5 h-3.5 text-[#5bbbae] shrink-0" />
          <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Quality:</span>
          <select
            data-testid="camera-resolution-select"
            value={selectedResolution}
            onChange={(e) => onResolutionChange(e.target.value as Resolution)}
            disabled={isControlsLocked}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="1080p" className="bg-slate-900 text-white">1080p Full HD</option>
            <option value="720p" className="bg-slate-900 text-white">720p HD</option>
            <option value="480p" className="bg-slate-900 text-white">480p SD</option>
          </select>
        </div>

        {/* 4. Teleprompter Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
          <FileText className="w-3.5 h-3.5 text-[#5bbbae]" />
          <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Script:</span>
          <button
            data-testid="toggle-teleprompter-btn"
            type="button"
            onClick={onTogglePrompter}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              teleprompterEnabled
                ? "bg-[#5bbbae] text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {teleprompterEnabled ? "Prompter ON" : "Prompter OFF"}
          </button>

          {teleprompterEnabled && (
            <button
              data-testid="toggle-collapse-prompter-btn"
              type="button"
              onClick={onToggleCollapsePrompter}
              className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer border border-slate-700 hover:border-slate-500 transition-colors"
            >
              {isPrompterCollapsed ? (
                <>
                  <Maximize2 className="w-3 h-3 text-[#5bbbae]" /> <span className="hidden lg:inline">Expand</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3 h-3 text-[#5bbbae]" /> <span className="hidden lg:inline">Collapse</span>
                </>
              )}
            </button>
          )}

          <button
            data-testid="import-script-btn"
            type="button"
            onClick={onImportClick}
            title="Import .txt / .md script"
            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer border border-slate-700 hover:border-slate-500"
          >
            <Upload className="w-3 h-3 text-[#5bbbae]" /> Import
          </button>
          <input
            ref={fileInputRef}
            data-testid="script-file-input"
            type="file"
            accept=".txt,.md,.text"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            data-testid="edit-script-btn"
            type="button"
            onClick={onEditClick}
            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer border border-slate-700 hover:border-slate-500"
          >
            <Edit3 className="w-3 h-3 text-cyan-400" /> Edit
          </button>
        </div>
      </div>

      {/* 5. Aspect Ratio Selector Pills */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-md p-1 text-xs">
        <span className="text-slate-400 font-medium text-[11px] px-1 hidden md:inline">Ratio:</span>
        {(["16:9", "9:16", "1:1", "4:3"] as const).map((r) => (
          <button
            key={r}
            data-testid={`ratio-btn-${r.replace(":", "-")}`}
            type="button"
            disabled={isControlsLocked}
            onClick={() => onRatioChange(r)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
              selectedRatio === r
                ? "bg-[#5bbbae] text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            } ${isControlsLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
