"use client";

import * as React from "react";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Mic,
  MicOff,
  Pause,
} from "lucide-react";
import { TeleprompterEditorDialog } from "./teleprompter-editor-dialog";

export interface TeleprompterOverlayProps {
  teleprompterEnabled: boolean;
  isPrompterCollapsed: boolean;
  setIsPrompterCollapsed: (v: boolean) => void;
  scriptText: string;
  setScriptText: (v: string) => void;
  scriptWords: string[];
  activeWordIndex: number;
  setActiveWordIndex: (v: number) => void;
  teleprompterSpeed: number;
  setTeleprompterSpeed: (v: number) => void;
  teleprompterFontSize: "sm" | "md" | "lg";
  setTeleprompterFontSize: (fn: (prev: "sm" | "md" | "lg") => "sm" | "md" | "lg") => void;
  isEditingScript: boolean;
  setIsEditingScript: (v: boolean) => void;
  isRecording: boolean;
  isVoiceActive: boolean;
  hasVoiceStarted: boolean;
  teleprompterContainerRef: React.RefObject<HTMLDivElement | null>;
  scriptFileInputRef: React.RefObject<HTMLInputElement | null>;
  onWordClick: (idx: number) => void;
  onResetPrompter: () => void;
  onSimulateVoice: () => void;
}

export function TeleprompterOverlay({
  teleprompterEnabled,
  isPrompterCollapsed,
  setIsPrompterCollapsed,
  scriptText,
  setScriptText,
  scriptWords,
  activeWordIndex,
  teleprompterSpeed,
  setTeleprompterSpeed,
  teleprompterFontSize,
  setTeleprompterFontSize,
  isEditingScript,
  setIsEditingScript,
  isRecording,
  isVoiceActive,
  hasVoiceStarted,
  teleprompterContainerRef,
  scriptFileInputRef,
  onWordClick,
  onResetPrompter,
  onSimulateVoice,
}: TeleprompterOverlayProps) {
  if (!teleprompterEnabled) return null;

  if (isEditingScript) {
    return (
      <TeleprompterEditorDialog
        isOpen={isEditingScript}
        onClose={() => setIsEditingScript(false)}
        scriptText={scriptText}
        onScriptChange={setScriptText}
        wordCount={scriptWords.length}
        onImportClick={() => scriptFileInputRef.current?.click()}
      />
    );
  }

  if (isPrompterCollapsed) {
    return (
      <div
        data-testid="teleprompter-collapsed-sidebar"
        className="absolute bottom-12 inset-x-3 sm:inset-x-8 z-20 pointer-events-auto flex items-center justify-between bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-2"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-[#5bbbae] animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide shrink-0">
            Prompter
          </span>
          <span className="text-[10px] text-emerald-400 font-mono shrink-0">
            ({Math.round((activeWordIndex / Math.max(1, scriptWords.length)) * 100)}%)
          </span>
          <span className="text-[11px] text-slate-300 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded truncate max-w-[140px] sm:max-w-[260px]">
            Word: <strong className="text-[#5bbbae]">{scriptWords[activeWordIndex] || "Ready"}</strong>
          </span>
          {isRecording && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded hidden md:inline shrink-0 bg-slate-800 text-slate-300 border border-slate-700">
              {isVoiceActive ? "🎤 Voice Active" : !hasVoiceStarted ? "⏳ Awaiting Voice" : "⏸ Paused"}
            </span>
          )}
        </div>

        <button
          type="button"
          data-testid="expand-teleprompter-sidebar-btn"
          onClick={() => setIsPrompterCollapsed(false)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#5bbbae] hover:bg-[#4ea89c] text-slate-950 font-bold text-[11px] transition-colors shadow-md cursor-pointer shrink-0"
        >
          <Maximize2 className="w-3 h-3" /> Expand
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-2 sm:inset-x-5 top-12 bottom-12 z-20 pointer-events-auto flex flex-col justify-between animate-in fade-in transition-all duration-300">
      {/* Prompter Header */}
      <div className="flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-t-xl border border-slate-700/70 border-b-0 text-xs shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5bbbae] animate-pulse" />
          <span className="font-bold text-slate-200 text-[11px] tracking-wide uppercase">
            Prompter
          </span>
          <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
            ({Math.round((activeWordIndex / Math.max(1, scriptWords.length)) * 100)}% read)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[100, 130, 160].map((spd) => (
            <button
              key={spd}
              type="button"
              data-testid={`prompter-speed-${spd}`}
              onClick={() => setTeleprompterSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                teleprompterSpeed === spd
                  ? "bg-[#5bbbae] text-white font-bold"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {spd}wpm
            </button>
          ))}

          <button
            type="button"
            onClick={() =>
              setTeleprompterFontSize((prev) => (prev === "sm" ? "md" : prev === "md" ? "lg" : "sm"))
            }
            className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white border border-slate-700 ml-1"
            title="Toggle Font Size"
          >
            {teleprompterFontSize.toUpperCase()}
          </button>

          <button
            type="button"
            data-testid="prompter-reset-btn"
            onClick={onResetPrompter}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ml-0.5 cursor-pointer"
            title="Rewind to start"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            type="button"
            data-testid="collapse-teleprompter-sidebar-btn"
            onClick={() => setIsPrompterCollapsed(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white border border-slate-700 ml-1 cursor-pointer transition-colors"
            title="Collapse teleprompter sidebar"
          >
            <Minimize2 className="w-3 h-3 text-[#5bbbae]" />
            <span className="hidden sm:inline">Collapse</span>
          </button>
        </div>
      </div>

      {/* Scrollable Prompter Body with Auto-scroll and Karaoke-Highlight */}
      <div
        ref={teleprompterContainerRef as any}
        data-testid="teleprompter-text-container"
        className="flex-1 overflow-y-auto bg-slate-950/75 backdrop-blur-md px-4 sm:px-6 py-8 border-x border-slate-700/70 text-center select-none scroll-smooth"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      >
        <div
          className={`leading-relaxed transition-all ${
            teleprompterFontSize === "sm"
              ? "text-xs sm:text-sm"
              : teleprompterFontSize === "lg"
              ? "text-base sm:text-xl font-bold"
              : "text-sm sm:text-base font-medium"
          }`}
        >
          {scriptWords.map((word, idx) => {
            const isPast = idx < activeWordIndex;
            const isCurrent = idx === activeWordIndex;
            const isAwaitingVoice = isRecording && !hasVoiceStarted && isCurrent;

            let wordStyle = "text-slate-100 hover:text-white";
            if (isCurrent) {
              if (isAwaitingVoice) {
                wordStyle =
                  "border-2 border-[#5bbbae] text-[#5bbbae] bg-[#5bbbae]/15 font-bold scale-105 shadow-[0_0_14px_rgba(91,187,174,0.5)] animate-pulse z-10";
              } else {
                wordStyle =
                  "bg-[#5bbbae] text-slate-950 font-black scale-110 shadow-[0_0_16px_rgba(91,187,174,0.95)] z-10";
              }
            } else if (isPast) {
              wordStyle = "text-slate-500 opacity-60";
            }

            return (
              <span
                key={idx}
                data-word-idx={idx}
                onClick={() => onWordClick(idx)}
                className={`inline-block mx-1 my-0.5 transition-all duration-150 rounded px-1.5 py-0.5 cursor-pointer select-none ${wordStyle}`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Prompter Footer with Voice Detection Status */}
      <div className="flex items-center justify-between bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-b-xl border border-slate-700/70 border-t-0 text-[11px] text-slate-400 shadow-lg">
        <div className="flex items-center gap-2">
          {isRecording ? (
            isVoiceActive ? (
              <span
                data-testid="voice-detection-status"
                className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-semibold animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <Mic className="w-3.5 h-3.5 text-emerald-400" /> Voice Detected • Highlighting & Scrolling
              </span>
            ) : !hasVoiceStarted ? (
              <span
                data-testid="voice-detection-status"
                className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-medium"
              >
                <MicOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Awaiting Voice (Speak script to advance)
              </span>
            ) : (
              <span
                data-testid="voice-detection-status"
                className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px]"
              >
                <Pause className="w-3.5 h-3.5 text-cyan-400" /> Voice Paused • Teleprompter Frozen
              </span>
            )
          ) : (
            <span
              data-testid="voice-detection-status"
              className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" /> Voice Follow & Auto-Scroll Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRecording && !hasVoiceStarted && (
            <button
              type="button"
              data-testid="simulate-voice-btn"
              onClick={onSimulateVoice}
              className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-600/50 text-[10px] font-mono cursor-pointer transition-colors"
              title="Simulate speaking into microphone"
            >
              Speak Now
            </button>
          )}
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Click any word to jump
          </span>
        </div>
      </div>
    </div>
  );
}
