import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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
  SkillCatalogItemDTO,
  skillCatalogItemSchema,
  TrendingInsightsDTO,
  trendingInsightsSchema,
} from "@/lib/schemas";
import { MOBILE_API_BASE_URL, mobileApiClient } from "@/services/api-client";

export const MOBILE_SKILL_CATALOG_QUERY_KEY = ["mobile", "discovery", "skills"] as const;

export interface MobileSearchParams {
  q?: string;
  skill?: string;
  skills?: string[];
  location?: string;
  cursor?: string;
}

export interface MobileCandidateProfileBundle {
  profile: CandidatePublicProfileDTO;
  trust: CandidateTrustScoreDTO;
  trajectory: CandidateTrajectoryDTO;
}

export interface CandidateSkillMatchSummary {
  matchedCount: number;
  totalSelected: number;
  matchedSkills: string[];
  label: string;
}

export function computeCandidateSkillMatch(
  candidateSkills: string[],
  selectedSkills: string[]
): CandidateSkillMatchSummary {
  const cleanSelected = selectedSkills.map((s) => s.trim()).filter(Boolean);
  if (cleanSelected.length === 0) {
    return {
      matchedCount: candidateSkills.length,
      totalSelected: 0,
      matchedSkills: candidateSkills,
      label: `Khớp ${candidateSkills.length}/${candidateSkills.length} kỹ năng`,
    };
  }
  const lowerCandidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const matchedSkills = cleanSelected.filter((sel) => lowerCandidateSet.has(sel.toLowerCase()));
  return {
    matchedCount: matchedSkills.length,
    totalSelected: cleanSelected.length,
    matchedSkills,
    label: `Khớp ${matchedSkills.length}/${cleanSelected.length} kỹ năng`,
  };
}

export async function fetchMobileSkillCatalog(): Promise<SkillCatalogItemDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/catalogs/skills");
  if (Array.isArray(raw)) {
    return z.array(skillCatalogItemSchema).parse(raw);
  }
  const wrapped = raw as { items?: unknown };
  return z.array(skillCatalogItemSchema).parse(wrapped.items ?? []);
}

export async function createMobileCustomSkill(
  name: string,
  category = "Custom"
): Promise<SkillCatalogItemDTO> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Skill name is required");
  }
  const raw = await mobileApiClient.post<unknown>("/v1/catalogs/skills", {
    name: cleanName,
    category,
  });
  return skillCatalogItemSchema.parse(raw);
}

export async function searchMobileCandidates(
  params: MobileSearchParams = {}
): Promise<CandidateSearchResponseDTO> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.skill?.trim()) query.set("skill", params.skill.trim());
  if (params.skills && params.skills.length > 0) {
    const clean = params.skills.map((s) => s.trim()).filter(Boolean);
    if (clean.length > 0) {
      query.set("skills", clean.join(","));
      if (!params.skill?.trim()) {
        query.set("skill", clean[0]);
      }
    }
  }
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
    responses?: { status: number; data: unknown }[];
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

export function useMobileSkillCatalogQuery() {
  return useQuery({
    queryKey: MOBILE_SKILL_CATALOG_QUERY_KEY,
    queryFn: fetchMobileSkillCatalog,
    staleTime: 120_000,
  });
}

export function useCreateMobileCustomSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, category }: { name: string; category?: string }) =>
      createMobileCustomSkill(name, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_SKILL_CATALOG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["mobile", "discovery", "trending"] });
    },
  });
}

