import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
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

describe("BEL-226 Frontend Anti-Deception Invariants (#1, #2, #3, #4, #5, #8, #9)", () => {
  const readSrc = (relPath: string) => readFileSync(join(process.cwd(), "src", relPath), "utf8");

  test("momo-checkout-dialog and use-wallet do not call fake IPN signature or simulate-delivery bypass", () => {
    const momoSrc = readSrc("components/features/payments/momo-checkout-dialog.tsx");
    const walletSrc = readSrc("hooks/use-wallet.ts");

    expect(momoSrc.includes("valid_sim_sig")).toBe(false);
    expect(momoSrc.includes("/v1/payments/momo/ipn")).toBe(false);
    expect(walletSrc.includes("simulate-delivery")).toBe(false);
  });

  test("candidate-orders-list, recruiter-comparison-matrix, and workspace/jobs do not swallow errors in catch", () => {
    const ordersSrc = readSrc("components/features/expert-review/candidate-orders-list.tsx");
    const matrixSrc = readSrc("components/features/recruiter/recruiter-comparison-matrix.tsx");
    const jobsSrc = readSrc("app/workspace/jobs/page.tsx");

    expect(ordersSrc.includes("catch {")).toBe(false);
    expect(matrixSrc.includes("catch {")).toBe(false);
    expect(jobsSrc.includes("catch {")).toBe(false);
  });

  test("cv-file-parser and growth suites only call real backend endpoints", () => {
    const parserSrc = readSrc("lib/cv-file-parser.ts");
    const communitySrc = readSrc("components/features/growth/community-company-suite.tsx");
    const recruiterSrc = readSrc("components/features/growth/recruiter-tracker-wallet-suite.tsx");

    expect(parserSrc.includes("/timeline/")).toBe(false);
    expect(communitySrc.includes('apiClient.get<ReferralSlotItem[]>("/v1/growth/referrals"')).toBe(false);
    expect(communitySrc.includes('apiClient.get<CvRoastItem[]>("/v1/growth/cv-roasts")')).toBe(false);
    expect(communitySrc.includes("/vote")).toBe(false);
    expect(recruiterSrc.includes("/v1/growth/expert-mock-slots")).toBe(false);
    expect(recruiterSrc.includes('apiClient.get<ReverseBidItem[]>("/v1/recruiter/reverse-bids")')).toBe(false);
    expect(recruiterSrc.includes("/v1/growth/rewards")).toBe(false);
  });

  test("careers, social-feed-card, and review-booking-dialog use authenticated user instead of Alex Nguyen fallback", () => {
    const careersSrc = readSrc("app/(public)/careers/page.tsx");
    const socialSrc = readSrc("components/features/blog/social-feed-card.tsx");
    const bookingSrc = readSrc("components/features/expert-review/review-booking-dialog.tsx");

    expect(careersSrc.includes("alex@belooga.com")).toBe(false);
    expect(careersSrc.includes("Alex Nguyen")).toBe(false);
    expect(socialSrc.includes("alexnguyen")).toBe(false);
    expect(bookingSrc.includes("alexnguyen")).toBe(false);
  });

  test("BEL-230 (NTA-S004): AudioContext, MediaRecorder, and SpeechRecognition lifecycle hooks do not use blind catch blocks", () => {
    const visualizerSrc = readSrc("components/common/audio-visualizer-meter.tsx");
    const audioMeterSrc = readSrc("hooks/use-audio-meter.ts");
    const previewSrc = readSrc("lib/studio-preview.ts");
    const webrtcSrc = readSrc("hooks/use-webrtc-studio.ts");
    const teleprompterSrc = readSrc("hooks/use-teleprompter.ts");

    expect(visualizerSrc.includes(".catch(() => {})")).toBe(false);
    expect(visualizerSrc.includes('state !== "closed"')).toBe(true);

    expect(audioMeterSrc.includes(".catch(() => {})")).toBe(false);
    expect(audioMeterSrc.includes("catch (err) {}")).toBe(false);
    expect(audioMeterSrc.includes("catch (e) {}")).toBe(false);
    expect(audioMeterSrc.includes('state !== "closed"')).toBe(true);

    expect(previewSrc.includes(".catch(() => {})")).toBe(false);
    expect(previewSrc.includes('state !== "closed"')).toBe(true);

    expect(webrtcSrc.includes(".catch(() => {})")).toBe(false);
    expect(webrtcSrc.includes("catch (e) {}")).toBe(false);

    expect(teleprompterSrc.includes("catch (e) {}")).toBe(false);
    expect(teleprompterSrc.includes("isRecognitionActiveRef")).toBe(true);
  });
});

