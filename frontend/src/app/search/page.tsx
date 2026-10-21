"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

interface SearchCandidateItem {
  id: string;
  username: string;
  full_name: string;
  headline?: string;
  location?: string;
  seeking_status?: string;
  avatar_url?: string;
  video_pitch_poster?: string;
}

interface SearchSuggestionItem {
  username: string;
  full_name: string;
  headline?: string;
}

interface SearchResponseData {
  results: SearchCandidateItem[];
  total: number;
  page: number;
  total_pages: number;
}

interface SearchTrendingData {
  total_searchable_profiles: number;
  video_verified_pct: number;
  trending_queries: Array<{ keyword: string; demand_growth: string; category: string }>;
  recruiter_tip: string;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKey = searchParams.get("key") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [query, setQuery] = useState(initialKey);
  const [debouncedQuery, setDebouncedQuery] = useState(initialKey);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data = { results: [], total: 0, page: 1, total_pages: 1 }, isLoading } = useQuery<SearchResponseData>({
    queryKey: ["candidate-search", initialKey, initialPage],
    queryFn: async () => (await apiClient.get<SearchResponseData>("/v1/profile/search/", { params: { key: initialKey.trim(), page: initialPage, limit: 9 } })).data,
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    router.push(`/search?key=${encodeURIComponent(query.trim())}&page=1`);
  };

  return (
    <div className="min-h-screen bg-surface-page py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-surface-card rounded-xl p-8 border border-surface-border shadow-sm space-y-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-extrabold text-typography-main">Talent Discovery & Search</h1>
            <p className="text-sm text-typography-muted">
              Search through candidates across engineering, design, and product with verified 0:30 video elevator pitches.
            </p>
          </div>

          <div className="relative max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  data-testid="search-input"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search by name, role, skill, or location..."
                  className="w-full pl-11 pr-4 py-3 bg-surface-page border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-surface-card transition-all"
                />
              </div>
              <Button type="submit" size="lg" data-testid="search-submit-btn" className="bg-brand-primary hover:bg-brand-hover text-white px-8">
                Search
              </Button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 top-full mt-2 w-full bg-surface-card border border-surface-border rounded-lg shadow-xl overflow-hidden divide-y divide-surface-divider">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setQuery(s.full_name); setShowSuggestions(false); router.push(`/public/${s.username}`); }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-page transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-typography-main">{s.full_name}</span>
                      <span className="text-xs text-typography-muted ml-2">@{s.username} • {s.headline}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {trending && (
            <div data-testid="search-trending-insights-bar" className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">Trending Skills ({trending.video_verified_pct}% Video Verified):</span>
              {trending.trending_queries.map((t) => (
                <button
                  key={t.keyword}
                  type="button"
                  onClick={() => { setQuery(t.keyword); router.push(`/search?key=${encodeURIComponent(t.keyword)}&page=1`); }}
                  className="px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-semibold transition-colors cursor-pointer"
                >
                  {t.keyword} <span className="text-emerald-700 font-bold">{t.demand_growth}</span>
                </button>
              ))}
            </div>
          )}
        </div>


        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-typography-muted">
            <span>Showing {data.results.length} of {data.total} candidate results</span>
            <span>Sorted by relevance</span>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
          ) : data.results.length === 0 ? (
            <div data-testid="search-empty-state" className="bg-surface-card rounded-xl p-12 text-center border border-surface-border space-y-3">
              <p className="text-lg font-bold text-typography-main">No candidates found</p>
              <p className="text-sm text-typography-muted">Try adjusting your search keyword or clearing filters.</p>
              <Button variant="outline" size="sm" onClick={() => { setQuery(""); router.push("/search"); }}>Reset Search</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.results.map((candidate) => (
                <div
                  key={candidate.id}
                  data-testid="candidate-card"
                  className="bg-surface-card rounded-xl border border-surface-border overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
                >
                  <Link href={`/public/${candidate.username}`}>
                    <div className="start-content-video cursor-pointer relative">
                      <div className="modal-start"><div className="video-play-icon" /></div>
                      <img src={candidate.video_pitch_poster || "/images/home/matt-poster.png"} alt={candidate.full_name} className="w-full h-48 object-cover" />
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold">0:30 Pitch</div>
                    </div>
                  </Link>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <img src={candidate.avatar_url || "/images/avatar.jpg"} alt={candidate.full_name} className="w-10 h-10 rounded-full object-cover border border-surface-border" />
                        <div>
                          <Link href={`/public/${candidate.username}`}>
                            <h3 data-testid="candidate-card-name" className="text-base font-bold text-typography-main group-hover:text-brand-primary transition-colors">
                              {candidate.full_name}
                            </h3>
                          </Link>
                          <p data-testid="candidate-card-headline" className="text-xs text-typography-heading">{candidate.headline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-typography-muted pt-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{candidate.location}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-surface-divider flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-dark">{candidate.seeking_status}</span>
                      <Link href={`/public/${candidate.username}`}>
                        <Button size="sm" variant="outline" className="text-xs border-brand-primary text-brand-primary">View CV</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.total_pages > 1 && (
            <div data-testid="search-pagination" className="flex items-center justify-center gap-2 pt-8">
              {Array.from({ length: Math.min(data.total_pages, 10) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(`/search?key=${encodeURIComponent(query)}&page=${p}`)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold ${
                    p === data.page ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
