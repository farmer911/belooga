import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Only lowercase letters, numbers, _ and -"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const userProfileDtoSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  role: z.enum(["candidate", "employer", "admin"]).default("candidate"),
  avatar_url: z.string().nullable().optional(),
});
export type UserProfileDTO = z.infer<typeof userProfileDtoSchema>;

export const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().nullable().optional(),
  token_type: z.string().default("bearer"),
  user: userProfileDtoSchema,
});
export type TokenResponseDTO = z.infer<typeof tokenResponseSchema>;

export const candidateSearchCardSchema = z.object({
  username: z.string().min(1),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  headline: z.string().default(""),
  location: z.string().default(""),
  avatar_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  trust_score: z.number().default(0),
});
export type CandidateSearchCardDTO = z.infer<typeof candidateSearchCardSchema>;

export const candidateSearchResponseSchema = z.object({
  items: z.array(candidateSearchCardSchema).default([]),
  total: z.number().default(0),
  next_cursor: z.string().nullable().optional(),
});
export type CandidateSearchResponseDTO = z.infer<typeof candidateSearchResponseSchema>;

export const trendingInsightsSchema = z.object({
  trending_skills: z
    .array(
      z.object({
        name: z.string().min(1),
        candidate_count: z.number().default(0),
      })
    )
    .default([]),
  featured_roles: z.array(z.string()).default([]),
});
export type TrendingInsightsDTO = z.infer<typeof trendingInsightsSchema>;

export const candidateJobExperienceSchema = z.object({
  id: z.string().min(1),
  company_name: z.string().min(1),
  title: z.string().min(1),
  start_date: z.string().default(""),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().default(false),
});

export const candidatePublicProfileSchema = z.object({
  username: z.string().min(1),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  headline: z.string().default(""),
  location: z.string().default(""),
  bio: z.string().default(""),
  avatar_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  job_experiences: z.array(candidateJobExperienceSchema).default([]),
});
export type CandidatePublicProfileDTO = z.infer<typeof candidatePublicProfileSchema>;

export const candidateTrustScoreSchema = z.object({
  trust_score: z.number().default(0),
  tier: z.string().default("Standard"),
});
export type CandidateTrustScoreDTO = z.infer<typeof candidateTrustScoreSchema>;

export const candidateTrajectorySchema = z.object({
  total_years_experience: z.number().default(0),
  milestones: z
    .array(
      z.object({
        year: z.string(),
        role: z.string(),
        company: z.string(),
      })
    )
    .default([]),
});
export type CandidateTrajectoryDTO = z.infer<typeof candidateTrajectorySchema>;

export const interviewKitResponseSchema = z.object({
  elevator_pitch_script: z.string().min(1),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        tip: z.string().default(""),
      })
    )
    .default([]),
});
export type InterviewKitResponseDTO = z.infer<typeof interviewKitResponseSchema>;

export const videoUploadCompleteSchema = z.object({
  status: z.string(),
  video_url: z.string().min(1),
});
export type VideoUploadCompleteDTO = z.infer<typeof videoUploadCompleteSchema>;

export const jobStatusEnum = z.enum([
  "TARGETING",
  "TAILORED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
]);
export type MobileJobStatus = z.infer<typeof jobStatusEnum>;

export const trackedJobItemSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  position: z.string().min(1),
  status: jobStatusEnum,
  salary: z.string().default(""),
  score: z.number().min(0).max(100).default(0),
  notes: z.string().default(""),
});
export type TrackedJobItemDTO = z.infer<typeof trackedJobItemSchema>;

export const createTrackedJobSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(255),
  position: z.string().trim().min(1, "Position is required").max(255),
  status: jobStatusEnum,
  salary: z.string().trim().max(100),
  score: z.number().min(0).max(100),
  notes: z.string().trim(),
});
export type CreateTrackedJobInput = z.infer<typeof createTrackedJobSchema>;

export const searchSuggestionsResponseSchema = z.object({
  suggestions: z.array(z.string()).default([]),
});

export const atsScanResultSchema = z.object({
  match_score: z.number().min(0).max(100).default(0),
  matched_keywords: z.array(z.string()).default([]),
  missing_keywords: z.array(z.string()).default([]),
  summary: z.string().default(""),
});
export type AtsScanResultDTO = z.infer<typeof atsScanResultSchema>;

export const atsScanHistoryItemSchema = z.object({
  id: z.string().min(1),
  job_title: z.string().default(""),
  company: z.string().default(""),
  match_score: z.number().default(0),
  created_at: z.string().default(""),
});
export type AtsScanHistoryItemDTO = z.infer<typeof atsScanHistoryItemSchema>;

export const jobPipelineAnalyticsSchema = z.object({
  total_applications: z.number().default(0),
  interview_rate: z.number().default(0),
  average_ats_score: z.number().default(0),
  by_status: z.record(z.string(), z.number()).default({}),
});
export type JobPipelineAnalyticsDTO = z.infer<typeof jobPipelineAnalyticsSchema>;

export const mobileNotificationItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().default(""),
  message: z.string().default(""),
  is_read: z.boolean().default(false),
  created_at: z.string().default(""),
  category: z.string().default("SYSTEM"),
  deep_link: z.string().default(""),
  action_label: z.string().default(""),
  email_sent: z.boolean().default(true),
});
export type MobileNotificationItemDTO = z.infer<typeof mobileNotificationItemSchema>;

export const candidateBookmarkItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  username: z.string().min(1),
  full_name: z.string().default(""),
  headline: z.string().default(""),
  location: z.string().default(""),
  seeking_status: z.string().default("Open to Offers"),
  avatar_url: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  created_at: z.string().default(""),
});
export type CandidateBookmarkItemDTO = z.infer<typeof candidateBookmarkItemSchema>;

export const skillCatalogItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  name: z.string().min(1),
  category: z.string().default("General"),
});
export type SkillCatalogItemDTO = z.infer<typeof skillCatalogItemSchema>;

export const careerGoalSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  target_role: z.string().min(1),
  target_skills: z.array(z.string()).default([]),
  min_salary: z.number().default(0),
  preferred_location: z.string().default(""),
});
export type CareerGoalDTO = z.infer<typeof careerGoalSchema>;

export const saveCareerGoalInputSchema = z.object({
  target_role: z.string().trim().min(1, "Target role is required"),
  target_skills: z.array(z.string()).default([]),
  min_salary: z.number().min(0).default(0),
  preferred_location: z.string().trim().default(""),
});
export type SaveCareerGoalInput = z.infer<typeof saveCareerGoalInputSchema>;

export const aiJobMatchResponseSchema = z.object({
  goal_id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  fee_vnd: z.number().default(29000),
  matched_jobs: z.array(trackedJobItemSchema).default([]),
});
export type AiJobMatchResponseDTO = z.infer<typeof aiJobMatchResponseSchema>;



