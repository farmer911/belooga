import { useMutation, useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { z } from "zod";
import { MOBILE_API_ENDPOINTS, mobileApiClient } from "@/services/api-client";

export const expertPackageSchema = z.object({
  id: z.string().min(1),
  name: z.string().default(""),
  price_usd: z.number().default(59),
  turnaround_hours: z.number().default(24),
});
export type ExpertPackageDTO = z.infer<typeof expertPackageSchema>;

export const momoQrResponseSchema = z.object({
  order_id: z.string().min(1),
  pay_url: z.string().url(),
  qr_code_url: z.string().default(""),
  amount: z.number().default(0),
  message: z.string().default(""),
});
export type MomoQrResponseDTO = z.infer<typeof momoQrResponseSchema>;

export const salaryBenchmarkSchema = z.object({
  role: z.string().default(""),
  location: z.string().default(""),
  year: z.string().default("2026"),
  p25: z.number().default(0),
  p50: z.number().default(0),
  p75: z.number().default(0),
  p90: z.number().default(0),
  currency: z.string().default("USD"),
});
export type SalaryBenchmarkDTO = z.infer<typeof salaryBenchmarkSchema>;

export const cvDraftSchema = z.object({
  template_id: z.string().default("executive-dark"),
  summary: z.string().default(""),
  skills: z.array(z.string()).default([]),
});
export type CvDraftDTO = z.infer<typeof cvDraftSchema>;

export const talentShortlistSchema = z.object({
  role: z.string().default(""),
  candidates: z
    .array(
      z.object({
        username: z.string(),
        match_score: z.number().default(0),
        headline: z.string().default(""),
      })
    )
    .default([]),
});
export type TalentShortlistDTO = z.infer<typeof talentShortlistSchema>;

export const executiveAnalyticsSchema = z.object({
  total_gmv_usd: z.number().default(0),
  momo_conversion_rate: z.number().default(0),
  search_p95_ms: z.number().default(0),
  active_candidates: z.number().default(0),
});
export type ExecutiveAnalyticsDTO = z.infer<typeof executiveAnalyticsSchema>;

export async function fetchMobileExpertPackages(): Promise<ExpertPackageDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/expert-review/packages/");
  if (Array.isArray(raw)) return z.array(expertPackageSchema).parse(raw);
  const wrapped = raw as { items?: unknown };
  return z.array(expertPackageSchema).parse(wrapped.items ?? []);
}

export async function createMobileMomoPaymentQr(input: {
  packageName: string;
  amountVnd: number;
}): Promise<MomoQrResponseDTO> {
  const raw = await mobileApiClient.post<unknown>(MOBILE_API_ENDPOINTS.PAYMENTS_MOMO_CREATE_QR, {
    package_type: "EXPERT_REVIEW",
    amount: input.amountVnd,
    order_info: input.packageName,
  });
  return momoQrResponseSchema.parse(raw);
}

export async function fetchMobileSalaryBenchmark(
  role: string,
  location = "Ho Chi Minh City",
  year = "2026"
): Promise<SalaryBenchmarkDTO> {
  const qs = new URLSearchParams({
    role: role.trim(),
    location: location.trim(),
    year: year.trim(),
  }).toString();
  const raw = await mobileApiClient.get<unknown>(`/v1/catalogs/salary-benchmark?${qs}`);
  return salaryBenchmarkSchema.parse(raw);
}

export async function fetchMobileCvDraft(username: string): Promise<CvDraftDTO> {
  const raw = await mobileApiClient.get<unknown>(
    `/v1/profile/${encodeURIComponent(username.trim())}/cv-draft/`
  );
  return cvDraftSchema.parse(raw);
}

export async function saveMobileCvDraft(
  username: string,
  draft: CvDraftDTO
): Promise<{ status: string; template_id: string }> {
  return mobileApiClient.put<{ status: string; template_id: string }>(
    `/v1/profile/${encodeURIComponent(username.trim())}/cv-draft/`,
    draft
  );
}

export async function generateMobileTalentShortlist(role: string): Promise<TalentShortlistDTO> {
  const raw = await mobileApiClient.post<unknown>("/v1/match/talent-shortlist", {
    job_title: role.trim(),
  });
  return talentShortlistSchema.parse(raw);
}

export async function fetchMobileExecutiveAnalytics(): Promise<ExecutiveAnalyticsDTO> {
  const raw = await mobileApiClient.get<unknown>("/v1/analytics/dashboard");
  return executiveAnalyticsSchema.parse(raw);
}

export function useMobileExpertPackagesQuery() {
  return useQuery({
    queryKey: ["mobile", "career", "expert-packages"] as const,
    queryFn: fetchMobileExpertPackages,
    staleTime: 120_000,
  });
}

export function useMobileMomoQrMutation() {
  return useMutation({
    mutationFn: async (input: { packageName: string; amountVnd: number }) => {
      const order = await createMobileMomoPaymentQr(input);
      await WebBrowser.openBrowserAsync(order.pay_url);
      return order;
    },
  });
}

export function useMobileSalaryBenchmarkQuery(
  role: string,
  location = "Ho Chi Minh City",
  year = "2026"
) {
  return useQuery({
    queryKey: ["mobile", "career", "salary", role, location, year] as const,
    queryFn: () => fetchMobileSalaryBenchmark(role, location, year),
    enabled: Boolean(role.trim()),
    staleTime: 120_000,
  });
}

export function useMobileExecutiveAnalyticsQuery() {
  return useQuery({
    queryKey: ["mobile", "career", "exec-bi"] as const,
    queryFn: fetchMobileExecutiveAnalytics,
    staleTime: 60_000,
  });
}
