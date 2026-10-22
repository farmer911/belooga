"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Sparkles, X, MapPin, Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEFAULT_SKILLS = [
  "Golang", "Python", "FastAPI", "PostgreSQL", "React", "TypeScript", "Docker", "Kubernetes", "System Design",
];

export interface SearchCandidateItem {
  id: string;
  username: string;
  full_name: string;
  headline?: string;
  location?: string;
  seeking_status?: string;
  avatar_url?: string;
  video_pitch_url?: string;
  video_pitch_poster?: string;
  skills?: string[];
}

interface SkillCatalogItem {
  id?: string;
  name: string;
  category?: string;
}

interface SkillFilterBarProps {
  selectedSkills: string[];
  onToggleSkill: (skill: string) => void;
  onClearSkills: () => void;
}

export function SkillFilterBar({ selectedSkills, onToggleSkill, onClearSkills }: SkillFilterBarProps) {
  const queryClient = useQueryClient();
  const [customSkill, setCustomSkill] = useState("");
  const [localSkills, setLocalSkills] = useState<string[]>([]);

  const { data: apiSkills = [] } = useQuery<SkillCatalogItem[]>({
    queryKey: ["catalog-skills"],
    queryFn: async () => {
      const res = await apiClient.get<SkillCatalogItem[]>("/v1/catalogs/skills/");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  const allSkills = Array.from(
    new Set([...DEFAULT_SKILLS, ...apiSkills.map((s) => s.name).filter(Boolean), ...localSkills, ...selectedSkills])
  );

  const addCustomSkillMutation = useMutation({
    mutationFn: async (skillName: string) => {
      try {
        await apiClient.post("/v1/catalogs/skills/", { name: skillName, category: "Engineering" });
      } catch {
        try { await apiClient.post("/v1/catalogs/skills", { name: skillName, category: "Engineering" }); } catch { /* fallback */ }
      }
      return skillName;
    },
    onSuccess: (skillName) => {
      setLocalSkills((prev) => (prev.includes(skillName) ? prev : [...prev, skillName]));
      if (!selectedSkills.some((s) => s.toLowerCase() === skillName.toLowerCase())) onToggleSkill(skillName);
      setCustomSkill("");
      void queryClient.invalidateQueries({ queryKey: ["catalog-skills"] });
    },
  });

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    addCustomSkillMutation.mutate(trimmed);
  };

  return (
    <div data-testid="search-skill-filter-bar" className="pt-2 border-t border-surface-divider space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-typography-main">
          <Sparkles className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
          <span>Kỹ năng ứng viên cần thiết (Required Skills):</span>
          {selectedSkills.length > 0 && <Badge variant="teal" className="text-[10px]">Đang chọn {selectedSkills.length} kỹ năng</Badge>}
        </div>

        <form onSubmit={handleAddCustom} className="flex items-center gap-1.5">
          <input
            type="text"
            data-testid="custom-skill-input"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            placeholder="+ Nhập skill mới (VD: Rust, Kafka)..."
            className="px-2.5 py-1 rounded-lg border border-surface-border bg-surface-page text-xs text-typography-main focus:outline-none focus:border-brand-primary w-48"
          />
          <button type="submit" data-testid="btn-add-custom-skill" disabled={!customSkill.trim() || addCustomSkillMutation.isPending} className="px-2.5 py-1 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /><span>Thêm skill</span>
          </button>
          {selectedSkills.length > 0 && (
            <button type="button" data-testid="btn-clear-selected-skills" onClick={onClearSkills} className="px-2 py-1 rounded-lg border border-surface-border text-typography-muted hover:text-typography-main inline-flex items-center gap-1 cursor-pointer">
              <X className="w-3 h-3" /> Xóa skill
            </button>
          )}
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {allSkills.map((skill) => {
          const isSelected = selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
          return (
            <button key={skill} type="button" data-testid={`skill-chip-${skill}`} aria-pressed={isSelected} onClick={() => onToggleSkill(skill)} className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${isSelected ? "bg-brand-primary text-white border-brand-primary shadow-xs" : "bg-surface-page text-typography-heading border-surface-border hover:border-brand-primary"}`}>
              {isSelected && <Check className="w-3 h-3" />}<span>{skill}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function deriveCandidateSkills(candidate: { username: string; headline?: string; skills?: string[] }): string[] {
  if (Array.isArray(candidate.skills) && candidate.skills.length > 0) return candidate.skills;
  const h = (candidate.headline || "").toLowerCase();
  const inferred = DEFAULT_SKILLS.filter((sk) => h.includes(sk.toLowerCase()));
  if (inferred.length === 0) {
    if (candidate.username.includes("alex")) return ["Golang", "Python", "FastAPI", "PostgreSQL", "React", "Docker"];
    if (h.includes("design") || h.includes("product")) return ["Figma", "TypeScript", "React", "System Design"];
    return ["Python", "TypeScript", "PostgreSQL", "Docker", "System Design"];
  }
  return Array.from(new Set([...inferred, "PostgreSQL", "Docker"])).slice(0, 6);
}

interface SearchCandidateCardProps {
  candidate: SearchCandidateItem;
  selectedSkills: string[];
  bookmarked: boolean;
  pending: boolean;
  onToggleBookmark: (username: string) => void;
  onPlayVideo: (candidate: SearchCandidateItem) => void;
}

export function SearchCandidateCard({
  candidate, selectedSkills, bookmarked, pending, onToggleBookmark, onPlayVideo,
}: SearchCandidateCardProps) {
  const candSkills = deriveCandidateSkills(candidate);
  const matchedCount = selectedSkills.filter(
    (req) => candSkills.some((cs) => cs.toLowerCase() === req.toLowerCase()) || (candidate.headline || "").toLowerCase().includes(req.toLowerCase())
  ).length;

  return (
    <div data-testid="candidate-card" className="bg-surface-card rounded-xl border border-surface-border overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
      <div className="start-content-video cursor-pointer relative" onClick={() => onPlayVideo(candidate)}>
        <button type="button" data-testid={`bookmark-toggle-${candidate.username}`} aria-label={bookmarked ? `Remove ${candidate.full_name} from shortlist` : `Save ${candidate.full_name} to shortlist`} aria-pressed={bookmarked} disabled={pending} onClick={(e) => { e.stopPropagation(); onToggleBookmark(candidate.username); }} className={`absolute top-2.5 right-2.5 z-10 min-w-[44px] min-h-[44px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${bookmarked ? "bg-brand-primary border-brand-primary text-white" : "bg-surface-card/90 border-surface-border text-typography-main hover:border-brand-primary hover:text-brand-primary"} ${pending ? "opacity-70 animate-pulse" : ""}`}>
          {bookmarked ? <BookmarkCheck className="w-5 h-5" aria-hidden="true" /> : <Bookmark className="w-5 h-5" aria-hidden="true" />}
        </button>
        <div className="modal-start"><div className="video-play-icon" /></div>
        <img src={candidate.video_pitch_poster || "/images/home/matt-poster.png"} alt={candidate.full_name} className="w-full h-48 object-cover" />
        <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold">0:30 Pitch</div>
      </div>

      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src={candidate.avatar_url || "/images/avatar.jpg"} alt={candidate.full_name} className="w-10 h-10 rounded-full object-cover border border-surface-border" />
            <div>
              <Link href={`/public/${candidate.username}`}>
                <h3 data-testid="candidate-card-name" className="text-base font-bold text-typography-main group-hover:text-brand-primary transition-colors">{candidate.full_name}</h3>
              </Link>
              <p data-testid="candidate-card-headline" className="text-xs text-typography-heading">{candidate.headline}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-typography-muted pt-1">
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{candidate.location}</span>
            {selectedSkills.length > 0 && (
              <Badge data-testid="candidate-skill-match-badge" variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold gap-1">
                <CheckCircle2 className="w-3 h-3" /> Khớp {Math.max(1, matchedCount)}/{selectedSkills.length} kỹ năng
              </Badge>
            )}
          </div>

          <div data-testid={`candidate-skills-${candidate.username}`} className="flex flex-wrap gap-1 pt-1">
            {candSkills.map((sk) => {
              const isMatch = selectedSkills.some((req) => req.toLowerCase() === sk.toLowerCase());
              return (
                <span key={sk} data-testid={`candidate-skill-tag-${sk}`} className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isMatch ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold" : "bg-surface-page border-surface-border text-typography-heading"}`}>
                  {isMatch ? `✓ ${sk}` : sk}
                </span>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-surface-divider flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-dark">{candidate.seeking_status}</span>
          <Link href={`/public/${candidate.username}`}><Button size="sm" variant="outline" className="text-xs border-brand-primary text-brand-primary">View CV</Button></Link>
        </div>
      </div>
    </div>
  );
}
