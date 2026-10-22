import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  autoImportMobileCv,
  bookMobileExpertMockInterview,
  claimMobileWalletReward,
  createMobileReferralRequest,
  evaluateMobileMockInterview,
  fetchCompanyInterviewQuestions,
  fetchMobileCareerRoadmap,
  fetchMobileGrowthHub,
  generateMobileOutreach,
  generateMobilePitchScript,
  generateMobileSalaryNegotiation,
  mockInterviewResultSchema,
  salaryNegotiationResultSchema,
  submitMobileCvRoast,
  submitMobileReverseBid,
  submitMobileSkillAssessment,
  toggleMobileStealthMode,
} from "../src/hooks/use-mobile-growth-20";
import { mobileApiClient, setMobileFetchTransportForTesting } from "../src/services/api-client";

describe("BEL-213 (#145): Mobile Implementation & Parity for the 20 High-Attraction Customer Features", () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it("executes Cluster A Career Acceleration APIs (Mock Interview, Salary Negotiation, Career Roadmap, Outreach)", async () => {
    const mockRes = await evaluateMobileMockInterview(
      {
        role_title: "Staff Backend Engineer",
        question: "Describe a high-concurrency database optimization.",
        answer_text: "Migrated to asyncpg and GIN TSVECTOR reducing p95 from 210ms to 11.4ms.",
      },
      mobileApiClient
    );
    expect(mockInterviewResultSchema.parse(mockRes).star_score).toBeGreaterThan(80);

    const negRes = await generateMobileSalaryNegotiation(
      {
        role_title: "Staff Backend Engineer",
        current_offer_usd: 2600,
        target_offer_usd: 3050,
      },
      mobileApiClient
    );
    expect(salaryNegotiationResultSchema.parse(negRes).recommended_counter_usd).toBeGreaterThan(2600);

    const roadmap = await fetchMobileCareerRoadmap("Senior Backend Engineer", mobileApiClient);
    expect(roadmap.steps.length).toBeGreaterThan(0);

    const outreach = await generateMobileOutreach(
      {
        company_name: "Stripe",
        role_title: "Staff Distributed Engineer",
      },
      mobileApiClient
    );
    expect(outreach.cold_dm_script.length).toBeGreaterThan(10);
  });

  it("executes Cluster B Workspace & Studio APIs (Skill Quiz Badges, 60s Teleprompter, 10s CV Import, Stealth Mode)", async () => {
    const quiz = await submitMobileSkillAssessment(
      { skill_name: "PostgreSQL 16", correct_answers: 5, total_questions: 5 },
      mobileApiClient
    );
    expect(quiz.verified).toBe(true);
    expect(quiz.badge_slug).toContain("verified-skill-badge-");

    const script = await generateMobilePitchScript(
      { role_title: "Principal Engineer", top_skills: ["Go", "PostgreSQL 16", "React Native"] },
      mobileApiClient
    );
    expect(script.duration_seconds).toBe(60);

    const imported = await autoImportMobileCv(
      { raw_cv_text: "Nguyen Minh Phuc - Principal Engineer at Grab. Skills: Go, Python, PostgreSQL 16." },
      mobileApiClient
    );
    expect(imported.extracted_skills.length).toBeGreaterThan(0);

    const stealth = await toggleMobileStealthMode(
      { stealth_enabled: true, blocked_companies: ["OldCorp", "LegacyBank"] },
      mobileApiClient
    );
    expect(stealth.stealth_enabled).toBe(true);
    expect(stealth.blocked_companies.length).toBe(2);
  });

  it("executes Cluster C & D Viral Loops, Reverse Bidding, Company Questions & Wallet Rewards APIs", async () => {
    const hub = await fetchMobileGrowthHub(mobileApiClient);
    expect(hub.github_impact.total_stars).toBeGreaterThan(0);
    expect(hub.smart_career_pulse.match_alerts_count).toBeGreaterThan(0);
    expect(hub.qr_career_card.share_url).toContain("belooga");

    const ref = await createMobileReferralRequest(
      { company_name: "Databricks", role_title: "Staff Systems Engineer", note: "95% ATS Match" },
      mobileApiClient
    );
    expect(ref.status).toBe("REQUESTED");

    const questions = await fetchCompanyInterviewQuestions("stripe", mobileApiClient);
    expect(questions.length).toBeGreaterThan(0);

    const bid = await submitMobileReverseBid(
      { candidate_username: "alexnguyen", company_name: "Anthropic", salary_offer_usd: 5200, pitch_note: "Fast-track final round" },
      mobileApiClient
    );
    expect(bid.salary_offer_usd).toBe(5200);

    const roast = await submitMobileCvRoast(
      { anonymous_handle: "staff_ninja", cv_snippet: "Built microservices with 99.99% SLA" },
      mobileApiClient
    );
    expect(roast.upvotes).toBeGreaterThan(0);

    const mockBooking = await bookMobileExpertMockInterview(
      { expert_id: "exp-1", topic: "System Design & Behavioral" },
      mobileApiClient
    );
    expect(mockBooking.status).toBe("ESCROW_LOCKED");

    const reward = await claimMobileWalletReward({ reward_id: "rew-1" }, mobileApiClient);
    expect(reward.credited_vnd).toBeGreaterThan(0);
  });

  it("wires all 20 Figma #141 mobile accessibilityLabel and Android content-desc contracts", () => {
    const sectionSrc = readFileSync(
      join(import.meta.dir, "../src/components/growth-20-section.tsx"),
      "utf-8"
    );
    const androidSrc = readFileSync(
      join(
        import.meta.dir,
        "../android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java"
      ),
      "utf-8"
    );

    const requiredIds = [
      "mobile-mock-interview-card",
      "mobile-salary-negotiation-card",
      "mobile-skill-quiz-card",
      "mobile-teleprompter-card",
      "mobile-career-roadmap-card",
      "mobile-referral-marketplace-card",
      "mobile-github-impact-card",
      "mobile-cv-import-card",
      "mobile-stealth-mode-toggle",
      "mobile-outreach-generator-card",
      "mobile-expert-mock-booking-card",
      "mobile-company-questions-card",
      "mobile-reverse-bidding-card",
      "mobile-culture-fit-radar",
      "mobile-cv-roast-card",
      "mobile-interview-calendar-card",
      "mobile-b2b-roi-card",
      "mobile-wallet-rewards-card",
      "mobile-qr-career-card",
      "mobile-smart-career-pulse",
    ];

    for (const id of requiredIds) {
      expect(sectionSrc).toContain(id);
      expect(androidSrc).toContain(id);
    }
  });
});
