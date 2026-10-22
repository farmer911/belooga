import { z } from "zod";

export const publicContactSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(255),
  email: z.string().trim().email("Please enter a valid work email"),
  company: z.string().trim().max(255),
  message: z.string().trim().min(1, "Message is required"),
});
export type PublicContactFormValues = z.infer<typeof publicContactSchema>;

export const reportProfileSchema = z.object({
  reason: z.string().trim().min(5, "Please provide a clear reason (min 5 characters)").max(1000),
});
export type ReportProfileFormValues = z.infer<typeof reportProfileSchema>;

export const addJobSchema = z.object({
  company: z.string().trim().min(1, "Tên công ty không được để trống").max(255),
  position: z.string().trim().min(1, "Vị trí ứng tuyển không được để trống").max(255),
  status: z.enum(["TARGETING", "TAILORED", "APPLIED", "INTERVIEW", "OFFER"]),
  salary: z.string().trim().max(100),
  score: z.number().min(0, "Điểm từ 0–100").max(100, "Điểm từ 0–100"),
  notes: z.string().trim(),
});
export type AddJobFormValues = z.infer<typeof addJobSchema>;

export const reviewBookingSchema = z.object({
  targetRole: z.string().trim().min(2, "Target role is required (min 2 characters)").max(255),
  targetCompanies: z.string().trim().max(255),
  candidateNotes: z.string().trim().max(2000),
});
export type ReviewBookingFormValues = z.infer<typeof reviewBookingSchema>;

export const contactUsSchema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(255),
  email: z.string().trim().email("Please enter a valid email address"),
  message: z.string().trim().min(1, "Inquiry message is required"),
});
export type ContactUsValues = z.infer<typeof contactUsSchema>;

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  headline: z.string().trim().min(1, "Professional headline is required").max(255),
  location: z.string().trim().max(255),
  phone: z.string().trim().max(50),
  seekingStatus: z.string().trim().max(64),
  bio: z.string().trim(),
});
export type ProfileFormValues = z.infer<typeof profileUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });
export type PasswordFormValues = z.infer<typeof passwordChangeSchema>;

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
  agreeTerms: z.boolean().refine((v) => v === true, {
    message: "Please agree to the Terms of Service and Privacy Policy.",
  }),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const BOOKMARKS_API_ENDPOINT = "/v1/bookmarks/" as const;
export const EXTRACT_CV_FILE_API_ENDPOINT = "/v1/match/extract-cv-file" as const;
export const EXPERT_REVIEW_ORDERS_ME_ENDPOINT = "/v1/expert-review/orders/me" as const;
export const WALLET_STATE_API_ENDPOINT = "/v1/wallet/" as const;
export const WALLET_TOPUP_API_ENDPOINT = "/v1/wallet/topup" as const;
export const WALLET_PAY_API_ENDPOINT = "/v1/wallet/pay" as const;
export const EXPERT_SIMULATE_DELIVERY_ENDPOINT = "/v1/expert-review/orders/{order_id}/simulate-delivery" as const;
export const EXPERT_COMPLETE_ORDER_ENDPOINT = "/v1/expert-review/orders/{order_id}/complete" as const;
export const MOMO_IPN_WEBHOOK_ENDPOINT = "/v1/payments/momo/ipn" as const;
export const BLOG_POSTS_API_ENDPOINT = "/v1/blog/posts/" as const;
export const BLOG_POST_LIKE_API_ENDPOINT = "/v1/blog/posts/{post_id}/like" as const;
export const BLOG_POST_COMMENTS_API_ENDPOINT = "/v1/blog/posts/{post_id}/comments" as const;
export const CAREERS_API_ENDPOINT = "/v1/careers/" as const;
export const CAREER_APPLY_API_ENDPOINT = "/v1/careers/{career_id}/apply" as const;
export const CATALOG_SKILLS_API_ENDPOINT = "/v1/catalogs/skills" as const;
export const CATALOG_SKILLS_SLASH_API_ENDPOINT = "/v1/catalogs/skills/" as const;
export const CATALOG_LOCATIONS_API_ENDPOINT = "/v1/catalogs/locations/" as const;
export const SEARCH_CANDIDATES_API_ENDPOINT = "/v1/search/candidates" as const;
export const SALARY_CRAWL_API_ENDPOINT = "/v1/catalogs/salary-benchmark/crawl" as const;
export const TRACKER_SEARCH_MARKET_JOBS_ENDPOINT = "/v1/tracker/search-market-jobs" as const;
export const TRACKER_GOALS_API_ENDPOINT = "/v1/tracker/goals" as const;
export const TRACKER_AI_MATCH_API_ENDPOINT = "/v1/tracker/goals/{goal_id}/ai-match" as const;
export const RECRUITER_PIPELINE_API_ENDPOINT = "/v1/recruiter/pipeline" as const;
export const RECRUITER_PIPELINE_ITEM_API_ENDPOINT = "/v1/recruiter/pipeline/{item_id}" as const;
export const RECRUITER_COMPARE_API_ENDPOINT = "/v1/recruiter/compare" as const;
export const RECRUITER_INVITE_API_ENDPOINT = "/v1/recruiter/invite" as const;
export const USER_POSTS_API_ENDPOINT = "/v1/posts/" as const;
export const USER_POSTS_BY_USERNAME_API_ENDPOINT = "/v1/posts/user/{username}" as const;
export const USER_POST_ITEM_API_ENDPOINT = "/v1/posts/{post_id}" as const;
export const USER_POST_LIKE_API_ENDPOINT = "/v1/posts/{post_id}/like" as const;
export const USER_POST_COMMENTS_API_ENDPOINT = "/v1/posts/{post_id}/comments" as const;
export const COMPANIES_DIRECTORY_API_ENDPOINT = "/v1/companies/" as const;
export const COMPANIES_SEARCH_API_ENDPOINT = "/v1/companies/search" as const;
export const COMPANY_DETAIL_API_ENDPOINT = "/v1/companies/{slug}" as const;
export const COMPANY_REVIEWS_API_ENDPOINT = "/v1/companies/{slug}/reviews" as const;
export const TOP_CANDIDATES_API_ENDPOINT = "/v1/search/top-candidates" as const;
export const EXPERT_LEADERBOARD_API_ENDPOINT = "/v1/expert-review/leaderboard" as const;
export const EXPERT_APPLY_API_ENDPOINT = "/v1/expert-review/apply" as const;
export const EXPERT_ME_API_ENDPOINT = "/v1/expert-review/me" as const;
export const CANDIDATE_ANALYTICS_API_ENDPOINT = "/v1/analytics/candidate" as const;
export const RECRUITER_ANALYTICS_API_ENDPOINT = "/v1/analytics/recruiter" as const;
export const EXPERT_ANALYTICS_API_ENDPOINT = "/v1/analytics/expert" as const;
export const COMPANY_INTERVIEW_QUESTIONS_API_ENDPOINT = "/v1/companies/{slug}/interview-questions" as const;
export const RECRUITER_REVERSE_BIDS_API_ENDPOINT = "/v1/recruiter/reverse-bids" as const;
export const GROWTH_MOCK_INTERVIEW_API_ENDPOINT = "/v1/growth/mock-interview" as const;
export const GROWTH_SALARY_NEGOTIATION_API_ENDPOINT = "/v1/growth/salary-negotiation" as const;
export const GROWTH_CAREER_ROADMAP_API_ENDPOINT = "/v1/growth/career-roadmap" as const;
export const GROWTH_OUTREACH_API_ENDPOINT = "/v1/growth/outreach-generator" as const;
export const GROWTH_SKILL_ASSESSMENT_API_ENDPOINT = "/v1/growth/skill-assessment" as const;
export const GROWTH_PITCH_SCRIPT_API_ENDPOINT = "/v1/growth/pitch-script" as const;
export const GROWTH_CV_AUTO_IMPORT_API_ENDPOINT = "/v1/growth/cv-auto-import" as const;
export const GROWTH_STEALTH_MODE_API_ENDPOINT = "/v1/growth/stealth-mode" as const;
export const GROWTH_HUB_API_ENDPOINT = "/v1/growth/hub" as const;
export const GROWTH_REFERRALS_API_ENDPOINT = "/v1/growth/referrals" as const;
export const GROWTH_CV_ROASTS_API_ENDPOINT = "/v1/growth/cv-roasts" as const;
export const GROWTH_EXPERT_MOCK_BOOKING_API_ENDPOINT = "/v1/growth/expert-mock-booking" as const;
export const GROWTH_CLAIM_REWARD_API_ENDPOINT = "/v1/growth/claim-reward" as const;

export const candidateBookmarkItemSchema = z.object({
  id: z.string(),
  recruiter_identity_id: z.string().optional(),
  candidate_profile_id: z.string().optional(),
  username: z.string().min(1),
  full_name: z.string().default(""),
  headline: z.string().default(""),
  location: z.string().default(""),
  seeking_status: z.string().default("Open to Offers"),
  avatar_url: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  created_at: z.string().default(""),
});
export type CandidateBookmarkItemDTO = z.infer<typeof candidateBookmarkItemSchema>;

