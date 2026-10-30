"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, User, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, getApiErrorDetail } from "@/services/api-client";
import { VideoPitchModal } from "@/components/features/media/video-pitch-modal";
import { SavedShortlistDrawer } from "@/components/features/search/saved-shortlist-drawer";
import { SkillFilterBar, SearchCandidateCard, SearchCandidateItem, deriveCandidateSkills } from "@/components/features/search/skill-filter-bar";
import { TopCandidatesLeaderboard } from "@/components/features/search/top-candidates-leaderboard";
import { useBookmarks } from "@/hooks/use-bookmarks";

interface SearchSuggestionItem { username: string; full_name: string; headline?: string; }
interface SearchResponseData { results: SearchCandidateItem[]; total: number; page: number; total_pages: number; }
interface SearchTrendingData {
  total_searchable_profiles: number; video_verified_pct: number;
  trending_queries: Array<{ keyword: string; demand_growth: string; category: string }>; recruiter_tip: string;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKey = searchParams.get("key") || "";
  const initialSkillsParam = searchParams.get("skills") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [query, setQuery] = useState(initialKey);
  const [debouncedQuery, setDebouncedQuery] = useState(initialKey);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialSkillsParam ? initialSkillsParam.split(",").map((s) => s.trim()).filter(Boolean) : []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [videoOnly, setVideoOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeVideoCandidate, setActiveVideoCandidate] = useState<SearchCandidateItem | null>(null);
  const [searchFallbackNotice, setSearchFallbackNotice] = useState<string | null>(null);
  const { bookmarks, isBookmarked, isPendingFor, toggleBookmark, removeBookmark } = useBookmarks();

  const [syncedKey, setSyncedKey] = useState(initialKey);
  if (syncedKey !== initialKey) { setSyncedKey(initialKey); setQuery(initialKey); } // URL ?key= changed (back/forward)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const syncUrlParams = (nextKey: string, nextSkills: string[], nextPage = 1) => {
    const params = new URLSearchParams();
    if (nextKey.trim()) params.set("key", nextKey.trim());
    if (nextSkills.length > 0) params.set("skills", nextSkills.join(","));
    params.set("page", String(nextPage));
    router.push(`/search?${params.toString()}`);
  };

  const handleToggleSkill = (skill: string) => {
    const exists = selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
    const next = exists ? selectedSkills.filter((s) => s.toLowerCase() !== skill.toLowerCase()) : [...selectedSkills, skill];
    setSelectedSkills(next);
    syncUrlParams(query, next, 1);
  };

  const { data = { results: [], total: 0, page: 1, total_pages: 1 }, isLoading } = useQuery<SearchResponseData>({
    queryKey: ["candidate-search", initialKey, selectedSkills.join(","), initialPage],
    queryFn: async () => {
      const skillsParam = selectedSkills.join(",");
      if (skillsParam) {
        try {
          const res = await apiClient.get<SearchResponseData>("/v1/search/candidates", { params: { key: initialKey.trim(), skills: skillsParam, page: initialPage, limit: 9 } });
          if (Array.isArray(res.data?.results)) { setSearchFallbackNotice(null); return res.data; }
        } catch (err: unknown) {
          setSearchFallbackNotice(getApiErrorDetail(err, "Đang dùng bộ lọc kỹ năng dự phòng (/v1/profile/search/)."));
        }
      }
      return (await apiClient.get<SearchResponseData>("/v1/profile/search/", { params: { key: initialKey.trim(), skills: skillsParam || undefined, page: initialPage, limit: 9 } })).data;
    },
  });
  const { data: suggestions = [] } = useQuery<SearchSuggestionItem[]>({
    queryKey: ["candidate-suggest", debouncedQuery],
    queryFn: async () => (await apiClient.get<SearchSuggestionItem[]>(`/v1/profile/search/suggest/?key=${encodeURIComponent(debouncedQuery)}`)).data,
    enabled: debouncedQuery.length >= 2,
  });
  const { data: trending = null } = useQuery<SearchTrendingData | null>({
    queryKey: ["candidate-search-trending"],
    queryFn: async () => (await apiClient.get<SearchTrendingData>("/v1/profile/search/trending/")).data,
  });
  const { data: catalogLocations = [] } = useQuery<Array<{ id?: string; name: string }>>({
    queryKey: ["catalog-locations"],
    queryFn: async () => (await apiClient.get<Array<{ id?: string; name: string }>>("/v1/catalogs/locations/")).data,
    staleTime: 60_000,
  });
  const locationOptions = Array.from(new Set(["San Francisco", "Ho Chi Minh", "Remote", ...catalogLocations.map((l) => l.name).filter(Boolean)]));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    syncUrlParams(query, selectedSkills, 1);
  };

  const candidates = data.results.filter((c) => {
    if (statusFilter !== "ALL" && !(c.seeking_status || "").toLowerCase().includes(statusFilter.toLowerCase())) return false;
    if (locationFilter !== "ALL" && !(c.location || "").toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (videoOnly && !c.video_pitch_poster && !c.video_pitch_url) return false;
    if (selectedSkills.length > 0) {
      const cSkills = deriveCandidateSkills(c).map((s) => s.toLowerCase());
      const hay = `${c.full_name} ${c.headline || ""} ${cSkills.join(" ")}`.toLowerCase();
      return selectedSkills.some((req) => hay.includes(req.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-surface-page py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-surface-card rounded-xl p-8 border border-surface-border shadow-sm space-y-5">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-extrabold text-typography-main">Talent Discovery & Search</h1>
            <p className="text-sm text-typography-muted">Search through candidates across engineering, design, and product with verified 0:30 video elevator pitches.</p>
          </div>

          <div className="relative max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-typography-muted"><Search className="w-5 h-5" /></div>
                <input type="text" data-testid="search-input" value={query} onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} placeholder="Search by name, role, skill, or location..." className="w-full pl-11 pr-4 py-3 bg-surface-page border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-surface-card transition-all" />
              </div>
              <Button type="submit" size="lg" data-testid="search-submit-btn" className="bg-brand-primary hover:bg-brand-hover text-white px-8">Search</Button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 top-full mt-2 w-full bg-surface-card border border-surface-border rounded-lg shadow-xl overflow-hidden divide-y divide-surface-divider">
                {suggestions.map((s, idx) => (
                  <button key={idx} type="button" onClick={() => { setQuery(s.full_name); setShowSuggestions(false); router.push(`/public/${s.username}`); }} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-page transition-colors">
                    <User className="w-4 h-4 text-typography-muted flex-shrink-0" />
                    <div><span className="text-sm font-semibold text-typography-main">{s.full_name}</span><span className="text-xs text-typography-muted ml-2">@{s.username} • {s.headline}</span></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div data-testid="search-facet-filters" className="flex flex-wrap items-center gap-3 text-xs pt-1">
            <select aria-label="Filter by seeking status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface-page text-typography-heading">
              <option value="ALL">All Statuses</option>
              <option value="Actively Looking">Actively Looking</option>
              <option value="Open to Offers">Open to Offers</option>
            </select>
            <select aria-label="Filter by location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface-page text-typography-heading">
              <option value="ALL">All Locations</option>
              {locationOptions.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-page text-typography-heading cursor-pointer">
              <input type="checkbox" checked={videoOnly} onChange={(e) => setVideoOnly(e.target.checked)} className="rounded text-brand-primary" />
              <span>0:30 Video Verified Only</span>
            </label>
            {(statusFilter !== "ALL" || locationFilter !== "ALL" || videoOnly || selectedSkills.length > 0) && (
              <button type="button" onClick={() => { setStatusFilter("ALL"); setLocationFilter("ALL"); setVideoOnly(false); setSelectedSkills([]); syncUrlParams(query, [], 1); }} className="text-brand-primary font-semibold hover:underline cursor-pointer">Clear Filters</button>
            )}
            <button type="button" data-testid="open-shortlist-drawer-btn" onClick={() => setDrawerOpen(true)} className="min-h-[44px] px-3.5 py-2 rounded-lg border border-brand-primary bg-brand-overlay text-brand-dark font-semibold inline-flex items-center gap-2 cursor-pointer">
              <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
              <span>Saved Shortlist ({bookmarks.length})</span>
            </button>
          </div>

          <SkillFilterBar selectedSkills={selectedSkills} onToggleSkill={handleToggleSkill} onClearSkills={() => { setSelectedSkills([]); syncUrlParams(query, [], 1); }} />

          {trending && (
            <div data-testid="search-trending-insights-bar" className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-typography-heading">Trending Skills ({trending.video_verified_pct}% Video Verified):</span>
              {trending.trending_queries.map((t) => (
                <button key={t.keyword} type="button" onClick={() => { setQuery(t.keyword); syncUrlParams(t.keyword, selectedSkills, 1); }} className="px-2.5 py-1 rounded-full bg-brand-overlay border border-brand-primary/30 text-brand-dark font-semibold transition-colors cursor-pointer">
                  {t.keyword} <span className="text-emerald-700 font-bold">{t.demand_growth}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <TopCandidatesLeaderboard variant="leaderboard" />

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-typography-muted">
            <span>Showing {candidates.length} of {data.total} candidate results</span>
            <span title={searchFallbackNotice || undefined}>Sorted by relevance & skill match</span>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
          ) : candidates.length === 0 ? (
            <div data-testid="search-empty-state" className="bg-surface-card rounded-xl p-12 text-center border border-surface-border space-y-3">
              <p className="text-lg font-bold text-typography-main">No candidates found</p>
              <p className="text-sm text-typography-muted">Try adjusting your search keyword or clearing filters.</p>
              <Button variant="outline" size="sm" onClick={() => { setQuery(""); setStatusFilter("ALL"); setLocationFilter("ALL"); setVideoOnly(false); setSelectedSkills([]); router.push("/search"); }}>Reset Search</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <SearchCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  selectedSkills={selectedSkills}
                  bookmarked={isBookmarked(candidate.username)}
                  pending={isPendingFor(candidate.username)}
                  onToggleBookmark={toggleBookmark}
                  onPlayVideo={setActiveVideoCandidate}
                />
              ))}
            </div>
          )}

          {data.total_pages > 1 && (
            <div data-testid="search-pagination" className="flex items-center justify-center gap-2 pt-8">
              {Array.from({ length: Math.min(data.total_pages, 10) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => syncUrlParams(initialKey, selectedSkills, p)} className={`w-9 h-9 rounded-lg text-xs font-semibold ${p === data.page ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading hover:bg-surface-page"}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <SavedShortlistDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} bookmarks={bookmarks} onRemove={removeBookmark} isPendingFor={isPendingFor} />
      <VideoPitchModal isOpen={Boolean(activeVideoCandidate)} onClose={() => setActiveVideoCandidate(null)} candidateName={activeVideoCandidate?.full_name || "Candidate"} videoUrl={activeVideoCandidate?.video_pitch_url} posterUrl={activeVideoCandidate?.video_pitch_poster} />
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="py-20 text-center">Loading search...</div>}><SearchContent /></Suspense>;
}
