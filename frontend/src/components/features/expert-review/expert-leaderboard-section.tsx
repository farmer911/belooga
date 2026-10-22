"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Star, Clock, TrendingUp, CheckCircle2, CalendarCheck } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { ExpertProfile } from "@/hooks/use-expert-review";
import { Button } from "@/components/ui/button";

export interface RankedExpertItem {
  id: string;
  full_name: string;
  role_title: string;
  company_name: string;
  category: "backend" | "frontend" | "ai" | "devops" | "management";
  badge_title: string;
  ranking_score: number;
  rating: number;
  completed_reviews_count: number;
  avg_ats_lift_points: number;
  avg_turnaround_hours: number;
  interview_callback_rate_pct: number;
  specialties: string[];
}

export const DEFAULT_RANKED_EXPERTS: RankedExpertItem[] = [
  {
    id: "exp-rank-1",
    full_name: "Dr. Trần Minh Quân",
    role_title: "Principal Distributed Systems Architect",
    company_name: "Grab Financial Group",
    category: "backend",
    badge_title: "Grandmaster Mentor",
    ranking_score: 98.4,
    rating: 4.98,
    completed_reviews_count: 186,
    avg_ats_lift_points: 28,
    avg_turnaround_hours: 11,
    interview_callback_rate_pct: 92,
    specialties: ["Golang", "PostgreSQL", "System Design", "High-Scale ATS"],
  },
  {
    id: "exp-rank-2",
    full_name: "Lê Hoàng Nam",
    role_title: "Staff AI & LLM Infrastructure Lead",
    company_name: "Shopee & Sea AI Lab",
    category: "ai",
    badge_title: "Top ATS Lifter",
    ranking_score: 96.2,
    rating: 4.95,
    completed_reviews_count: 142,
    avg_ats_lift_points: 31,
    avg_turnaround_hours: 14,
    interview_callback_rate_pct: 90,
    specialties: ["Python", "PyTorch", "FastAPI", "RAG & Agentic AI"],
  },
  {
    id: "exp-rank-3",
    full_name: "Nguyễn Thu Hà",
    role_title: "Engineering Manager & Hiring Committee Chair",
    company_name: "VNG Cloud",
    category: "management",
    badge_title: "Fastest SLA",
    ranking_score: 94.8,
    rating: 4.93,
    completed_reviews_count: 124,
    avg_ats_lift_points: 25,
    avg_turnaround_hours: 9,
    interview_callback_rate_pct: 89,
    specialties: ["STAR Behavioral", "Tech Lead CV", "Salary Negotiation"],
  },
  {
    id: "exp-rank-4",
    full_name: "Võ Thị Mai",
    role_title: "Staff Frontend & Design System Architect",
    company_name: "M_Service (MoMo)",
    category: "frontend",
    badge_title: "Top Frontend Mentor",
    ranking_score: 93.5,
    rating: 4.91,
    completed_reviews_count: 98,
    avg_ats_lift_points: 24,
    avg_turnaround_hours: 12,
    interview_callback_rate_pct: 88,
    specialties: ["React 19", "Next.js", "TypeScript", "UI/UX Portfolio"],
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả chuyên ngành" },
  { key: "backend", label: "Backend" },
  { key: "frontend", label: "Frontend" },
  { key: "ai", label: "AI / Data" },
  { key: "devops", label: "DevOps" },
  { key: "management", label: "Management" },
];

const SORT_MODES: Array<{ key: "rank" | "ats_lift" | "rating" | "speed" | "reviews_count"; label: string }> = [
  { key: "rank", label: "Top Ranking Tổng" },
  { key: "ats_lift", label: "+ATS Lift Mạnh Nhất" },
  { key: "rating", label: "Đánh Giá Sao Cao Nhất" },
  { key: "speed", label: "Trả Bài Nhanh Nhất" },
  { key: "reviews_count", label: "Chấm Nhiều CV Nhất" },
];

interface ExpertLeaderboardSectionProps {
  customExperts?: RankedExpertItem[];
  onBookExpert: (expert: ExpertProfile) => void;
}

export function ExpertLeaderboardSection({ customExperts = [], onBookExpert }: ExpertLeaderboardSectionProps) {
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"rank" | "ats_lift" | "rating" | "speed" | "reviews_count">("rank");

  const { data: apiExperts = DEFAULT_RANKED_EXPERTS } = useQuery<RankedExpertItem[]>({
    queryKey: ["expert-leaderboard", category, sortBy],
    queryFn: async () => {
      try {
        const res = await apiClient.get<RankedExpertItem[]>("/v1/expert-review/leaderboard", {
          params: { category: category === "all" ? undefined : category, sort_by: sortBy },
        });
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {
        // Fallback to curated leaderboard
      }
      return DEFAULT_RANKED_EXPERTS;
    },
  });

  const mergedExperts = useMemo(() => {
    const seen = new Set(customExperts.map((c) => c.id));
    const combined = [...customExperts, ...apiExperts.filter((a) => !seen.has(a.id))];
    return combined
      .filter((e) => (category === "all" ? true : e.category === category))
      .sort((a, b) => {
        if (sortBy === "ats_lift") return b.avg_ats_lift_points - a.avg_ats_lift_points;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "speed") return a.avg_turnaround_hours - b.avg_turnaround_hours;
        if (sortBy === "reviews_count") return b.completed_reviews_count - a.completed_reviews_count;
        return b.ranking_score - a.ranking_score;
      });
  }, [apiExperts, customExperts, category, sortBy]);

  return (
    <section data-testid="expert-leaderboard-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="p-6 rounded-2xl bg-surface-page border border-surface-border shadow-xs space-y-5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-base font-bold text-typography-main">
              <Award className="w-5 h-5 text-brand-primary" aria-hidden="true" />
              <h2>Bảng Xếp Hạng Chuyên Gia Chấm CV Xuất Sắc Nhất (Expert Leaderboard)</h2>
            </div>
            <p className="text-typography-muted text-xs mt-0.5">
              Xếp hạng minh bạch theo mức tăng điểm ATS thực tế (+ATS Lift), tốc độ trả bài SLA và đánh giá từ ứng viên
            </p>
          </div>
        </div>

        <div data-testid="expert-leaderboard-controls" className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                data-testid={`expert-category-filter-${cat.key}`}
                onClick={() => setCategory(cat.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                  category === cat.key ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-card border-surface-border text-typography-heading hover:border-brand-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-typography-muted mr-1">Sắp xếp theo:</span>
            {SORT_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                data-testid={`expert-sort-btn-${m.key}`}
                onClick={() => setSortBy(m.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                  sortBy === m.key ? "bg-brand-dark text-white border-brand-dark" : "bg-surface-card border-surface-border text-typography-heading hover:border-brand-primary"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div data-testid="expert-leaderboard-podium" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mergedExperts.map((exp, idx) => (
            <div
              key={exp.id}
              data-testid={`expert-leaderboard-card-${exp.id}`}
              className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded bg-brand-dark text-white font-mono font-bold text-[11px]">
                    Rank #{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
                    {exp.badge_title}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-sm text-typography-main">{exp.full_name}</div>
                  <div className="text-[11px] text-typography-muted">{exp.role_title} @ <strong>{exp.company_name}</strong></div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div data-testid={`expert-ats-lift-${exp.id}`} className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    <span>+{exp.avg_ats_lift_points} ATS pts</span>
                  </div>
                  <div data-testid={`expert-rating-${exp.id}`} className="p-1.5 rounded bg-surface-page border border-surface-border text-typography-main font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-current" aria-hidden="true" />
                    <span>{exp.rating} ({exp.completed_reviews_count} CV)</span>
                  </div>
                  <div data-testid={`expert-sla-${exp.id}`} className="p-1.5 rounded bg-surface-page border border-surface-border text-typography-heading flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-primary" aria-hidden="true" />
                    <span>SLA: {exp.avg_turnaround_hours}h</span>
                  </div>
                  <div data-testid={`expert-callback-rate-${exp.id}`} className="p-1.5 rounded bg-teal-50/60 border border-teal-200 text-brand-dark font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-brand-primary" aria-hidden="true" />
                    <span>{exp.interview_callback_rate_pct}% PV</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {exp.specialties.slice(0, 3).map((sp) => (
                    <span key={sp} className="px-2 py-0.5 rounded bg-surface-page border border-surface-border font-mono text-[10px]">{sp}</span>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                data-testid={`expert-leaderboard-book-btn-${exp.id}`}
                onClick={() =>
                  onBookExpert({
                    id: exp.id,
                    full_name: exp.full_name,
                    headline: exp.role_title,
                    bio: `${exp.role_title} @ ${exp.company_name}`,
                    avatar_url: "/images/avatar.jpg",
                    company: exp.company_name,
                    role_category: exp.category,
                    years_of_experience: 8,
                    rating: exp.rating,
                    total_reviews_count: exp.completed_reviews_count,
                    turn_around_days: 1,
                    is_active: true,
                  })
                }
                className="w-full bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 rounded-lg gap-1.5"
              >
                <CalendarCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Đặt Lịch Chấm CV Ngay</span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
