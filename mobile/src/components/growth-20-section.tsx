import React, { useState } from "react";
import { ActionButton, BadgePill, SurfaceCard } from "@/lib/native-runtime";
import {
  autoImportMobileCv,
  bookMobileExpertMockInterview,
  createMobileReferralRequest,
  generateMobileOutreach,
  generateMobilePitchScript,
  submitMobileCvRoast,
  submitMobileReverseBid,
  toggleMobileStealthMode,
  useClaimRewardMutation,
  useMobileCareerRoadmapQuery,
  useMobileCompanyQuestionsQuery,
  useMobileGrowthHubQuery,
  useMockInterviewMutation,
  useSalaryNegotiationMutation,
  useSkillAssessmentMutation,
} from "@/hooks/use-mobile-growth-20";
import { getSemanticTokens } from "@/theme/tokens";

export function Growth20Section() {
  const tokens = getSemanticTokens("neumorphic");
  const [mockAnswer, setMockAnswer] = useState("Migrated to asyncpg & GIN TSVECTOR reducing p95 to 11.4ms.");
  const [offerUsd, setOfferUsd] = useState("2600");
  const [cvImportText, setCvImportText] = useState("Principal Engineer • Go, Python, PostgreSQL 16");
  const [stealthOn, setStealthOn] = useState(true);
  const [blockedCos, setBlockedCos] = useState("OldCorp, LegacyBank");
  const [roiHires, setRoiHires] = useState("5");
  const [statusBanner, setStatusBanner] = useState("20 High-Attraction Viral & Growth Modules Ready");

  const hubQuery = useMobileGrowthHubQuery();
  const roadmapQuery = useMobileCareerRoadmapQuery("Senior Backend Engineer");
  const questionsQuery = useMobileCompanyQuestionsQuery("stripe");
  const mockMutation = useMockInterviewMutation();
  const negMutation = useSalaryNegotiationMutation();
  const quizMutation = useSkillAssessmentMutation();
  const rewardMutation = useClaimRewardMutation();

  const hub = hubQuery.data;
  const inputStyle = {
    backgroundColor: tokens.surface.elevated,
    color: tokens.typography.main,
    border: `1px solid ${tokens.surface.border}`,
    borderRadius: 12,
    padding: "8px 10px",
    fontSize: 12,
  };

  return (
    <div data-testid="mobile-growth-20-hub" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <BadgePill label={statusBanner} tone="brand" />

      <SurfaceCard testID="mobile-mock-interview-card" mode="dark">
        <div data-testid="growth-mock-interview-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#1 AI Mock Interview Simulator (/v1/growth/mock-interview)</strong>
          <input data-testid="mock-interview-answer-input" value={mockAnswer} onChange={(e) => setMockAnswer(e.target.value)} style={inputStyle} />
          <ActionButton
            testID="mock-interview-submit-btn"
            accessibilityLabel="mock-interview-submit-btn"
            label="Chấm Điểm STAR Answer"
            onPress={() => mockMutation.mutate({ role_title: "Staff Backend Engineer", question: "High-concurrency DB fix", answer_text: mockAnswer })}
          />
          {mockMutation.data ? <span>STAR Score: {mockMutation.data.star_score}/100 — {mockMutation.data.feedback_summary}</span> : null}
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-salary-negotiation-card" mode="dark">
        <div data-testid="growth-salary-negotiation-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#2 Offer Salary Negotiation Copilot (/v1/growth/salary-negotiation)</strong>
          <input data-testid="negotiation-offer-input" value={offerUsd} onChange={(e) => setOfferUsd(e.target.value)} style={inputStyle} />
          <ActionButton
            testID="negotiation-generate-btn"
            accessibilityLabel="negotiation-generate-btn"
            label="Tạo Kịch Bản Đàm Phán Lương (+17.3%)"
            onPress={() => negMutation.mutate({ role_title: "Staff Backend Engineer", current_offer_usd: Number(offerUsd) || 2600, target_offer_usd: 3050 })}
          />
          {negMutation.data ? <span>Recommended Counter: ${negMutation.data.recommended_counter_usd} ({negMutation.data.negotiation_script})</span> : null}
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-skill-quiz-card" mode="dark">
        <div data-testid="growth-skill-quiz-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#3 Verified Skill Micro-Assessments &amp; Badges (/v1/growth/skill-assessment)</strong>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <ActionButton
              testID="skill-quiz-start-btn"
              accessibilityLabel="skill-quiz-start-btn"
              label="Start 5-Min PostgreSQL 16 Quiz"
              variant="secondary"
              onPress={() => quizMutation.mutate({ skill_name: "PostgreSQL 16", correct_answers: 5, total_questions: 5 })}
            />
            <ActionButton
              testID="skill-quiz-submit-btn"
              accessibilityLabel="skill-quiz-submit-btn"
              label="Verify Skill Badge"
              onPress={() => quizMutation.mutate({ skill_name: "PostgreSQL 16", correct_answers: 5, total_questions: 5 })}
            />
          </div>
          <span data-testid="verified-skill-badge-postgresql">Verified Badge: PostgreSQL 16 (Top 5%)</span>
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-teleprompter-card" mode="dark">
        <div data-testid="growth-pitch-teleprompter-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#4 60s Video Pitch AI Teleprompter (/v1/growth/pitch-script)</strong>
          <ActionButton
            testID="teleprompter-generate-btn"
            accessibilityLabel="teleprompter-generate-btn"
            label="Generate 60s Teleprompter Script"
            onPress={() => void generateMobilePitchScript({ role_title: "Principal Engineer", top_skills: ["Go", "PG16"] }).then((r) => setStatusBanner(r.script_text))}
          />
          <div data-testid="teleprompter-script-box" style={{ fontSize: 12, color: tokens.typography.body }}>60s WPM Pacing Ready (135 WPM)</div>
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-career-roadmap-card" mode="dark">
        <div data-testid="growth-career-roadmap-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#5 Career Path &amp; Promotion Roadmap Simulator (/v1/growth/career-roadmap)</strong>
          <div data-testid="roadmap-role-select" style={{ fontSize: 12, color: tokens.typography.body }}>
            {(roadmapQuery.data?.steps ?? []).map((s) => `${s.target_role} (+${s.salary_jump_pct}% in ${s.timeline_months}m)`).join(" -> ")}
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-referral-marketplace-card" mode="dark">
        <div data-testid="growth-referral-marketplace" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#6 Employee Referral Marketplace (/v1/growth/referrals)</strong>
          <ActionButton
            testID="referral-request-btn-ref-1"
            accessibilityLabel="referral-request-btn-ref-1"
            label="Xin Giới Thiệu Nội Bộ (Databricks)"
            onPress={() => void createMobileReferralRequest({ company_name: "Databricks", role_title: "Staff Engineer", note: "95% ATS" }).then(() => setStatusBanner("Referral Requested!"))}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-github-impact-card" mode="dark">
        <div data-testid="growth-github-impact-card" style={{ fontSize: 12, color: tokens.typography.body }}>
          <strong>#7 GitHub &amp; Live Project Impact:</strong> {hub?.github_impact.total_stars ?? 1420} Stars • {hub?.github_impact.prs_merged_90d ?? 84} PRs Merged (90d)
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-cv-import-card" mode="dark">
        <div data-testid="growth-cv-auto-import-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#8 10s CV-to-Profile Auto-Importer (/v1/growth/cv-auto-import)</strong>
          <input data-testid="cv-import-text-input" value={cvImportText} onChange={(e) => setCvImportText(e.target.value)} style={inputStyle} />
          <ActionButton
            testID="cv-import-submit-btn"
            accessibilityLabel="cv-import-submit-btn"
            label="1-Click Auto-Import CV"
            onPress={() => void autoImportMobileCv({ raw_cv_text: cvImportText }).then((r) => setStatusBanner(`Imported ${r.extracted_skills.length} skills`))}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-stealth-mode-toggle" mode="dark">
        <div data-testid="growth-stealth-mode-toggle" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#9 Stealth Job Seeking Mode (/v1/growth/stealth-mode)</strong>
          <input data-testid="stealth-blocked-companies-input" value={blockedCos} onChange={(e) => setBlockedCos(e.target.value)} style={inputStyle} />
          <ActionButton
            testID="mobile-stealth-toggle-btn"
            accessibilityLabel="mobile-stealth-toggle-btn"
            label={stealthOn ? "Stealth Mode: ON (Hidden from Current Employer)" : "Stealth Mode: OFF"}
            onPress={() => {
              const next = !stealthOn;
              setStealthOn(next);
              void toggleMobileStealthMode({ stealth_enabled: next, blocked_companies: blockedCos.split(",") });
            }}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-outreach-generator-card" mode="dark">
        <div data-testid="growth-outreach-generator-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#10 1-Click AI Cover Letter &amp; Cold Outreach</strong>
          <ActionButton
            testID="outreach-generate-btn"
            accessibilityLabel="outreach-generate-btn"
            label="Generate Cold DM"
            onPress={() => void generateMobileOutreach({ company_name: "Stripe", role_title: "Staff Engineer" }).then((r) => setStatusBanner(r.cold_dm_script))}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-expert-mock-booking-card" mode="dark">
        <div data-testid="growth-expert-mock-booking-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#11 1-on-1 Live Mock Interview Booking (Escrow)</strong>
          <ActionButton
            testID="expert-mock-book-btn-exp-1"
            accessibilityLabel="expert-mock-book-btn-exp-1"
            label="Book 45m Live Mock (Escrow)"
            onPress={() => void bookMobileExpertMockInterview({ expert_id: "exp-1", topic: "System Design" }).then((r) => setStatusBanner(`Booking: ${r.status}`))}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-company-questions-card" mode="dark">
        <div data-testid="company-interview-questions-section" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#12 Company Interview Question Bank (/v1/companies/stripe/interview-questions)</strong>
          <span style={{ fontSize: 12, color: tokens.typography.body }}>{questionsQuery.data?.[0]?.question ?? "Design distributed ledger"}</span>
          <ActionButton testID="company-question-submit-btn" accessibilityLabel="company-question-submit-btn" label="Đóng Góp Câu Hỏi Phỏng Vấn" variant="secondary" onPress={() => setStatusBanner("Question submitted!")} />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-reverse-bidding-card" mode="dark">
        <div data-testid="growth-reverse-bidding-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#13 Recruiter Reverse Offer Bidding (/v1/recruiter/reverse-bids)</strong>
          <ActionButton
            testID="reverse-bid-submit-btn"
            accessibilityLabel="reverse-bid-submit-btn"
            label="Send $5,200 Reverse Offer Bid"
            onPress={() => void submitMobileReverseBid({ candidate_username: "alexnguyen", company_name: "Anthropic", salary_offer_usd: 5200, pitch_note: "Fast-track" }).then(() => setStatusBanner("Reverse Bid Sent!"))}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-culture-fit-radar" mode="dark">
        <div data-testid="growth-culture-fit-radar" style={{ fontSize: 12, color: tokens.typography.body }}>
          <strong>#14 Engineering Culture &amp; Team Fit Radar:</strong> Autonomy {hub?.culture_fit_radar.engineering_autonomy ?? 95}% • Async-First {hub?.culture_fit_radar.async_first ?? 92}%
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-cv-roast-card" mode="dark">
        <div data-testid="growth-cv-roast-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#15 Anonymous CV Roast &amp; Resume Battle (/v1/growth/cv-roasts)</strong>
          <div style={{ display: "flex", gap: 6 }}>
            <ActionButton testID="cv-roast-submit-btn" accessibilityLabel="cv-roast-submit-btn" label="Post Anonymous CV" variant="secondary" onPress={() => void submitMobileCvRoast({ anonymous_handle: "staff_dev", cv_snippet: "99.99% SLA" })} />
            <ActionButton testID="cv-roast-vote-btn-roast-1" accessibilityLabel="cv-roast-vote-btn-roast-1" label="Upvote (+29)" onPress={() => setStatusBanner("Upvoted CV Roast!")} />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-interview-calendar-card" mode="dark">
        <div data-testid="growth-interview-calendar-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#16 Interview Calendar &amp; Prep Checklist (Stripe System Design)</strong>
          <ActionButton testID="interview-prep-checkbox-prep-1" accessibilityLabel="interview-prep-checkbox-prep-1" label="Prep Done" variant="secondary" onPress={() => setStatusBanner("Checklist updated!")} />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-b2b-roi-card" mode="dark">
        <div data-testid="growth-b2b-roi-calculator" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ color: tokens.typography.heading }}>#17 B2B Hiring ROI &amp; Time-to-Hire Calculator</strong>
          <input data-testid="roi-hires-input" value={roiHires} onChange={(e) => setRoiHires(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 12, color: tokens.typography.body }}>Estimated Agency Savings: ${(Number(roiHires) || 5) * 4900} USD • 42 Days Saved</span>
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-wallet-rewards-card" mode="dark">
        <div data-testid="growth-wallet-rewards-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#18 Career Rewards &amp; Wallet Cashback (/v1/growth/claim-reward)</strong>
          <ActionButton testID="wallet-claim-reward-btn-rew-1" accessibilityLabel="wallet-claim-reward-btn-rew-1" label="Claim +100k VND Cashback" onPress={() => rewardMutation.mutate("rew-1")} />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-qr-career-card" mode="dark">
        <div data-testid="growth-qr-career-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: tokens.typography.heading }}>#19 Instant QR Digital Career Card ({hub?.qr_career_card.qr_matrix_token ?? "BEL-QR-9941"})</strong>
          <ActionButton testID="qr-career-card-open-btn" accessibilityLabel="qr-career-card-open-btn" label="Share QR vCard" variant="secondary" onPress={() => setStatusBanner("QR Digital Career Card Active!")} />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-smart-career-pulse" mode="dark">
        <div data-testid="growth-smart-career-pulse" style={{ fontSize: 12, color: tokens.typography.body }}>
          <strong>#20 Smart Career Pulse &amp; High-Match Alert Radar:</strong> {hub?.smart_career_pulse.match_alerts_count ?? 4} Roles &gt;90% ATS Match (Top: {hub?.smart_career_pulse.top_matched_company ?? "Anthropic"} {hub?.smart_career_pulse.top_match_score_pct ?? 96}%)
        </div>
      </SurfaceCard>
    </div>
  );
}
