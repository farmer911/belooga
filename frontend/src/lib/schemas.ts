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
export const BLOG_POSTS_API_ENDPOINT = "/v1/blog/posts/" as const;
export const BLOG_POST_LIKE_API_ENDPOINT = "/v1/blog/posts/{post_id}/like" as const;
export const BLOG_POST_COMMENTS_API_ENDPOINT = "/v1/blog/posts/{post_id}/comments" as const;

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

