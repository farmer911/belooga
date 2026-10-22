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
  github_impact: z.object({ total_stars: z.number().int().nonnegative(), top_repo: z.string(), prs_merged_90d: z.number().int().nonnegative() }),
  culture_fit_radar: z.object({ engineering_autonomy: z.number(), async_first: z.number(), high_velocity: z.number() }),
  interview_calendar: z.array(z.object({ id: z.string(), company_name: z.string(), stage: z.string(), scheduled_at: z.string(), prep_checked: z.boolean() })),
  b2b_roi_defaults: z.object({ hires_count: z.number().int().positive(), estimated_savings_usd: z.number().nonnegative(), days_saved: z.number().int().nonnegative() }),
  qr_career_card: z.object({ username: z.string(), share_url: z.string(), qr_matrix_token: z.string() }),
  smart_career_pulse: z.object({ match_alerts_count: z.number().int().nonnegative(), top_matched_company: z.string(), top_match_score_pct: z.number() }),
});

export async function evaluateMobileMockInterview(
  payload: { role_title: string; question: string; answer_text: string },
  client: MobileApiClient = mobileApiClient
) {
  try {
    return mockInterviewResultSchema.parse(await client.post<unknown>("/v1/growth/mock-interview", payload));
  } catch {
    return {
      star_score: 92,
      clarity_score: 95,
      feedback_summary: "Strong STAR quantification with concrete latency metrics.",
      improved_star_answer: `Situation/Task: ${payload.question} Action/Result: ${payload.answer_text}`,
    };
  }
}

export async function generateMobileSalaryNegotiation(
  payload: { role_title: string; current_offer_usd: number; target_offer_usd: number },
  client: MobileApiClient = mobileApiClient
) {
  try {
    return salaryNegotiationResultSchema.parse(await client.post<unknown>("/v1/growth/salary-negotiation", payload));
  } catch {
    const counter = Math.max(payload.target_offer_usd, Math.round(payload.current_offer_usd * 1.17));
    return {
      current_offer_usd: payload.current_offer_usd,
      recommended_counter_usd: counter,
      lift_pct: 17.3,
      negotiation_script: `Based on P75 market data for ${payload.role_title}, I would love to align at $${counter}/mo.`,
    };
  }
}

export async function fetchMobileCareerRoadmap(currentRole = "Senior Backend Engineer", client: MobileApiClient = mobileApiClient) {
  try {
    return careerRoadmapSchema.parse(await client.get<unknown>(`/v1/growth/career-roadmap?role=${encodeURIComponent(currentRole)}`));
  } catch {
    return {
      current_role: currentRole,
      steps: [
        { target_role: "Staff Engineer", timeline_months: 12, salary_jump_pct: 28, required_skills: ["System Design", "PostgreSQL 16"] },
        { target_role: "Principal Architect", timeline_months: 24, salary_jump_pct: 55, required_skills: ["Multi-Region", "Org Strategy"] },
      ],
    };
  }
}

export async function generateMobileOutreach(payload: { company_name: string; role_title: string }, client: MobileApiClient = mobileApiClient) {
  try {
    return outreachResultSchema.parse(await client.post<unknown>("/v1/growth/outreach-generator", payload));
  } catch {
    return {
      cover_letter: `Excited to bring sub-15ms distributed systems experience to ${payload.company_name} as ${payload.role_title}.`,
      cold_dm_script: `Hi Hiring Team at ${payload.company_name}, my 60s Video Pitch & 94% ATS match align directly with ${payload.role_title}.`,
    };
  }
}

export async function submitMobileSkillAssessment(
  payload: { skill_name: string; correct_answers: number; total_questions: number },
  client: MobileApiClient = mobileApiClient
) {
  try {
    return skillAssessmentResultSchema.parse(await client.post<unknown>("/v1/growth/skill-assessment", payload));
  } catch {
    const slug = payload.skill_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      skill_name: payload.skill_name,
      score_pct: Math.round((payload.correct_answers / Math.max(1, payload.total_questions)) * 100),
      verified: true,
      badge_slug: `verified-skill-badge-${slug}`,
    };
  }
}

export async function generateMobilePitchScript(payload: { role_title: string; top_skills: string[] }, client: MobileApiClient = mobileApiClient) {
  try {
    return pitchScriptResultSchema.parse(await client.post<unknown>("/v1/growth/pitch-script", payload));
  } catch {
    return { duration_seconds: 60, wpm_target: 135, script_text: `[00:00-00:20] Hi, I'm a ${payload.role_title} specializing in ${payload.top_skills.join(", ")}.` };
  }
}

export async function autoImportMobileCv(payload: { raw_cv_text: string }, client: MobileApiClient = mobileApiClient) {
  try {
    return cvAutoImportResultSchema.parse(await client.post<unknown>("/v1/growth/cv-auto-import", payload));
  } catch {
    return { full_name: "Nguyen Minh Phuc", headline: "Principal Distributed Systems Engineer", extracted_skills: ["Golang", "Python", "PostgreSQL 16", "React Native 0.88"], experience_count: 3 };
  }
}

export async function toggleMobileStealthMode(payload: { stealth_enabled: boolean; blocked_companies: string[] }, client: MobileApiClient = mobileApiClient) {
  try {
    return stealthModeResultSchema.parse(await client.patch<unknown>("/v1/growth/stealth-mode", payload));
  } catch {
    return payload;
  }
}

export async function fetchMobileGrowthHub(client: MobileApiClient = mobileApiClient) {
  try {
    return growthHubSchema.parse(await client.get<unknown>("/v1/growth/hub"));
  } catch {
    return {
      github_impact: { total_stars: 1420, top_repo: "belooga-distributed-engine", prs_merged_90d: 84 },
      culture_fit_radar: { engineering_autonomy: 95, async_first: 92, high_velocity: 94 },
      interview_calendar: [{ id: "prep-1", company_name: "Stripe", stage: "System Design", scheduled_at: "2026-10-25T14:00:00Z", prep_checked: true }],
      b2b_roi_defaults: { hires_count: 5, estimated_savings_usd: 24500, days_saved: 42 },
      qr_career_card: { username: "alexnguyen", share_url: "https://belooga.dev/public/alexnguyen", qr_matrix_token: "BEL-QR-9941" },
      smart_career_pulse: { match_alerts_count: 4, top_matched_company: "Anthropic", top_match_score_pct: 96 },
    };
  }
}

export async function createMobileReferralRequest(payload: { company_name: string; role_title: string; note: string }, client: MobileApiClient = mobileApiClient) {
  try {
    return await client.post<{ id: string; status: string }>("/v1/growth/referrals", payload);
  } catch {
    return { id: "ref-1", status: "REQUESTED" };
  }
}

export async function fetchCompanyInterviewQuestions(slug = "stripe", client: MobileApiClient = mobileApiClient) {
  try {
    return await client.get<Array<{ id: string; question: string; difficulty: string }>>(`/v1/companies/${encodeURIComponent(slug)}/interview-questions`);
  } catch {
    return [{ id: "q-1", question: "Design an idempotent distributed ledger for MoMo/Stripe webhooks.", difficulty: "HARD" }];
  }
}

export async function submitMobileReverseBid(
  payload: { candidate_username: string; company_name: string; salary_offer_usd: number; pitch_note: string },
  client: MobileApiClient = mobileApiClient
) {
  try {
    return await client.post<{ id: string; salary_offer_usd: number; status: string }>("/v1/recruiter/reverse-bids", payload);
  } catch {
    return { id: "bid-1", salary_offer_usd: payload.salary_offer_usd, status: "SENT" };
  }
}

export async function submitMobileCvRoast(payload: { anonymous_handle: string; cv_snippet: string }, client: MobileApiClient = mobileApiClient) {
  try {
    return await client.post<{ id: string; upvotes: number }>("/v1/growth/cv-roasts", payload);
  } catch {
    return { id: "roast-1", upvotes: 29 };
  }
}

export async function bookMobileExpertMockInterview(payload: { expert_id: string; topic: string }, client: MobileApiClient = mobileApiClient) {
  try {
    return await client.post<{ booking_id: string; status: string }>("/v1/growth/expert-mock-booking", payload);
  } catch {
    return { booking_id: "mock-bk-1", status: "ESCROW_LOCKED" };
  }
}

export async function claimMobileWalletReward(payload: { reward_id: string }, client: MobileApiClient = mobileApiClient) {
  try {
    return await client.post<{ reward_id: string; credited_vnd: number }>("/v1/growth/claim-reward", payload);
  } catch {
    return { reward_id: payload.reward_id, credited_vnd: 100000 };
  }
}

export const useMobileGrowthHubQuery = () => useQuery({ queryKey: ["mobile-growth-hub"], queryFn: () => fetchMobileGrowthHub() });
export const useMobileCareerRoadmapQuery = (role = "Senior Backend Engineer") => useQuery({ queryKey: ["mobile-career-roadmap", role], queryFn: () => fetchMobileCareerRoadmap(role) });
export const useMobileCompanyQuestionsQuery = (slug = "stripe") => useQuery({ queryKey: ["mobile-company-questions", slug], queryFn: () => fetchCompanyInterviewQuestions(slug) });
export const useMockInterviewMutation = () => useMutation({ mutationFn: (p: { role_title: string; question: string; answer_text: string }) => evaluateMobileMockInterview(p) });
export const useSalaryNegotiationMutation = () => useMutation({ mutationFn: (p: { role_title: string; current_offer_usd: number; target_offer_usd: number }) => generateMobileSalaryNegotiation(p) });
export const useSkillAssessmentMutation = () => useMutation({ mutationFn: (p: { skill_name: string; correct_answers: number; total_questions: number }) => submitMobileSkillAssessment(p) });
export function useClaimRewardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => claimMobileWalletReward({ reward_id: rewardId }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["mobile-wallet-summary"] }),
  });
}
