import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { mobileApiClient } from '../services/api-client';

export type MobileApiClient = typeof mobileApiClient;

export const TOP_CANDIDATE_CATEGORIES = [
  'all',
  'backend',
  'frontend',
  'ai',
  'mobile',
  'devops',
] as const;

export const topCandidateCategorySchema = z.enum(TOP_CANDIDATE_CATEGORIES);
export type TopCandidateCategory = z.infer<typeof topCandidateCategorySchema>;

export const TOP_CANDIDATE_BADGE_TIERS = ['TOP_1_PCT', 'TOP_5_PCT', 'RISING_STAR'] as const;
export const topCandidateBadgeTierSchema = z.enum(TOP_CANDIDATE_BADGE_TIERS);
export type TopCandidateBadgeTier = z.infer<typeof topCandidateBadgeTierSchema>;

export const topCandidateItemSchema = z.object({
  rank: z.number().int().positive().default(1),
  username: z.string().min(1),
  full_name: z.string().min(1),
  headline: z.string().default(''),
  location: z.string().default('Ho Chi Minh City'),
  potential_score: z.number().min(0).max(100).default(95),
  badge_tier: topCandidateBadgeTierSchema.default('TOP_1_PCT'),
  highlight_reason: z.string().default('Verified 60s Video Pitch & High ATS Match'),
  skills: z.array(z.string()).default([]),
  has_video_pitch: z.boolean().default(true),
  actively_looking: z.boolean().default(true),
});
export type TopCandidateItem = z.infer<typeof topCandidateItemSchema>;

export const topCandidatesResponseSchema = z.object({
  items: z.array(topCandidateItemSchema).default([]),
  total: z.number().int().nonnegative().default(0),
});
export type TopCandidatesResponse = z.infer<typeof topCandidatesResponseSchema>;

export interface TopCandidatesQueryParams {
  category?: TopCandidateCategory;
  actively_looking_only?: boolean;
  limit?: number;
}

export function formatTopCandidateTierLabel(tier: TopCandidateBadgeTier): string {
  if (tier === 'TOP_1_PCT') return 'Top 1% Talent';
  if (tier === 'TOP_5_PCT') return 'Top 5% Talent';
  return 'Rising Star';
}

export const topCandidatesKeys = {
  all: ['mobile-top-candidates'] as const,
  list: (params: TopCandidatesQueryParams) => [...topCandidatesKeys.all, params] as const,
};

export async function fetchMobileTopCandidates(
  params: TopCandidatesQueryParams = {},
  client: MobileApiClient = mobileApiClient
): Promise<TopCandidatesResponse> {
  const qs = new URLSearchParams();
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.actively_looking_only) qs.set('actively_looking_only', 'true');
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));

  const queryString = qs.toString();
  const path = queryString
    ? `/v1/search/top-candidates?${queryString}`
    : '/v1/search/top-candidates';
  const raw = await client.get<unknown>(path);
  if (Array.isArray(raw)) {
    const items = z.array(topCandidateItemSchema).parse(raw);
    return { items, total: items.length };
  }
  return topCandidatesResponseSchema.parse(raw);
}

export function useMobileTopCandidatesQuery(
  params: TopCandidatesQueryParams = {},
  client: MobileApiClient = mobileApiClient
) {
  return useQuery({
    queryKey: topCandidatesKeys.list(params),
    queryFn: () => fetchMobileTopCandidates(params, client),
  });
}
