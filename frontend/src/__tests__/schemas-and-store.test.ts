import { describe, expect, test } from "bun:test";
import {
  addJobSchema,
  loginSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  registerSchema,
  reviewBookingSchema,
} from "@/lib/schemas";
import { useAuthStore, normalizeAuthUser } from "@/store/auth-store";
import { getApiErrorDetail } from "@/services/api-client";

describe("Frontend Zod Schema Validation Suite", () => {
  test("loginSchema validates work email and non-empty password", () => {
    const ok = loginSchema.safeParse({ email: "alex@belooga.com", password: "password123" });
    expect(ok.success).toBe(true);

    const bad = loginSchema.safeParse({ email: "not-an-email", password: "" });
    expect(bad.success).toBe(false);
  });

  test("registerSchema enforces lowercase username regex and terms agreement", () => {
    const ok = registerSchema.safeParse({
      firstName: "Alex",
      lastName: "Rivera",
      username: "alex_rivera-99",
      email: "alex@belooga.com",
      password: "securePassword123",
      agreeTerms: true,
    });
    expect(ok.success).toBe(true);

    const badUsername = registerSchema.safeParse({
      firstName: "Alex",
      lastName: "Rivera",
      username: "Alex Rivera!",
      email: "alex@belooga.com",
      password: "securePassword123",
      agreeTerms: true,
    });
    expect(badUsername.success).toBe(false);
  });

  test("passwordChangeSchema rejects mismatched confirmPassword", () => {
    const mismatch = passwordChangeSchema.safeParse({
      currentPassword: "oldPassword123",
      newPassword: "newPassword123",
      confirmPassword: "differentPassword999",
    });
    expect(mismatch.success).toBe(false);

    const match = passwordChangeSchema.safeParse({
      currentPassword: "oldPassword123",
      newPassword: "newPassword123",
      confirmPassword: "newPassword123",
    });
    expect(match.success).toBe(true);
  });

  test("profileUpdateSchema, addJobSchema, and reviewBookingSchema enforce domain bounds", () => {
    expect(
      profileUpdateSchema.safeParse({
        firstName: "Ada",
        lastName: "Lovelace",
        headline: "Principal Systems Architect",
        location: "San Francisco, CA",
        phone: "+1-555-0100",
        seekingStatus: "Actively Looking",
        bio: "Distributed systems leader.",
      }).success
    ).toBe(true);

    expect(
      addJobSchema.safeParse({
        company: "Stripe",
        position: "Staff Backend Engineer",
        status: "INTERVIEW",
        salary: "$240k",
        score: 92,
        notes: "System design round scheduled",
      }).success
    ).toBe(true);

    expect(
      reviewBookingSchema.safeParse({
        targetRole: "Senior AI Engineer",
        targetCompanies: "OpenAI, Anthropic",
        candidateNotes: "Focus on GPU cluster throughput metrics",
      }).success
    ).toBe(true);
  });
});

describe("Zustand Auth Store & API Error Helper Suite", () => {
  test("useAuthStore transitions between anonymous, authenticated, and logged-out states", () => {
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();

    useAuthStore.getState().setAccessToken("jwt_token_xyz");
    useAuthStore.getState().setUser({
      id: "u-1",
      email: "alex@belooga.com",
      username: "alexnguyen",
      firstName: "Alex",
      lastName: "Nguyen",
      role: "candidate",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.username).toBe("alexnguyen");

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  test("normalizeAuthUser maps backend snake_case user payload to UserProfileSummary", () => {
    const mapped = normalizeAuthUser({
      id: "u-99",
      email: "alex@belooga.com",
      username: "alexnguyen",
      first_name: "Alex",
      last_name: "Nguyen",
      avatar_url: "/images/avatar.jpg",
      role: "candidate",
    });
    expect(mapped?.firstName).toBe("Alex");
    expect(mapped?.lastName).toBe("Nguyen");
    expect(mapped?.avatarUrl).toBe("/images/avatar.jpg");
    expect(normalizeAuthUser(null)).toBeNull();
  });

  test("getApiErrorDetail returns fallback for non-Axios errors", () => {
    expect(getApiErrorDetail(new Error("network down"), "Fallback error")).toBe("Fallback error");
  });
});
