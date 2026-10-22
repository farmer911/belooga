import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { fetchMobileCvDraft } from "@/hooks/use-mobile-career-tools";
import { mobileApiClient } from "@/services/api-client";

export const walletTransactionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  type: z.string().default("TOPUP"),
  amount_vnd: z.number().default(0),
  description: z.string().default(""),
  created_at: z.string().default(""),
});
export type WalletTransactionDTO = z.infer<typeof walletTransactionSchema>;

export const walletSummarySchema = z.object({
  available_balance_vnd: z.number().default(0),
  escrow_locked_vnd: z.number().default(0),
  total_topup_vnd: z.number().default(0),
  status: z.string().optional(),
  transactions: z.array(walletTransactionSchema).default([]),
});
export type WalletSummaryDTO = z.infer<typeof walletSummarySchema>;

export const escrowCompletionSchema = z.object({
  order_id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  status: z.string().default("COMPLETED"),
  escrow_released_vnd: z.number().default(0),
  sla_step: z.number().default(4),
});
export type EscrowCompletionDTO = z.infer<typeof escrowCompletionSchema>;

export const extractedCvFileSchema = z.object({
  filename: z.string().default("cv.pdf"),
  extracted_text: z.string().default(""),
  char_count: z.number().default(0),
});
export type ExtractedCvFileDTO = z.infer<typeof extractedCvFileSchema>;

export const salaryCrawlResultSchema = z.object({
  status: z.string().default("CRAWLED"),
  sources_synced: z.number().default(3),
  years_covered: z.array(z.string()).default(["2024", "2025", "2026"]),
  records_ingested: z.number().default(0),
});
export type SalaryCrawlResultDTO = z.infer<typeof salaryCrawlResultSchema>;

export const socialBlogPostSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  author_username: z.string().default("candidate"),
  title: z.string().default(""),
  content: z.string().default(""),
  likes_count: z.number().default(0),
  comments_count: z.number().default(0),
});
export type SocialBlogPostDTO = z.infer<typeof socialBlogPostSchema>;

export const careerJobItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  company_name: z.string().default(""),
  title: z.string().default(""),
  location: z.string().default(""),
  salary_range: z.string().default(""),
});
export type CareerJobItemDTO = z.infer<typeof careerJobItemSchema>;

export const MOBILE_WALLET_QUERY_KEY = ["mobile", "wallet", "summary"] as const;
export const MOBILE_SOCIAL_POSTS_QUERY_KEY = ["mobile", "community", "posts"] as const;
export const MOBILE_CAREER_JOBS_QUERY_KEY = ["mobile", "careers", "jobs"] as const;

export async function fetchMobileWalletSummary(): Promise<WalletSummaryDTO> {
  const raw = await mobileApiClient.get<unknown>("/v1/wallet/balance");
  return walletSummarySchema.parse(raw);
}

export async function topUpMobileWallet(amountVnd: number): Promise<WalletSummaryDTO> {
  if (amountVnd <= 0) throw new Error("Top-up amount must be positive");
  const raw = await mobileApiClient.post<unknown>("/v1/wallet/topup", {
    amount_vnd: amountVnd,
    payment_method: "MOMO_QR",
  });
  return walletSummarySchema.parse(raw);
}

export async function completeMobileExpertReviewEscrow(
  orderId: string
): Promise<EscrowCompletionDTO> {
  const raw = await mobileApiClient.post<unknown>(
    `/v1/expert-review/orders/${encodeURIComponent(orderId.trim())}/complete`,
    {}
  );
  return escrowCompletionSchema.parse(raw);
}

export async function extractMobileCvFile(input: {
  filename: string;
  contentBase64: string;
}): Promise<ExtractedCvFileDTO> {
  const raw = await mobileApiClient.post<unknown>("/v1/match/extract-cv-file", {
    filename: input.filename.trim(),
    content_base64: input.contentBase64.trim(),
  });
  return extractedCvFileSchema.parse(raw);
}

export async function loadMobileProfileCvText(username: string): Promise<string> {
  const draft = await fetchMobileCvDraft(username);
  return `${draft.summary} • Skills: ${draft.skills.join(", ")}`.trim();
}

export async function triggerMobileSalaryCrawl(role: string): Promise<SalaryCrawlResultDTO> {
  const raw = await mobileApiClient.post<unknown>("/v1/catalogs/salary-benchmark/crawl", {
    role: role.trim(),
    years: ["2024", "2025", "2026"],
  });
  return salaryCrawlResultSchema.parse(raw);
}

export async function fetchMobileSocialBlogPosts(): Promise<SocialBlogPostDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/blog/posts/");
  if (Array.isArray(raw)) return z.array(socialBlogPostSchema).parse(raw);
  return z.array(socialBlogPostSchema).parse((raw as { items?: unknown }).items ?? []);
}

export async function createMobileSocialBlogPost(input: {
  title: string;
  content: string;
}): Promise<SocialBlogPostDTO> {
  const raw = await mobileApiClient.post<unknown>("/v1/blog/posts/", {
    title: input.title.trim(),
    content: input.content.trim(),
  });
  return socialBlogPostSchema.parse(raw);
}

export async function likeMobileSocialBlogPost(
  postId: string
): Promise<{ id: string; likes_count: number }> {
  return mobileApiClient.post<{ id: string; likes_count: number }>(
    `/v1/blog/posts/${encodeURIComponent(postId.trim())}/like`,
    {}
  );
}

export async function fetchMobileCareerJobs(): Promise<CareerJobItemDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/career/jobs/");
  if (Array.isArray(raw)) return z.array(careerJobItemSchema).parse(raw);
  return z.array(careerJobItemSchema).parse((raw as { items?: unknown }).items ?? []);
}

export async function createMobileCareerJobPosting(input: {
  company_name: string;
  title: string;
  location: string;
  salary_range: string;
}): Promise<CareerJobItemDTO> {
  const raw = await mobileApiClient.post<unknown>("/v1/career/jobs/", input);
  return careerJobItemSchema.parse(raw);
}

export async function applyMobileCareerJob(
  jobId: string
): Promise<{ job_id: string; status: string }> {
  return mobileApiClient.post<{ job_id: string; status: string }>(
    `/v1/career/jobs/${encodeURIComponent(jobId.trim())}/apply/`,
    {}
  );
}

export function useMobileWalletSummaryQuery() {
  return useQuery({ queryKey: MOBILE_WALLET_QUERY_KEY, queryFn: fetchMobileWalletSummary, staleTime: 30_000 });
}

export function useTopUpMobileWalletMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: topUpMobileWallet,
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_WALLET_QUERY_KEY }),
  });
}

export function useCompleteMobileEscrowMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeMobileExpertReviewEscrow,
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_WALLET_QUERY_KEY }),
  });
}

export function useTriggerMobileSalaryCrawlMutation() {
  return useMutation({ mutationFn: triggerMobileSalaryCrawl });
}

export function useMobileSocialBlogPostsQuery() {
  return useQuery({ queryKey: MOBILE_SOCIAL_POSTS_QUERY_KEY, queryFn: fetchMobileSocialBlogPosts, staleTime: 30_000 });
}

export function useCreateMobileSocialBlogPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMobileSocialBlogPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_SOCIAL_POSTS_QUERY_KEY }),
  });
}

export function useMobileCareerJobsQuery() {
  return useQuery({ queryKey: MOBILE_CAREER_JOBS_QUERY_KEY, queryFn: fetchMobileCareerJobs, staleTime: 30_000 });
}

export function useCreateMobileCareerJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMobileCareerJobPosting,
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_CAREER_JOBS_QUERY_KEY }),
  });
}

export function useApplyMobileCareerJobMutation() {
  return useMutation({ mutationFn: applyMobileCareerJob });
}
