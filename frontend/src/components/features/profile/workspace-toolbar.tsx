"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Edit3, Download, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WorkspaceToolbarProps {
  username: string;
  isHidden?: boolean;
  onToggleVisibility: () => void;
  onDownloadPdf: () => void;
}

export function WorkspaceToolbar({
  username,
  isHidden = false,
  onToggleVisibility,
  onDownloadPdf,
}: WorkspaceToolbarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-surface-card p-4 rounded-xl border border-surface-border shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Workspace Live & Interactive
        </span>
        <span className="text-xs text-typography-muted">Drag & Drop Timeline • Chunked Upload Active</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          data-testid="visibility-toggle"
          className="gap-2 text-xs border-surface-border"
          onClick={onToggleVisibility}
        >
          {isHidden ? (
            <>
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Profile Hidden</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Profile Public</span>
            </>
          )}
        </Button>
        <Link href={`/public/${username}`}>
          <Button variant="outline" size="sm" className="gap-2 text-typography-heading">
            <ExternalLink className="w-4 h-4" aria-hidden="true" /> View Public CV
          </Button>
        </Link>
        <Link href={`/user/${username}/update`}>
          <Button variant="outline" size="sm" className="gap-2 border-brand-primary text-brand-primary">
            <Edit3 className="w-4 h-4" aria-hidden="true" /> Edit Bio & Info
          </Button>
        </Link>
        <Button
          variant="default"
          size="sm"
          data-testid="download-pdf-btn"
          className="gap-2 bg-brand-primary hover:bg-brand-hover text-white"
          onClick={onDownloadPdf}
        >
          <Download className="w-4 h-4" aria-hidden="true" /> Download Official PDF
        </Button>
      </div>
    </div>
  );
}
