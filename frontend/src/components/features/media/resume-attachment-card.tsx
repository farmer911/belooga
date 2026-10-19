"use client";

import * as React from "react";
import { FileText, Upload, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ResumeAttachmentCardProps {
  resumeName: string;
  isUploadingResume?: boolean;
  onUploadClick?: () => void;
  onDownloadPdf: () => void;
  isEditable?: boolean;
}

export function ResumeAttachmentCard({
  resumeName,
  isUploadingResume = false,
  onUploadClick,
  onDownloadPdf,
  isEditable = true,
}: ResumeAttachmentCardProps) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-typography-main">Resume PDF Attachment</h2>
        </div>
        {isEditable && onUploadClick && (
          <Button
            size="sm"
            variant="outline"
            disabled={isUploadingResume}
            className="gap-1.5 border-brand-primary text-brand-primary hover:bg-brand-primary/10 cursor-pointer"
            onClick={onUploadClick}
          >
            {isUploadingResume ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload New PDF
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-surface-border bg-surface-page">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-typography-main">{resumeName}</p>
            <p className="text-xs text-typography-muted">PDF Document • Verified on Belooga Cloud</p>
          </div>
        </div>

        <Button
          size="sm"
          className="bg-brand-primary hover:bg-brand-hover text-white gap-2 cursor-pointer"
          onClick={onDownloadPdf}
        >
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>
    </div>
  );
}
