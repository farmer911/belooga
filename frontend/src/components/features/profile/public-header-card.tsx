"use client";

import * as React from "react";
import { MapPin, AlertTriangle, MessageSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PublicHeaderCardProps {
  fullName: string;
  avatarUrl?: string;
  seekingStatus?: string;
  headline?: string;
  location?: string;
  onReportClick: () => void;
  onContactClick: () => void;
  onDownloadResume: () => void;
}

export function PublicHeaderCard({
  fullName,
  avatarUrl,
  seekingStatus,
  headline,
  location,
  onReportClick,
  onContactClick,
  onDownloadResume,
}: PublicHeaderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#d1d6da] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <img
          src={avatarUrl || "/images/avatar.jpg"}
          alt={fullName}
          className="w-20 h-20 rounded-full object-cover border-2 border-[#5bbbae] shadow-sm"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 data-testid="public-candidate-name" className="text-2xl font-bold text-[#252525]">
              {fullName}
            </h1>
            {seekingStatus && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                {seekingStatus}
              </span>
            )}
          </div>
          {headline && <p className="text-sm text-[#515151] pt-1 font-medium">{headline}</p>}
          {location && (
            <p className="text-xs text-[#737475] flex items-center gap-1 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {location}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          data-testid="report-profile-btn"
          className="gap-2 text-[#737475] border-[#d1d6da] hover:text-red-600 cursor-pointer"
          onClick={onReportClick}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Report Profile
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae]/10 cursor-pointer"
          onClick={onContactClick}
        >
          <MessageSquare className="w-4 h-4" /> Contact Candidate
        </Button>
        <Button
          variant="default"
          size="default"
          className="gap-2 bg-[#5bbbae] hover:bg-[#497d76] text-white cursor-pointer"
          onClick={onDownloadResume}
        >
          <Download className="w-4 h-4" /> Download Resume PDF
        </Button>
      </div>
    </div>
  );
}
