import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { mobileApiClient } from '../services/api-client';

export type MobileApiClient = typeof mobileApiClient;

export const EXPERT_LEADERBOARD_CATEGORIES = [
  'all',
  'backend',
  'frontend',
  'ai',
  'devops',
  'management',
] as const;

export const expertLeaderboardCategorySchema = z.enum(EXPERT_LEADERBOARD_CATEGORIES);
export type ExpertLeaderboardCategory = z.infer<typeof expertLeaderboardCategorySchema>;

export const EXPERT_LEADERBOARD_SORT_MODES = [
  'rank',
  'ats_lift',
  'rating',
  'speed',
  'reviews_count',
] as const;

export const expertLeaderboardSortModeSchema = z.enum(EXPERT_LEADERBOARD_SORT_MODES);
export type ExpertLeaderboardSortMode = z.infer<typeof expertLeaderboardSortModeSchema>;

export const expertLeaderboardItemSchema = z.object({
  id: z.string().min(1),
  rank_position: z.number().int().positive().default(1),
  name: z.string().min(1),
  title: z.string().default('Senior Hiring Committee Reviewer'),
  category: z.string().default('backend'),
  badge_title: z.string().default('Grandmaster Mentor'),
  ranking_score: z.number().nonnegative().default(98.4),
  avg_ats_lift_points: z.number().nonnegative().default(28),
  rating: z.number().min(0).max(5).default(4.98),
  completed_reviews_count: z.number().int().nonnegative().default(186),
  avg_turnaround_hours: z.number().positive().default(11),
  interview_callback_rate: z.number().min(0).max(100).default(91),
  price_vnd: z.number().int().nonnegative().default(299000),
});
export type ExpertLeaderboardItem = z.infer<typeof expertLeaderboardItemSchema>;

export const expertLeaderboardResponseSchema = z.object({
  items: z.array(expertLeaderboardItemSchema).default([]),
  total: z.number().int().nonnegative().default(0),
});
export type ExpertLeaderboardResponse = z.infer<typeof expertLeaderboardResponseSchema>;

export interface ExpertLeaderboardParams {
  category?: ExpertLeaderboardCategory;
  sort_by?: ExpertLeaderboardSortMode;
}

export const bookExpertOrderInputSchema = z.object({
  expert_id: z.string().trim().min(1),
  package_id: z.string().trim().default('pkg_senior'),
  target_role: z.string().trim().default('Staff Backend Engineer'),
});
export type BookExpertOrderInput = z.infer<typeof bookExpertOrderInputSchema>;

export const bookExpertOrderResponseSchema = z.object({
  order_id: z.string().min(1),
  expert_id: z.string().min(1),
  status: z.string().default('ESCROW_LOCKED'),
  amount_vnd: z.number().int().nonnegative().default(299000),
});

export const expertOrderFeedbackInputSchema = z.object({
  rating: z.number().int().min(1).max(5).default(5),
  ats_lift_achieved: z.number().int().nonnegative().default(25),
  comment: z.string().trim().min(1),
});
export type ExpertOrderFeedbackInput = z.infer<typeof expertOrderFeedbackInputSchema>;

export const expertOrderFeedbackResponseSchema = z.object({
  order_id: z.string().min(1),
  expert_id: z.string().min(1),
  new_rating: z.number().min(0).max(5).default(4.99),
  new_ranking_score: z.number().nonnegative().default(98.7),
});

export const applyExpertInputSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  role_title: z.string().trim().min(2),
  company_name: z.string().trim().min(1),
  years_experience: z.number().int().min(1).max(40).default(5),
  category: z.string().default('backend'),
  specialties: z.array(z.string()).default([]),
  turnaround_hours: z.number().int().positive().default(24),
  hourly_rate_vnd: z.number().int().nonnegative().default(299000),
  linkedin_url: z.string().default(''),
  bio: z.string().default(''),
});
export type ApplyExpertInput = z.infer<typeof applyExpertInputSchema>;

export const expertProfileMeSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(1),
  role_title: z.string().default('Senior Hiring Committee Reviewer'),
  company_name: z.string().default('Belooga'),
  years_experience: z.number().int().nonnegative().default(8),
  category: z.string().default('backend'),
  specialties: z.array(z.string()).default([]),
  turnaround_hours: z.number().int().positive().default(24),
  hourly_rate_vnd: z.number().int().nonnegative().default(299000),
  status: z.string().default('ACTIVE'),
  ranking_score: z.number().nonnegative().default(96.0),
});
export type ExpertProfileMe = z.infer<typeof expertProfileMeSchema>;

export const expertLeaderboardKeys = {
  all: ['mobile-expert-leaderboard'] as const,
  list: (params: ExpertLeaderboardParams) => [...expertLeaderboardKeys.all, params] as const,
  me: () => [...expertLeaderboardKeys.all, 'me'] as const,
};

export async function fetchMobileExpertLeaderboard(
  params: ExpertLeaderboardParams = {},
  client: MobileApiClient = mobileApiClient
): Promise<ExpertLeaderboardResponse> {
  const qs = new URLSearchParams();
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.sort_by) qs.set('sort_by', params.sort_by);

  const queryString = qs.toString();
  const path = queryString
    ? `/v1/expert-review/leaderboard?${queryString}`
    : '/v1/expert-review/leaderboard';
  const raw = await client.get<unknown>(path);
  if (Array.isArray(raw)) {
    const items = z.array(expertLeaderboardItemSchema).parse(raw);
    return { items, total: items.length };
  }
  return expertLeaderboardResponseSchema.parse(raw);
}

export async function bookMobileExpertReviewOrder(
  input: BookExpertOrderInput,
  client: MobileApiClient = mobileApiClient
): Promise<z.infer<typeof bookExpertOrderResponseSchema>> {
  const validated = bookExpertOrderInputSchema.parse(input);
  const raw = await client.post<unknown>('/v1/expert-review/orders/', validated);
  return bookExpertOrderResponseSchema.parse(raw);
}

export async function submitMobileExpertOrderFeedback(
  orderId: string,
  input: ExpertOrderFeedbackInput,
  client: MobileApiClient = mobileApiClient
): Promise<z.infer<typeof expertOrderFeedbackResponseSchema>> {
  const validated = expertOrderFeedbackInputSchema.parse(input);
  const raw = await client.post<unknown>(
    `/v1/expert-review/orders/${encodeURIComponent(orderId)}/feedback/`,
    validated
  );
  return expertOrderFeedbackResponseSchema.parse(raw);
}

export function useMobileExpertLeaderboardQuery(
  params: ExpertLeaderboardParams = {},
  client: MobileApiClient = mobileApiClient
) {
  return useQuery({
    queryKey: expertLeaderboardKeys.list(params),
    queryFn: () => fetchMobileExpertLeaderboard(params, client),
  });
}

export function useBookMobileExpertOrderMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookExpertOrderInput) => bookMobileExpertReviewOrder(input, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expertLeaderboardKeys.all });
    },
  });
}

export async function applyMobileExpertReviewer(
  input: ApplyExpertInput,
  client: MobileApiClient = mobileApiClient
): Promise<ExpertProfileMe> {
  const validated = applyExpertInputSchema.parse(input);
  const raw = await client.post<unknown>('/v1/expert-review/apply', validated);
  return expertProfileMeSchema.parse(raw);
}

export async function fetchMobileMyExpertProfile(
  client: MobileApiClient = mobileApiClient
): Promise<ExpertProfileMe | null> {
  const raw = await client.get<unknown>('/v1/expert-review/me');
  if (!raw) return null;
  return expertProfileMeSchema.parse(raw);
}

export function useMyExpertProfileQuery(client: MobileApiClient = mobileApiClient) {
  return useQuery({
    queryKey: expertLeaderboardKeys.me(),
    queryFn: () => fetchMobileMyExpertProfile(client),
  });
}

export function useApplyExpertReviewerMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplyExpertInput) => applyMobileExpertReviewer(input, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expertLeaderboardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['mobile-expert-packages'] });
    },
  });
}
