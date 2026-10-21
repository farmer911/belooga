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
