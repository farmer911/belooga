"use client";

import * as React from "react";
import { Edit3, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TeleprompterEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scriptText: string;
  onScriptChange: (text: string) => void;
  wordCount: number;
  onImportClick: () => void;
}

export function TeleprompterEditorDialog({
  isOpen,
  onClose,
  scriptText,
  onScriptChange,
  wordCount,
  onImportClick,
}: TeleprompterEditorDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-3 z-30 bg-slate-950/95 backdrop-blur-lg border border-slate-700 rounded-xl p-4 flex flex-col space-y-3 shadow-2xl animate-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[#5bbbae]" />
          <h4 className="font-bold text-sm text-white">Edit Pitch Script</h4>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Type or paste your presentation text below, or import a .txt file. Words will automatically synchronize during recording.
      </p>
      <textarea
        data-testid="script-textarea"
        value={scriptText}
        onChange={(e) => onScriptChange(e.target.value)}
        rows={7}
        className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-[#5bbbae] font-sans resize-none"
        placeholder="Paste your elevator pitch script here..."
      />
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400 font-mono">
          {wordCount} words • ~{Math.ceil(wordCount / 2.2)}s read
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#5bbbae]" /> Import File
          </button>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-[#5bbbae] hover:bg-[#497d76] text-white text-xs cursor-pointer"
          >
            Save & Use Prompter
          </Button>
        </div>
      </div>
    </div>
  );
}
