"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, MapPin, Trash2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidateBookmarkItemDTO } from "@/lib/schemas";

export interface SavedShortlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: CandidateBookmarkItemDTO[];
  onRemove: (username: string) => void;
  isPendingFor: (username: string) => boolean;
}

export function SavedShortlistDrawer({
  isOpen,
  onClose,
  bookmarks,
  onRemove,
  isPendingFor,
}: SavedShortlistDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onClick={onClose}>
      <aside
        data-testid="saved-shortlist-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Saved Candidate Shortlist"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md h-full bg-surface-card border-l border-surface-border shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between gap-3 bg-surface-subtle">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookmarkCheck className="w-5 h-5 text-brand-primary shrink-0" aria-hidden="true" />
            <h2 className="text-base font-bold text-typography-main truncate">Saved Candidate Shortlist</h2>
            <span className="px-2 py-0.5 rounded-full bg-brand-overlay text-brand-dark text-xs font-bold">{bookmarks.length}</span>
          </div>
          <button
            type="button"
            data-testid="close-shortlist-drawer-btn"
            aria-label="Close shortlist drawer"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-card text-typography-muted hover:text-typography-main hover:bg-surface-page transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {bookmarks.length === 0 ? (
            <div data-testid="shortlist-empty-state" className="py-16 px-4 text-center space-y-4 rounded-xl border border-dashed border-surface-border bg-surface-page">
              <div className="w-12 h-12 rounded-full bg-surface-card border border-surface-border mx-auto flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-typography-muted" aria-hidden="true" />
              </div>
              <p className="text-xs text-typography-muted leading-relaxed max-w-xs mx-auto">
                No candidates saved yet. Bookmark profiles while browsing search results to compare them here.
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>Back to Search Filters</Button>
            </div>
          ) : (
            bookmarks.map((item) => {
              const pending = isPendingFor(item.username);
              return (
                <div key={item.id || item.username} data-testid={`shortlist-item-${item.username}`} className="p-4 rounded-xl border border-surface-border bg-surface-subtle hover:border-brand-primary/50 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={item.avatar_url || "/images/avatar.jpg"} alt={item.full_name} className="w-10 h-10 rounded-full object-cover border border-surface-border shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-typography-main truncate">{item.full_name}</p>
                        <p className="text-xs text-typography-muted truncate">@{item.username} {item.headline ? `• ${item.headline}` : ""}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid={`remove-bookmark-${item.username}`}
                      aria-label={`Remove ${item.full_name} from shortlist`}
                      disabled={pending}
                      onClick={() => onRemove(item.username)}
                      className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-card text-typography-muted hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer shrink-0 ${pending ? "opacity-70 animate-pulse pointer-events-none cursor-wait" : ""}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-divider">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-typography-muted truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />{item.location}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-brand-overlay text-brand-dark text-[11px] font-semibold shrink-0">{item.seeking_status || "Open to Offers"}</span>
                    </div>
                    <Link href={`/public/${item.username}`} onClick={onClose} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline shrink-0">
                      View Profile <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
