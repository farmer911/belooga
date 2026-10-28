import { describe, expect, test } from "bun:test";
import type { z } from "zod";
import {
  addJobSchema,
  candidateBookmarkItemSchema,
  loginSchema,
  passwordChangeSchema,
  registerSchema,
  reportProfileSchema,
  reviewBookingSchema,
} from "@/lib/schemas";

function issues(schema: z.ZodType, input: unknown) {
  const res = schema.safeParse(input);
  return res.success ? {} : Object.fromEntries(res.error.issues.map((i) => [i.path.join("."), i.message]));
}

const validRegister = {
  firstName: "Lan",
  lastName: "Tran",
  username: "lan_tran-99",
  email: "lan@example.com",
  password: "securePassword123",
  agreeTerms: true,
};

describe("loginSchema", () => {
  test("accepts a valid email/password and trims the email", () => {
    const res = loginSchema.safeParse({ email: "  user@example.com ", password: "x" });
    expect(res.success).toBe(true);
    expect(res.data?.email).toBe("user@example.com");
  });

  test("reports both invalid email and empty password", () => {
    expect(issues(loginSchema, { email: "not-an-email", password: "" })).toEqual({
      email: "Please enter a valid email address",
      password: "Password is required",
    });
  });
});

describe("registerSchema", () => {
  test("accepts a valid registration", () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  test.each([
    ["Upper", "Only lowercase letters, numbers, _ and -"],
    ["has space", "Only lowercase letters, numbers, _ and -"],
    ["ab", "Username must be at least 3 characters"],
  ])("rejects username %p", (username, message) => {
    expect(issues(registerSchema, { ...validRegister, username }).username).toBe(message);
  });

  test("rejects short password and unaccepted terms", () => {
    const errs = issues(registerSchema, { ...validRegister, password: "short", agreeTerms: false });
    expect(errs.password).toBe("Password must be at least 8 characters");
    expect(errs.agreeTerms).toBe("Please agree to the Terms of Service and Privacy Policy.");
  });
});

describe("passwordChangeSchema", () => {
  test("puts the mismatch error on confirmPassword", () => {
    expect(
      issues(passwordChangeSchema, {
        currentPassword: "old",
        newPassword: "newPassword123",
        confirmPassword: "different999",
      })
    ).toEqual({ confirmPassword: "New passwords do not match." });
  });

  test("accepts matching passwords of 8+ chars", () => {
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "old",
        newPassword: "newPassword123",
        confirmPassword: "newPassword123",
      }).success
    ).toBe(true);
  });
});

describe("addJobSchema", () => {
  const job = { company: "Stripe", position: "Engineer", status: "APPLIED", salary: "", score: 80, notes: "" };

  test("accepts a valid job", () => {
    expect(addJobSchema.safeParse(job).success).toBe(true);
  });

  test("rejects whitespace-only company, unknown status and out-of-range score", () => {
    const errs = issues(addJobSchema, { ...job, company: "   ", status: "HIRED", score: 101 });
    expect(Object.keys(errs).sort()).toEqual(["company", "score", "status"]);
  });
});

describe("reportProfileSchema / reviewBookingSchema", () => {
  test("enforce minimum lengths after trimming", () => {
    expect(issues(reportProfileSchema, { reason: "  abc  " }).reason).toBe(
      "Please provide a clear reason (min 5 characters)"
    );
    expect(issues(reviewBookingSchema, { targetRole: " a ", targetCompanies: "", candidateNotes: "" }).targetRole).toBe(
      "Target role is required (min 2 characters)"
    );
  });
});

describe("candidateBookmarkItemSchema", () => {
  test("fills defaults for optional backend fields", () => {
    expect(candidateBookmarkItemSchema.parse({ id: "b1", username: "lan" })).toEqual({
      id: "b1",
      username: "lan",
      full_name: "",
      headline: "",
      location: "",
      seeking_status: "Open to Offers",
      created_at: "",
    });
  });

  test("rejects an empty username", () => {
    expect(candidateBookmarkItemSchema.safeParse({ id: "b1", username: "" }).success).toBe(false);
  });
});
