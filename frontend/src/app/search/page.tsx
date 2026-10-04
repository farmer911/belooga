"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Play, Filter, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKey = searchParams.get("key") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [query, setQuery] = useState(initialKey);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<{
    results: any[];
    total: number;
    page: number;
    total_pages: number;
  }>({
    results: [],
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch Candidates
  const fetchCandidates = async (searchQuery: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/v1/profile/search/", {
        params: {
          key: searchQuery.trim(),
          page: pageNum,
          limit: 9,
        },
      });
      setData(res.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(initialKey, initialPage);
  }, [initialKey, initialPage]);

  // Debounced Autocomplete
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/v1/profile/search/suggest/?key=${encodeURIComponent(query.trim())}`);
        setSuggestions(res.data);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    router.push(`/search?key=${encodeURIComponent(query.trim())}&page=1`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Search Input */}
        <div className="bg-white rounded-xl p-8 border border-[#d1d6da] shadow-sm space-y-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-extrabold text-[#252525]">
              Talent Discovery & Search
            </h1>
            <p className="text-sm text-[#737475]">
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
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search by name, role, skill, or location..."
                  className="w-full pl-11 pr-4 py-3 bg-[#f8f9fa] border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae] focus:bg-white transition-all"
                />
              </div>
              <Button type="submit" size="lg" className="bg-[#5bbbae] hover:bg-[#497d76] text-white px-8">
                Search
              </Button>
            </form>

            {/* Autocomplete Suggestion Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 top-full mt-2 w-full bg-white border border-[#d1d6da] rounded-lg shadow-xl overflow-hidden divide-y divide-[#f0f2f5]">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(s.full_name);
                      setShowSuggestions(false);
                      router.push(`/public/${s.username}`);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#f8f9fa] transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-[#252525]">{s.full_name}</span>
                      <span className="text-xs text-[#737475] ml-2">@{s.username} • {s.headline}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#737475]">
            <span>Showing {data.results.length} of {data.total} candidate results</span>
            <span>Sorted by relevance</span>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#5bbbae]" />
            </div>
          ) : data.results.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-[#d1d6da] space-y-3">
              <p className="text-lg font-bold text-[#252525]">No candidates found</p>
              <p className="text-sm text-[#737475]">Try adjusting your search keyword or clearing filters.</p>
              <Button variant="outline" size="sm" onClick={() => { setQuery(""); router.push("/search"); }}>
                Reset Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.results.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-white rounded-xl border border-[#d1d6da] overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
                >
                  <Link href={`/public/${candidate.username}`}>
                    <div className="start-content-video cursor-pointer relative">
                      <div className="modal-start">
                        <div className="video-play-icon" />
                      </div>
                      <img
                        src={candidate.video_pitch_poster || "/images/home/matt-poster.png"}
                        alt={candidate.full_name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                        0:30 Pitch
                      </div>
                    </div>
                  </Link>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={candidate.avatar_url || "/images/avatar.jpg"}
                          alt={candidate.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-[#d1d6da]"
                        />
                        <div>
                          <Link href={`/public/${candidate.username}`}>
                            <h3 className="text-base font-bold text-[#252525] group-hover:text-[#5bbbae] transition-colors">
                              {candidate.full_name}
                            </h3>
                          </Link>
                          <p className="text-xs text-[#515151]">{candidate.headline}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#737475] pt-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{candidate.location}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#f0f2f5] flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#5bbbae]/15 text-[#21655e]">
                        {candidate.seeking_status}
                      </span>
                      <Link href={`/public/${candidate.username}`}>
                        <Button size="sm" variant="outline" className="text-xs border-[#5bbbae] text-[#5bbbae]">
                          View CV
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Numeric Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(`/search?key=${encodeURIComponent(query)}&page=${p}`)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold ${
                    p === data.page
                      ? "bg-[#5bbbae] text-white"
                      : "bg-white border border-[#d1d6da] text-[#515151] hover:bg-slate-50"
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
