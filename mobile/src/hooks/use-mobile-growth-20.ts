import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { mobileApiClient } from "../services/api-client";

export type MobileApiClient = typeof mobileApiClient;

export const mockInterviewResultSchema = z.object({
  star_score: z.number().nonnegative(),
  clarity_score: z.number().nonnegative(),
  feedback_summary: z.string(),
  improved_star_answer: z.string(),
});

export const salaryNegotiationResultSchema = z.object({
  current_offer_usd: z.number().nonnegative(),
  recommended_counter_usd: z.number().nonnegative(),
  lift_pct: z.number(),
  negotiation_script: z.string(),
});

export const careerRoadmapSchema = z.object({
  current_role: z.string(),
  steps: z.array(
    z.object({
      target_role: z.string(),
      timeline_months: z.number().int().positive(),
      salary_jump_pct: z.number(),
      required_skills: z.array(z.string()),
    })
  ),
});

export const outreachResultSchema = z.object({
  cover_letter: z.string(),
  cold_dm_script: z.string(),
});

export const skillAssessmentResultSchema = z.object({
  skill_name: z.string(),
  score_pct: z.number(),
  verified: z.boolean(),
  badge_slug: z.string(),
});

export const pitchScriptResultSchema = z.object({
  duration_seconds: z.number().int().positive(),
  wpm_target: z.number().int().positive(),
  script_text: z.string(),
});

export const cvAutoImportResultSchema = z.object({
  full_name: z.string(),
  headline: z.string(),
  extracted_skills: z.array(z.string()),
  experience_count: z.number().int().nonnegative(),
});

export const stealthModeResultSchema = z.object({
  stealth_enabled: z.boolean(),
  blocked_companies: z.array(z.string()),
});

export const growthHubSchema = z.object({
  github_impact: z.object({
    total_stars: z.number().int().nonnegative(),
    top_repo: z.string(),
    prs_merged_90d: z.number().int().nonnegative(),
  }),
  culture_fit_radar: z.object({
    engineering_autonomy: z.number(),
    async_first: z.number(),
    high_velocity: z.number(),
  }),
  interview_calendar: z.array(
    z.object({
      id: z.string(),
      company_name: z.string(),
      stage: z.string(),
      scheduled_at: z.string(),
      prep_checked: z.boolean(),
    })
  ),
  b2b_roi_defaults: z.object({
    hires_count: z.number().int().positive(),
    estimated_savings_usd: z.number().nonnegative(),
    days_saved: z.number().int().nonnegative(),
  }),
  qr_career_card: z.object({
    username: z.string(),
    share_url: z.string(),
    qr_matrix_token: z.string(),
  }),
  smart_career_pulse: z.object({
    match_alerts_count: z.number().int().nonnegative(),
    top_matched_company: z.string(),
    top_match_score_pct: z.number(),
  }),
});

export async function evaluateMobileMockInterview(
  payload: { role_title: string; question: string; answer_text: string },
  client: MobileApiClient = mobileApiClient
) {
  return mockInterviewResultSchema.parse(await client.post<unknown>("/v1/growth/mock-interview", payload));
}

export async function generateMobileSalaryNegotiation(
  payload: { role_title: string; current_offer_usd: number; target_offer_usd: number },
  client: MobileApiClient = mobileApiClient
) {
  return salaryNegotiationResultSchema.parse(await client.post<unknown>("/v1/growth/salary-negotiation", payload));
}

export async function fetchMobileCareerRoadmap(
  currentRole = "Senior Backend Engineer",
  client: MobileApiClient = mobileApiClient
) {
  return careerRoadmapSchema.parse(
    await client.get<unknown>(`/v1/growth/career-roadmap?role=${encodeURIComponent(currentRole)}`)
  );
}

export async function generateMobileOutreach(
  payload: { company_name: string; role_title: string },
  client: MobileApiClient = mobileApiClient
) {
  return outreachResultSchema.parse(await client.post<unknown>("/v1/growth/outreach-generator", payload));
}

export async function submitMobileSkillAssessment(
  payload: { skill_name: string; correct_answers: number; total_questions: number },
  client: MobileApiClient = mobileApiClient
) {
  return skillAssessmentResultSchema.parse(await client.post<unknown>("/v1/growth/skill-assessment", payload));
}

export async function generateMobilePitchScript(
  payload: { role_title: string; top_skills: string[] },
  client: MobileApiClient = mobileApiClient
) {
  return pitchScriptResultSchema.parse(await client.post<unknown>("/v1/growth/pitch-script", payload));
}

export async function autoImportMobileCv(
  payload: { raw_cv_text: string },
  client: MobileApiClient = mobileApiClient
) {
  return cvAutoImportResultSchema.parse(await client.post<unknown>("/v1/growth/cv-auto-import", payload));
}

export async function toggleMobileStealthMode(
  payload: { stealth_enabled: boolean; blocked_companies: string[] },
  client: MobileApiClient = mobileApiClient
) {
  return stealthModeResultSchema.parse(await client.patch<unknown>("/v1/growth/stealth-mode", payload));
}

export async function fetchMobileGrowthHub(client: MobileApiClient = mobileApiClient) {
  return growthHubSchema.parse(await client.get<unknown>("/v1/growth/hub"));
}

export async function createMobileReferralRequest(
  payload: { company_name: string; role_title: string; note: string },
  client: MobileApiClient = mobileApiClient
) {
  return client.post<{ id: string; status: string }>("/v1/growth/referrals", payload);
}

export async function fetchCompanyInterviewQuestions(slug = "stripe", client: MobileApiClient = mobileApiClient) {
  return client.get<{ id: string; question: string; difficulty: string }[]>(
    `/v1/companies/${encodeURIComponent(slug)}/interview-questions`
  );
}

export async function submitMobileReverseBid(
  payload: { candidate_username: string; company_name: string; salary_offer_usd: number; pitch_note: string },
  client: MobileApiClient = mobileApiClient
) {
  return client.post<{ id: string; salary_offer_usd: number; status: string }>("/v1/recruiter/reverse-bids", payload);
}

export async function submitMobileCvRoast(
  payload: { anonymous_handle: string; cv_snippet: string },
  client: MobileApiClient = mobileApiClient
) {
  return client.post<{ id: string; upvotes: number }>("/v1/growth/cv-roasts", payload);
}

export async function bookMobileExpertMockInterview(
  payload: { expert_id: string; topic: string },
  client: MobileApiClient = mobileApiClient
) {
  return client.post<{ booking_id: string; status: string }>("/v1/growth/expert-mock-booking", payload);
}

export async function claimMobileWalletReward(
  payload: { reward_id: string },
  client: MobileApiClient = mobileApiClient
) {
  return client.post<{ reward_id: string; credited_vnd: number }>("/v1/growth/claim-reward", payload);
}

export const useMobileGrowthHubQuery = () => useQuery({ queryKey: ["mobile-growth-hub"], queryFn: () => fetchMobileGrowthHub() });
export const useMobileCareerRoadmapQuery = (role = "Senior Backend Engineer") =>
  useQuery({ queryKey: ["mobile-career-roadmap", role], queryFn: () => fetchMobileCareerRoadmap(role) });
export const useMobileCompanyQuestionsQuery = (slug = "stripe") =>
  useQuery({ queryKey: ["mobile-company-questions", slug], queryFn: () => fetchCompanyInterviewQuestions(slug) });
export const useMockInterviewMutation = () =>
  useMutation({ mutationFn: (p: { role_title: string; question: string; answer_text: string }) => evaluateMobileMockInterview(p) });
export const useSalaryNegotiationMutation = () =>
  useMutation({ mutationFn: (p: { role_title: string; current_offer_usd: number; target_offer_usd: number }) => generateMobileSalaryNegotiation(p) });
export const useSkillAssessmentMutation = () =>
  useMutation({ mutationFn: (p: { skill_name: string; correct_answers: number; total_questions: number }) => submitMobileSkillAssessment(p) });
export function useClaimRewardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => claimMobileWalletReward({ reward_id: rewardId }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["mobile-wallet-summary"] }),
  });
}
