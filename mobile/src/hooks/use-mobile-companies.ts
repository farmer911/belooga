import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { mobileApiClient } from '../services/api-client';

export type MobileApiClient = typeof mobileApiClient;

export const COMPANY_INDUSTRIES = [
  'All',
  'Fintech',
  'AI / Cloud',
  'E-Commerce',
  'Enterprise SaaS',
  'EdTech',
] as const;

export const COMPANY_LOCATIONS = [
  'All',
  'Ho Chi Minh',
  'Ha Noi',
  'Da Nang',
  'Remote',
] as const;

export const companySummarySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  industry: z.string().default('AI / Cloud'),
  location: z.string().default('Ho Chi Minh'),
  company_size: z.string().default('50-200'),
  avg_rating: z.number().min(0).max(5).default(4.8),
  review_count: z.number().int().nonnegative().default(12),
  avg_salary_usd: z.number().nonnegative().default(2800),
  open_jobs_count: z.number().int().nonnegative().default(2),
  tech_stack: z.array(z.string()).default([]),
  is_verified: z.boolean().default(true),
});
export type CompanySummary = z.infer<typeof companySummarySchema>;

export const companyJobItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  location: z.string().default('Ho Chi Minh / Remote'),
  salary_range: z.string().default('$2,500 - $3,800/mo'),
});

export const companyReviewItemSchema = z.object({
  id: z.string().min(1),
  author_username: z.string().min(1),
  rating: z.number().int().min(1).max(5).default(5),
  title: z.string().min(1),
  content: z.string().min(1),
});
export type CompanyReviewItem = z.infer<typeof companyReviewItemSchema>;

export const companyAlumniItemSchema = z.object({
  username: z.string().min(1),
  full_name: z.string().min(1),
  headline: z.string().default(''),
});

export const companyProfileDetailSchema = companySummarySchema.extend({
  website_url: z.string().default(''),
  description: z.string().default('Verified technology employer on Belooga.'),
  benefits: z.array(z.string()).default([]),
  open_jobs: z.array(companyJobItemSchema).default([]),
  reviews: z.array(companyReviewItemSchema).default([]),
  alumni: z.array(companyAlumniItemSchema).default([]),
});
export type CompanyProfileDetail = z.infer<typeof companyProfileDetailSchema>;

export const companySearchResponseSchema = z.object({
  items: z.array(companySummarySchema).default([]),
  total: z.number().int().nonnegative().default(0),
});
export type CompanySearchResponse = z.infer<typeof companySearchResponseSchema>;

export interface CompanySearchParams {
  q?: string;
  industry?: string;
  location?: string;
  tech_stack?: string[];
  hiring_only?: boolean;
  min_rating?: number;
  sort_by?: 'rating' | 'open_jobs' | 'salary' | 'name';
}

export const createCompanyInputSchema = z.object({
  name: z.string().trim().min(1),
  industry: z.string().trim().min(1),
  location: z.string().trim().min(1),
  company_size: z.string().default('50-200'),
  description: z.string().default(''),
  tech_stack: z.array(z.string()).default([]),
});
export type CreateCompanyInput = z.infer<typeof createCompanyInputSchema>;

export const submitCompanyReviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5).default(5),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
});
export type SubmitCompanyReviewInput = z.infer<typeof submitCompanyReviewInputSchema>;

export const companiesKeys = {
  all: ['mobile-companies'] as const,
  search: (params: CompanySearchParams) => [...companiesKeys.all, 'search', params] as const,
  detail: (slug: string) => [...companiesKeys.all, 'detail', slug] as const,
};

export async function searchMobileCompanies(
  params: CompanySearchParams = {},
  client: MobileApiClient = mobileApiClient
): Promise<CompanySearchResponse> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.industry && params.industry !== 'All') qs.set('industry', params.industry);
  if (params.location && params.location !== 'All') qs.set('location', params.location);
  if (params.tech_stack && params.tech_stack.length > 0) {
    qs.set('tech_stack', params.tech_stack.join(','));
  }
  if (params.hiring_only) qs.set('hiring_only', 'true');
  if (typeof params.min_rating === 'number') qs.set('min_rating', String(params.min_rating));
  if (params.sort_by) qs.set('sort_by', params.sort_by);

  const queryString = qs.toString();
  const path = queryString ? `/v1/companies/search?${queryString}` : '/v1/companies/search';
  const raw = await client.get<unknown>(path);
  if (Array.isArray(raw)) {
    const items = z.array(companySummarySchema).parse(raw);
    return { items, total: items.length };
  }
  return companySearchResponseSchema.parse(raw);
}

export async function fetchMobileCompanyProfile(
  slug: string,
  client: MobileApiClient = mobileApiClient
): Promise<CompanyProfileDetail> {
  const raw = await client.get<unknown>(`/v1/companies/${encodeURIComponent(slug)}`);
  return companyProfileDetailSchema.parse(raw);
}

export async function createMobileCompanyProfile(
  input: CreateCompanyInput,
  client: MobileApiClient = mobileApiClient
): Promise<CompanySummary> {
  const validated = createCompanyInputSchema.parse(input);
  const raw = await client.post<unknown>('/v1/companies/', validated);
  return companySummarySchema.parse(raw);
}

export async function submitMobileCompanyReview(
  slug: string,
  input: SubmitCompanyReviewInput,
  client: MobileApiClient = mobileApiClient
): Promise<CompanyReviewItem> {
  const validated = submitCompanyReviewInputSchema.parse(input);
  const raw = await client.post<unknown>(
    `/v1/companies/${encodeURIComponent(slug)}/reviews`,
    validated
  );
  return companyReviewItemSchema.parse(raw);
}

export function useMobileCompaniesSearchQuery(
  params: CompanySearchParams,
  client: MobileApiClient = mobileApiClient
) {
  return useQuery({
    queryKey: companiesKeys.search(params),
    queryFn: () => searchMobileCompanies(params, client),
  });
}

export function useMobileCompanyProfileQuery(
  slug: string,
  client: MobileApiClient = mobileApiClient
) {
  return useQuery({
    queryKey: companiesKeys.detail(slug),
    queryFn: () => fetchMobileCompanyProfile(slug, client),
    enabled: Boolean(slug),
  });
}

export function useSubmitMobileCompanyReviewMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: SubmitCompanyReviewInput }) =>
      submitMobileCompanyReview(slug, input, client),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companiesKeys.detail(variables.slug) });
      queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
}
