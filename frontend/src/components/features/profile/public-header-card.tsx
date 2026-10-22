"use client";

import * as React from "react";
import { MapPin, AlertTriangle, MessageSquare, Download, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PublicHeaderCardProps {
  fullName: string;
  avatarUrl?: string;
  seekingStatus?: string;
  headline?: string;
  location?: string;
  isBookmarked?: boolean;
  isBookmarkPending?: boolean;
  onBookmarkToggle?: () => void;
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
  isBookmarked = false,
  isBookmarkPending = false,
  onBookmarkToggle,
  onReportClick,
  onContactClick,
  onDownloadResume,
}: PublicHeaderCardProps) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <img
          src={avatarUrl || "/images/avatar.jpg"}
          alt={fullName}
          className="w-20 h-20 rounded-full object-cover border-2 border-brand-primary shadow-sm"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 data-testid="public-candidate-name" className="text-2xl font-bold text-typography-main">
              {fullName}
            </h1>
            {seekingStatus && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                {seekingStatus}
              </span>
            )}
          </div>
          {headline && <p className="text-sm text-typography-heading pt-1 font-medium">{headline}</p>}
          {location && (
            <p className="text-xs text-typography-muted flex items-center gap-1 pt-1">
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
          className="gap-2 text-typography-muted border-surface-border hover:text-red-600 cursor-pointer"
          onClick={onReportClick}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Report Profile
        </Button>
        {onBookmarkToggle && (
          <button
            type="button"
            data-testid="public-profile-bookmark-btn"
            aria-label={isBookmarked ? `Remove ${fullName} from shortlist` : `Save ${fullName} to shortlist`}
            aria-pressed={isBookmarked}
            disabled={isBookmarkPending}
            onClick={onBookmarkToggle}
            className={`min-h-[44px] px-4 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              isBookmarked
                ? "bg-brand-overlay border-brand-primary text-brand-dark"
                : "bg-surface-card border-surface-border text-typography-main hover:border-brand-primary hover:text-brand-primary"
            } ${isBookmarkPending ? "opacity-70 animate-pulse" : ""}`}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                <span>Saved in Shortlist</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" aria-hidden="true" />
                <span>Save to Shortlist</span>
              </>
            )}
          </button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-brand-primary text-brand-primary hover:bg-brand-primary/10 cursor-pointer"
          onClick={onContactClick}
        >
          <MessageSquare className="w-4 h-4" /> Contact Candidate
        </Button>
        <Button
          variant="default"
          size="default"
          className="gap-2 bg-brand-primary hover:bg-brand-hover text-white cursor-pointer"
          onClick={onDownloadResume}
        >
          <Download className="w-4 h-4" /> Download Resume PDF
        </Button>
      </div>
    </div>
  );
}
