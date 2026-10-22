import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { mobileApiClient } from '../services/api-client';

export type MobileApiClient = typeof mobileApiClient;

export const RECRUITER_PIPELINE_STAGES = [
  'SHORTLISTED',
  'PITCH_REVIEWED',
  'INTERVIEW_INVITED',
  'OFFER_SENT',
  'HIRED',
] as const;

export const recruiterPipelineStageSchema = z.enum(RECRUITER_PIPELINE_STAGES);
export type RecruiterPipelineStage = z.infer<typeof recruiterPipelineStageSchema>;

export const recruiterPipelineItemSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  full_name: z.string().min(1),
  headline: z.string().default(''),
  job_title: z.string().min(1),
  stage: recruiterPipelineStageSchema.default('SHORTLISTED'),
  ats_score: z.number().min(0).max(100).default(85),
  recruiter_rating: z.number().int().min(1).max(5).default(5),
  evaluation_notes: z.string().default(''),
  video_pitch_url: z.string().nullable().default(null),
  contact_unlocked: z.boolean().default(false),
  updated_at: z.string().optional(),
});
export type RecruiterPipelineItem = z.infer<typeof recruiterPipelineItemSchema>;

export const recruiterPipelineResponseSchema = z.object({
  items: z.array(recruiterPipelineItemSchema).default([]),
  total: z.number().int().nonnegative().default(0),
});
export type RecruiterPipelineResponse = z.infer<typeof recruiterPipelineResponseSchema>;

export const addRecruiterCandidateInputSchema = z.object({
  username: z.string().trim().min(1),
  job_title: z.string().trim().min(1),
  stage: recruiterPipelineStageSchema.optional(),
  recruiter_rating: z.number().int().min(1).max(5).optional(),
  evaluation_notes: z.string().optional(),
});
export type AddRecruiterCandidateInput = z.infer<typeof addRecruiterCandidateInputSchema>;

export const updateRecruiterPipelineInputSchema = z.object({
  stage: recruiterPipelineStageSchema.optional(),
  recruiter_rating: z.number().int().min(1).max(5).optional(),
  evaluation_notes: z.string().optional(),
});
export type UpdateRecruiterPipelineInput = z.infer<typeof updateRecruiterPipelineInputSchema>;

export const recruiterCompareInputSchema = z.object({
  usernames: z.array(z.string().trim().min(1)).min(2).max(3),
  jd_text: z.string().optional(),
});
export type RecruiterCompareInput = z.infer<typeof recruiterCompareInputSchema>;

export const recruiterComparisonCandidateSchema = z.object({
  username: z.string().min(1),
  full_name: z.string().min(1),
  headline: z.string().default(''),
  ats_score: z.number().min(0).max(100).default(85),
  video_pitch_url: z.string().nullable().default(null),
  matched_skills: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  years_experience: z.number().nonnegative().default(0),
  expected_salary: z.string().default('Negotiable'),
  recruiter_rating: z.number().int().min(1).max(5).default(5),
  evaluation_notes: z.string().default(''),
  key_differentiator: z.string().default('Verified talent profile'),
});
export type RecruiterComparisonCandidate = z.infer<typeof recruiterComparisonCandidateSchema>;

export const recruiterComparisonResponseSchema = z.object({
  jd_summary: z.string().default('Role Benchmark'),
  winner_username: z.string().optional(),
  candidates: z.array(recruiterComparisonCandidateSchema).min(2).max(3),
});
export type RecruiterComparisonResponse = z.infer<typeof recruiterComparisonResponseSchema>;

export const recruiterInviteInputSchema = z.object({
  username: z.string().trim().min(1),
  job_title: z.string().trim().min(1),
  interview_datetime: z.string().trim().min(1),
  offered_salary_range: z.string().trim().min(1),
  custom_video_prompt: z.string().trim().min(1),
  unlock_contact_via_wallet: z.boolean().default(true),
});
export type RecruiterInviteInput = z.infer<typeof recruiterInviteInputSchema>;

export const recruiterInviteResponseSchema = z.object({
  invite_id: z.string().min(1),
  username: z.string().min(1),
  job_title: z.string().min(1),
  stage: recruiterPipelineStageSchema.default('INTERVIEW_INVITED'),
  contact_unlocked: z.boolean().default(true),
  wallet_deducted_vnd: z.number().int().nonnegative().default(49000),
  candidate_notification_sent: z.boolean().default(true),
  candidate_tracker_synced: z.boolean().default(true),
});
export type RecruiterInviteResponse = z.infer<typeof recruiterInviteResponseSchema>;

export const recruiterHubKeys = {
  all: ['mobile-recruiter-hub'] as const,
  pipeline: (jobTitle?: string) => [...recruiterHubKeys.all, 'pipeline', jobTitle ?? 'all'] as const,
};

export async function fetchRecruiterPipeline(
  client: MobileApiClient = mobileApiClient,
  jobTitle?: string
): Promise<RecruiterPipelineResponse> {
  const qs = jobTitle?.trim() ? `?job_title=${encodeURIComponent(jobTitle.trim()).replace(/%20/g, '+')}` : '';
  const raw = await client.get<unknown>(`/v1/recruiter/pipeline${qs}`);
  if (Array.isArray(raw)) {
    const items = z.array(recruiterPipelineItemSchema).parse(raw);
    return { items, total: items.length };
  }
  return recruiterPipelineResponseSchema.parse(raw);
}

export async function addCandidateToRecruiterPipeline(
  client: MobileApiClient = mobileApiClient,
  input: AddRecruiterCandidateInput
): Promise<RecruiterPipelineItem> {
  const validated = addRecruiterCandidateInputSchema.parse(input);
  const raw = await client.post<unknown>('/v1/recruiter/pipeline', validated);
  return recruiterPipelineItemSchema.parse(raw);
}

export async function updateRecruiterPipelineItem(
  client: MobileApiClient = mobileApiClient,
  itemId: string,
  input: UpdateRecruiterPipelineInput
): Promise<RecruiterPipelineItem> {
  const validated = updateRecruiterPipelineInputSchema.parse(input);
  const raw = await client.patch<unknown>(
    `/v1/recruiter/pipeline/${encodeURIComponent(itemId)}`,
    validated
  );
  return recruiterPipelineItemSchema.parse(raw);
}

export async function compareRecruiterCandidates(
  client: MobileApiClient = mobileApiClient,
  input: RecruiterCompareInput
): Promise<RecruiterComparisonResponse> {
  const validated = recruiterCompareInputSchema.parse(input);
  const raw = await client.post<unknown>('/v1/recruiter/compare', validated);
  return recruiterComparisonResponseSchema.parse(raw);
}

export async function sendRecruiterInterviewInvite(
  client: MobileApiClient = mobileApiClient,
  input: RecruiterInviteInput
): Promise<RecruiterInviteResponse> {
  const validated = recruiterInviteInputSchema.parse(input);
  const raw = await client.post<unknown>('/v1/recruiter/invite', validated);
  return recruiterInviteResponseSchema.parse(raw);
}

export function buildRecruiterShortlistDossier(matrix: RecruiterComparisonResponse): string {
  const lines = [
    `# B2B Hiring Committee Dossier — ${matrix.jd_summary}`,
    matrix.winner_username ? `Recommended Top Fit: @${matrix.winner_username}` : '',
    ...matrix.candidates.map(
      (c, idx) =>
        `${idx + 1}. ${c.full_name} (@${c.username}) — ${c.ats_score}% ATS | ${c.years_experience}y exp | ${c.expected_salary} | Matched: ${c.matched_skills.join(', ') || 'N/A'}`
    ),
  ];
  return lines.filter(Boolean).join('\n');
}

export function useRecruiterPipelineQuery(
  jobTitle?: string,
  client: MobileApiClient = mobileApiClient
) {
  return useQuery({
    queryKey: recruiterHubKeys.pipeline(jobTitle),
    queryFn: () => fetchRecruiterPipeline(client, jobTitle),
  });
}

export function useAddRecruiterCandidateMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddRecruiterCandidateInput) => addCandidateToRecruiterPipeline(client, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruiterHubKeys.all });
    },
  });
}

export function useUpdateRecruiterPipelineMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateRecruiterPipelineInput }) =>
      updateRecruiterPipelineItem(client, itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruiterHubKeys.all });
    },
  });
}

export function useCompareRecruiterCandidatesMutation(client: MobileApiClient = mobileApiClient) {
  return useMutation({
    mutationFn: (input: RecruiterCompareInput) => compareRecruiterCandidates(client, input),
  });
}

export function useSendRecruiterInviteMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecruiterInviteInput) => sendRecruiterInterviewInvite(client, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruiterHubKeys.all });
    },
  });
}
