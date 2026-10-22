import { useQuery } from "@tanstack/react-query";
import {
  CandidatePublicProfileDTO,
  candidatePublicProfileSchema,
  CandidateSearchResponseDTO,
  candidateSearchResponseSchema,
  CandidateTrajectoryDTO,
  candidateTrajectorySchema,
  CandidateTrustScoreDTO,
  candidateTrustScoreSchema,
  searchSuggestionsResponseSchema,
  TrendingInsightsDTO,
  trendingInsightsSchema,
} from "@/lib/schemas";
import { MOBILE_API_BASE_URL, mobileApiClient } from "@/services/api-client";

export interface MobileSearchParams {
  q?: string;
  skill?: string;
  location?: string;
  cursor?: string;
}

export interface MobileCandidateProfileBundle {
  profile: CandidatePublicProfileDTO;
  trust: CandidateTrustScoreDTO;
  trajectory: CandidateTrajectoryDTO;
}

export async function searchMobileCandidates(
  params: MobileSearchParams = {}
): Promise<CandidateSearchResponseDTO> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.skill?.trim()) query.set("skill", params.skill.trim());
  if (params.location?.trim()) query.set("location", params.location.trim());
  if (params.cursor?.trim()) query.set("cursor", params.cursor.trim());
  const qs = query.toString();
  const path = qs ? `/v1/profile/search/?${qs}` : "/v1/profile/search/";
  const raw = await mobileApiClient.get<unknown>(path);
  return candidateSearchResponseSchema.parse(raw);
}

export async function fetchMobileTrendingInsights(): Promise<TrendingInsightsDTO> {
  const raw = await mobileApiClient.get<unknown>("/v1/profile/search/trending/");
  return trendingInsightsSchema.parse(raw);
}

export async function fetchMobileSearchSuggestions(q: string): Promise<string[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const raw = await mobileApiClient.get<unknown>(
    `/v1/profile/search/suggest/?q=${encodeURIComponent(trimmed)}`
  );
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item));
  }
  return searchSuggestionsResponseSchema.parse(raw).suggestions;
}

export async function fetchMobileCandidateProfileBatch(
  username: string
): Promise<MobileCandidateProfileBundle> {
  const cleanUsername = username.trim();
  const rpcPayload = {
    requests: [
      { method: "profile.getPublic", params: { username: cleanUsername } },
      { method: "profile.getTrustScore", params: { username: cleanUsername } },
      { method: "profile.getTrajectory", params: { username: cleanUsername } },
    ],
  };

  const rawBatch = await mobileApiClient.post<{
    responses?: Array<{ status: number; data: unknown }>;
  }>("/v1/rpc/batch", rpcPayload);

  const items = rawBatch.responses ?? [];
  return {
    profile: candidatePublicProfileSchema.parse(items[0]?.data ?? { username: cleanUsername }),
    trust: candidateTrustScoreSchema.parse(items[1]?.data ?? {}),
    trajectory: candidateTrajectorySchema.parse(items[2]?.data ?? {}),
  };
}

export function buildCandidatePdfExportUrl(username: string): string {
  return `${MOBILE_API_BASE_URL}/v1/profile/${encodeURIComponent(username.trim())}/pdf/`;
}

export function useMobileCandidateSearchQuery(params: MobileSearchParams) {
  return useQuery({
    queryKey: ["mobile", "discovery", "search", params] as const,
    queryFn: () => searchMobileCandidates(params),
    staleTime: 30_000,
  });
}

export function useMobileTrendingInsightsQuery() {
  return useQuery({
    queryKey: ["mobile", "discovery", "trending"] as const,
    queryFn: fetchMobileTrendingInsights,
    staleTime: 120_000,
  });
}

export function useMobileCandidateProfileQuery(username: string) {
  return useQuery({
    queryKey: ["mobile", "candidate", "bundle", username] as const,
    queryFn: () => fetchMobileCandidateProfileBatch(username),
    enabled: Boolean(username.trim()),
    staleTime: 60_000,
  });
}

export function useMobileSearchSuggestionsQuery(q: string) {
  return useQuery({
    queryKey: ["mobile", "discovery", "suggest", q] as const,
    queryFn: () => fetchMobileSearchSuggestions(q),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}
