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
