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
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/v1/growth/mock-interview")) {
        return new Response(
          JSON.stringify({
            star_score: 92,
            clarity_score: 95,
            feedback_summary: "Strong STAR quantification.",
            improved_star_answer: "Migrated to asyncpg.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/salary-negotiation")) {
        return new Response(
          JSON.stringify({
            current_offer_usd: 2600,
            recommended_counter_usd: 3050,
            lift_pct: 17.3,
            negotiation_script: "Counter at $3,050/mo.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/career-roadmap")) {
        return new Response(
          JSON.stringify({
            current_role: "Senior Backend Engineer",
            steps: [
              { target_role: "Staff Engineer", timeline_months: 12, salary_jump_pct: 28, required_skills: ["System Design"] },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/outreach-generator")) {
        return new Response(
          JSON.stringify({
            cover_letter: "Excited to join Stripe.",
            cold_dm_script: "Hi Stripe Hiring Team, my 94% ATS match aligns directly.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/skill-assessment")) {
        return new Response(
          JSON.stringify({
            skill_name: "PostgreSQL 16",
            score_pct: 100,
            verified: true,
            badge_slug: "verified-skill-badge-postgresql-16",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/pitch-script")) {
        return new Response(
          JSON.stringify({
            duration_seconds: 60,
            wpm_target: 135,
            script_text: "60s teleprompter script.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/cv-auto-import")) {
        return new Response(
          JSON.stringify({
            full_name: "Nguyen Minh Phuc",
            headline: "Principal Engineer",
            extracted_skills: ["Go", "Python", "PostgreSQL 16"],
            experience_count: 3,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/stealth-mode")) {
        return new Response(
          JSON.stringify({
            stealth_enabled: true,
            blocked_companies: ["OldCorp", "LegacyBank"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/hub")) {
        return new Response(
          JSON.stringify({
            github_impact: { total_stars: 1420, top_repo: "belooga", prs_merged_90d: 84 },
            culture_fit_radar: { engineering_autonomy: 95, async_first: 92, high_velocity: 94 },
            interview_calendar: [
              { id: "prep-1", company_name: "Stripe", stage: "System Design", scheduled_at: "2026-10-25T14:00:00Z", prep_checked: true },
            ],
            b2b_roi_defaults: { hires_count: 5, estimated_savings_usd: 24500, days_saved: 42 },
            qr_career_card: { username: "alexnguyen", share_url: "https://belooga.dev/public/alexnguyen", qr_matrix_token: "BEL-QR-9941" },
            smart_career_pulse: { match_alerts_count: 4, top_matched_company: "Anthropic", top_match_score_pct: 96 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/referrals")) {
        return new Response(JSON.stringify({ id: "ref-1", status: "REQUESTED" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("/interview-questions")) {
        return new Response(
          JSON.stringify([{ id: "q-1", question: "Design distributed ledger", difficulty: "HARD" }]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/recruiter/reverse-bids")) {
        return new Response(
          JSON.stringify({ id: "bid-1", salary_offer_usd: 5200, status: "SENT" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/growth/cv-roasts")) {
        return new Response(JSON.stringify({ id: "roast-1", upvotes: 29 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("/v1/growth/expert-mock-booking")) {
        return new Response(JSON.stringify({ booking_id: "mock-bk-1", status: "ESCROW_LOCKED" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ reward_id: "rew-1", credited_vnd: 100000 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch);
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
