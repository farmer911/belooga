"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Sparkles, Video, Bookmark, BookmarkCheck, Send, MapPin } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useBookmarks } from "@/hooks/use-bookmarks";

export interface TopCandidateRankItem {
  rank: number;
  username: string;
  full_name: string;
  headline: string;
  category: "backend" | "frontend" | "ai" | "mobile" | "devops";
  location: string;
  potential_score: number;
  badge_tier: "TOP_1_PCT" | "TOP_5_PCT" | "RISING_STAR";
  highlight_reason: string;
  skills: string[];
  actively_looking: boolean;
  has_video_pitch: boolean;
}

const DEFAULT_TOP_CANDIDATES: TopCandidateRankItem[] = [
  {
    rank: 1,
    username: "phucnguyen",
    full_name: "Nguyễn Minh Phúc",
    headline: "Principal Distributed Systems & Golang Architect",
    category: "backend",
    location: "Ho Chi Minh",
    potential_score: 98,
    badge_tier: "TOP_1_PCT",
    highlight_reason: "96% ATS Benchmark • Verified 60s Video Pitch • 7+ yrs High-Scale 25k CCU Architecture",
    skills: ["Golang", "Python", "FastAPI", "PostgreSQL"],
    actively_looking: true,
    has_video_pitch: true,
  },
  {
    rank: 2,
    username: "huypham",
    full_name: "Phạm Gia Huy",
    headline: "Senior AI Infrastructure & PyTorch Engineer",
    category: "ai",
    location: "Ha Noi",
    potential_score: 95,
    badge_tier: "TOP_1_PCT",
    highlight_reason: "Top 1% AI/LLM Pipeline & Async FastAPI • Verified Video Pitch",
    skills: ["Python", "PyTorch", "FastAPI", "Kubernetes"],
    actively_looking: true,
    has_video_pitch: true,
  },
  {
    rank: 3,
    username: "maivo",
    full_name: "Võ Thị Mai",
    headline: "Staff Frontend React 19 & Design Systems Lead",
    category: "frontend",
    location: "Remote",
    potential_score: 93,
    badge_tier: "RISING_STAR",
    highlight_reason: "React 19 App Router & Tailwind v4 Design System Lead • 92% ATS Match",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    actively_looking: true,
    has_video_pitch: true,
  },
  {
    rank: 4,
    username: "khoatran",
    full_name: "Trần Đăng Khoa",
    headline: "Lead React Native & Expo Mobile Architect",
    category: "mobile",
    location: "Ho Chi Minh",
    potential_score: 91,
    badge_tier: "TOP_5_PCT",
    highlight_reason: "Expo SDK 58 Clean-APK Pipeline & Native UIAutomator2 E2E Specialist",
    skills: ["React Native", "TypeScript", "Expo", "Android"],
    actively_looking: false,
    has_video_pitch: true,
  },
  {
    rank: 5,
    username: "linhle",
    full_name: "Lê Hoàng Linh",
    headline: "Principal Cloud Native & Kubernetes SRE",
    category: "devops",
    location: "Da Nang / Remote",
    potential_score: 90,
    badge_tier: "TOP_5_PCT",
    highlight_reason: "Zero-Downtime K8s HPA & Nginx Distributed Redis Gateway",
    skills: ["Kubernetes", "Docker", "Golang", "AWS"],
    actively_looking: true,
    has_video_pitch: true,
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "backend", label: "Backend" },
  { key: "frontend", label: "Frontend" },
  { key: "ai", label: "AI / Data" },
  { key: "mobile", label: "Mobile" },
  { key: "devops", label: "DevOps" },
];

function formatBadgeLabel(tier: TopCandidateRankItem["badge_tier"]): string {
  if (tier === "TOP_1_PCT") return "Top 1% Talent";
  if (tier === "TOP_5_PCT") return "Top 5% Talent";
  return "Rising Star";
}

interface TopCandidatesLeaderboardProps {
  variant?: "leaderboard" | "spotlight";
}

export function TopCandidatesLeaderboard({ variant = "leaderboard" }: TopCandidatesLeaderboardProps) {
  const [category, setCategory] = useState<string>("all");
  const [activelyLookingOnly, setActivelyLookingOnly] = useState<boolean>(false);
  const [invitedUsernames, setInvitedUsernames] = useState<string[]>([]);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const { data: candidates = DEFAULT_TOP_CANDIDATES } = useQuery<TopCandidateRankItem[]>({
    queryKey: ["top-candidates", category, activelyLookingOnly],
    queryFn: async () => {
      try {
        const res = await apiClient.get<TopCandidateRankItem[]>("/v1/search/top-candidates", {
          params: { category: category === "all" ? undefined : category, actively_looking_only: activelyLookingOnly },
        });
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {
        // Fallback to curated leaderboard
      }
      return DEFAULT_TOP_CANDIDATES;
    },
  });

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (activelyLookingOnly && !c.actively_looking) return false;
      if (category !== "all" && c.category !== category) return false;
      return true;
    });
  }, [candidates, category, activelyLookingOnly]);

  const displayed = variant === "spotlight" ? filtered.slice(0, 3) : filtered;

  return (
    <section
      data-testid={variant === "spotlight" ? "top-candidates-spotlight" : "top-candidates-leaderboard"}
      className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-4 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-sm font-bold text-typography-main">
            <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>Bảng Xếp Hạng Top Ứng Viên Tiềm Năng (Top High-Potential Talent)</span>
          </div>
          <p className="text-[11px] text-typography-muted">
            Chấm điểm tự động từ điểm chuẩn ATS, Video Pitch 60s xác thực và chiều sâu kiến trúc dự án
          </p>
        </div>

        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-page border border-surface-border font-semibold cursor-pointer">
          <input
            type="checkbox"
            data-testid="top-candidates-active-toggle"
            checked={activelyLookingOnly}
            onChange={(e) => setActivelyLookingOnly(e.target.checked)}
          />
          <span>Sẵn sàng đi làm ngay</span>
        </label>
      </div>

      <div data-testid="top-candidates-filter-bar" className="flex flex-wrap items-center gap-1.5">
        {CATEGORIES.map((cat) => {
          const active = category === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              data-testid={`top-candidates-category-${cat.key}`}
              onClick={() => setCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                active ? "bg-brand-primary text-white border-brand-primary shadow-xs" : "bg-surface-page border-surface-border text-typography-heading hover:border-brand-primary"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {displayed.map((c, idx) => {
          const saved = isBookmarked(c.username);
          const invited = invitedUsernames.includes(c.username);
          return (
            <div
              key={c.username}
              data-testid={`top-candidate-card-${c.username}`}
              className="p-4 rounded-xl bg-surface-page border border-surface-border flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-brand-dark text-white font-mono font-bold text-[11px]">
                      #{c.rank || idx + 1}
                    </span>
                    <span
                      data-testid={`top-candidate-badge-${c.username}`}
                      className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]"
                    >
                      {formatBadgeLabel(c.badge_tier)}
                    </span>
                  </div>
                  <span
                    data-testid={`top-candidate-score-${c.username}`}
                    className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-[11px]"
                  >
                    {c.potential_score} / 100 pts
                  </span>
                </div>

                <div>
                  <Link href={`/public/${c.username}`} className="font-bold text-sm text-typography-main hover:text-brand-primary">
                    {c.full_name}
                  </Link>
                  <div className="text-[11px] text-typography-muted flex items-center gap-1.5 mt-0.5">
                    <span>{c.headline}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" aria-hidden="true" /> {c.location}</span>
                  </div>
                </div>

                <div
                  data-testid={`top-candidate-reason-${c.username}`}
                  className="p-2 rounded-lg bg-teal-50/60 border border-teal-200 text-[11px] text-brand-dark flex items-start gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{c.highlight_reason}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {c.skills.map((sk) => (
                    <span key={sk} className="px-2 py-0.5 rounded bg-surface-card border border-surface-border font-mono text-[10px] text-typography-heading">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2.5 border-t border-surface-border flex items-center justify-between gap-1.5">
                <Link
                  href={`/public/${c.username}`}
                  data-testid={`top-candidate-view-btn-${c.username}`}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-card border border-surface-border text-typography-heading hover:border-brand-primary font-semibold inline-flex items-center gap-1"
                >
                  <Video className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
                  <span>Pitch & CV</span>
                </Link>

                <button
                  type="button"
                  data-testid={`top-candidate-bookmark-btn-${c.username}`}
                  onClick={() => toggleBookmark(c.username)}
                  className={`px-2.5 py-1.5 rounded-lg border font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    saved ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-card border-surface-border text-typography-heading"
                  }`}
                >
                  {saved ? <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" /> : <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{saved ? "Đã Lưu" : "Lưu"}</span>
                </button>

                <button
                  type="button"
                  data-testid={`top-candidate-invite-btn-${c.username}`}
                  onClick={() => setInvitedUsernames((prev) => [...prev, c.username])}
                  className="px-2.5 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{invited ? "Đã Mời PV" : "Mời PV"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
