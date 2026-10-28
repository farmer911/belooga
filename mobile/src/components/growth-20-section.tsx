import React, { useState } from "react";
import { View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import {
  autoImportMobileCv,
  createMobileReferralRequest,
  generateMobileOutreach,
  generateMobilePitchScript,
  toggleMobileStealthMode,
  useMobileCareerRoadmapQuery,
  useMobileCompanyQuestionsQuery,
  useMobileGrowthHubQuery,
  useMockInterviewMutation,
  useSalaryNegotiationMutation,
} from "@/hooks/use-mobile-growth-20";
import { Body, Button, Card, ErrorText, Field, H2, Row } from "@/lib/ui";

const csv = (text: string) => text.split(",").map((s) => s.trim()).filter(Boolean);

export function Growth20Section() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [currentOffer, setCurrentOffer] = useState("");
  const [targetOffer, setTargetOffer] = useState("");
  const [topSkills, setTopSkills] = useState("");
  const [cvText, setCvText] = useState("");
  const [blockedCos, setBlockedCos] = useState("");
  const [referralNote, setReferralNote] = useState("");

  const hubQuery = useMobileGrowthHubQuery();
  const roadmapQuery = useMobileCareerRoadmapQuery(role.trim() || undefined);
  const questionsQuery = useMobileCompanyQuestionsQuery(company.trim().toLowerCase() || undefined);
  const mockMutation = useMockInterviewMutation();
  const negMutation = useSalaryNegotiationMutation();
  const pitchMutation = useMutation({ mutationFn: (p: Parameters<typeof generateMobilePitchScript>[0]) => generateMobilePitchScript(p) });
  const outreachMutation = useMutation({ mutationFn: (p: Parameters<typeof generateMobileOutreach>[0]) => generateMobileOutreach(p) });
  const importMutation = useMutation({ mutationFn: (p: Parameters<typeof autoImportMobileCv>[0]) => autoImportMobileCv(p) });
  const stealthMutation = useMutation({ mutationFn: (p: Parameters<typeof toggleMobileStealthMode>[0]) => toggleMobileStealthMode(p) });
  const referralMutation = useMutation({ mutationFn: (p: Parameters<typeof createMobileReferralRequest>[0]) => createMobileReferralRequest(p) });
  const hub = hubQuery.data;

  return (
    <View testID="mobile-growth-20-hub" style={{ gap: 12 }}>
      <Card testID="mobile-growth-target-card">
        <H2>Your Target</H2>
        <Field testID="growth-role-input" value={role} onChangeText={setRole} placeholder="Target role (e.g. Senior Backend Engineer)" />
        <Field testID="growth-company-input" value={company} onChangeText={setCompany} placeholder="Target company (e.g. Stripe)" />
      </Card>

      <Card testID="mobile-mock-interview-card">
        <H2>AI Mock Interview</H2>
        <Field testID="mock-interview-question-input" value={question} onChangeText={setQuestion} placeholder="Interview question" />
        <Field testID="mock-interview-answer-input" value={answer} onChangeText={setAnswer} placeholder="Your STAR answer" multiline />
        <Button
          testID="mock-interview-submit-btn"
          label="Chấm Điểm STAR Answer"
          disabled={!role.trim() || !question.trim() || !answer.trim() || mockMutation.isPending}
          onPress={() => mockMutation.mutate({ role_title: role.trim(), question: question.trim(), answer_text: answer.trim() })}
        />
        <ErrorText error={mockMutation.error} />
        {mockMutation.data ? (
          <Body tone="brand">
            STAR {mockMutation.data.star_score}/100 — {mockMutation.data.feedback_summary}
          </Body>
        ) : null}
      </Card>

      <Card testID="mobile-salary-negotiation-card">
        <H2>Salary Negotiation Copilot</H2>
        <Row>
          <Field testID="negotiation-offer-input" style={{ flex: 1 }} value={currentOffer} onChangeText={setCurrentOffer} placeholder="Current offer $/mo" keyboardType="numeric" />
          <Field testID="negotiation-target-input" style={{ flex: 1 }} value={targetOffer} onChangeText={setTargetOffer} placeholder="Target $/mo" keyboardType="numeric" />
        </Row>
        <Button
          testID="negotiation-generate-btn"
          label="Tạo Kịch Bản Đàm Phán"
          disabled={!role.trim() || !Number(currentOffer) || !Number(targetOffer) || negMutation.isPending}
          onPress={() =>
            negMutation.mutate({ role_title: role.trim(), current_offer_usd: Number(currentOffer), target_offer_usd: Number(targetOffer) })
          }
        />
        <ErrorText error={negMutation.error} />
        {negMutation.data ? (
          <Body tone="brand">
            Counter with ${negMutation.data.recommended_counter_usd}: {negMutation.data.negotiation_script}
          </Body>
        ) : null}
      </Card>

      <Card testID="mobile-teleprompter-script-card">
        <H2>60s Pitch Script</H2>
        <Field testID="pitch-skills-input" value={topSkills} onChangeText={setTopSkills} placeholder="Top skills (comma separated)" />
        <Button
          testID="teleprompter-generate-btn"
          label="Generate 60s Script"
          disabled={!role.trim() || pitchMutation.isPending}
          onPress={() => pitchMutation.mutate({ role_title: role.trim(), top_skills: csv(topSkills) })}
        />
        <ErrorText error={pitchMutation.error} />
        {pitchMutation.data ? <Body testID="teleprompter-script-box">{pitchMutation.data.script_text}</Body> : null}
      </Card>

      <Card testID="mobile-career-roadmap-card">
        <H2>Career Roadmap</H2>
        <ErrorText error={roadmapQuery.error} />
        <Body testID="roadmap-role-select">
          {roadmapQuery.data
            ? roadmapQuery.data.steps.map((s) => `${s.target_role} (+${s.salary_jump_pct}% in ${s.timeline_months}m)`).join(" → ")
            : "Enter a target role to see your roadmap."}
        </Body>
      </Card>

      <Card testID="mobile-outreach-generator-card">
        <H2>Cover Letter & Cold Outreach</H2>
        <Button
          testID="outreach-generate-btn"
          label="Generate Cold DM"
          disabled={!role.trim() || !company.trim() || outreachMutation.isPending}
          onPress={() => outreachMutation.mutate({ company_name: company.trim(), role_title: role.trim() })}
        />
        <ErrorText error={outreachMutation.error} />
        {outreachMutation.data ? <Body>{outreachMutation.data.cold_dm_script}</Body> : null}
      </Card>

      <Card testID="mobile-referral-marketplace-card">
        <H2>Employee Referral Request</H2>
        <Field testID="referral-note-input" value={referralNote} onChangeText={setReferralNote} placeholder="Note to the referrer" />
        <Button
          testID="referral-request-btn"
          label="Xin Giới Thiệu Nội Bộ"
          disabled={!role.trim() || !company.trim() || referralMutation.isPending}
          onPress={() => referralMutation.mutate({ company_name: company.trim(), role_title: role.trim(), note: referralNote.trim() })}
        />
        <ErrorText error={referralMutation.error} />
        {referralMutation.isSuccess ? <Body tone="success">Referral requested.</Body> : null}
      </Card>

      <Card testID="mobile-company-questions-card">
        <H2>Company Interview Questions</H2>
        <ErrorText error={questionsQuery.error} />
        {(questionsQuery.data ?? []).map((q, i) => (
          <Body key={`${i}-${q.question}`}>• {q.question}</Body>
        ))}
        {company.trim() && questionsQuery.data?.length === 0 ? <Body>No questions shared yet.</Body> : null}
      </Card>

      <Card testID="mobile-cv-import-card">
        <H2>CV-to-Profile Auto-Import</H2>
        <Field testID="cv-import-text-input" value={cvText} onChangeText={setCvText} placeholder="Paste CV text" multiline />
        <Button
          testID="cv-import-submit-btn"
          label="Auto-Import CV"
          disabled={!cvText.trim() || importMutation.isPending}
          onPress={() => importMutation.mutate({ raw_cv_text: cvText })}
        />
        <ErrorText error={importMutation.error} />
        {importMutation.data ? <Body tone="success">Imported {importMutation.data.extracted_skills.length} skills.</Body> : null}
      </Card>

      <Card testID="mobile-stealth-mode-toggle">
        <H2>Stealth Job Seeking</H2>
        <Field testID="stealth-blocked-companies-input" value={blockedCos} onChangeText={setBlockedCos} placeholder="Hide from companies (comma separated)" />
        <Row>
          <Button
            testID="mobile-stealth-on-btn"
            label="Enable Stealth Mode"
            disabled={stealthMutation.isPending}
            onPress={() => stealthMutation.mutate({ stealth_enabled: true, blocked_companies: csv(blockedCos) })}
          />
          <Button
            testID="mobile-stealth-off-btn"
            label="Disable"
            variant="secondary"
            disabled={stealthMutation.isPending}
            onPress={() => stealthMutation.mutate({ stealth_enabled: false, blocked_companies: [] })}
          />
        </Row>
        <ErrorText error={stealthMutation.error} />
        {stealthMutation.data ? (
          <Body tone="success">Stealth mode {stealthMutation.data.stealth_enabled ? "ON" : "OFF"}.</Body>
        ) : null}
      </Card>

      {hub ? (
        <Card testID="mobile-growth-hub-stats">
          <H2>Career Pulse</H2>
          <Body testID="growth-github-impact-card">
            GitHub: {hub.github_impact.total_stars} stars • {hub.github_impact.prs_merged_90d} PRs merged (90d)
          </Body>
          <Body testID="growth-smart-career-pulse">
            {hub.smart_career_pulse.match_alerts_count} roles above 90% match (top: {hub.smart_career_pulse.top_matched_company}{" "}
            {hub.smart_career_pulse.top_match_score_pct}%)
          </Body>
        </Card>
      ) : (
        <ErrorText error={hubQuery.error} />
      )}
    </View>
  );
}
