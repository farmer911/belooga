import React, { useState } from "react";
import { View } from "react-native";
import { TopCandidatesSection } from "@/components/top-candidates-section";
import {
  RECRUITER_PIPELINE_STAGES,
  type RecruiterPipelineStage,
  buildRecruiterShortlistDossier,
  useAddRecruiterCandidateMutation,
  useCompareRecruiterCandidatesMutation,
  useRecruiterPipelineQuery,
  useSendRecruiterInviteMutation,
  useUpdateRecruiterPipelineMutation,
} from "@/hooks/use-mobile-recruiter-hub";
import { Body, Button, Card, ErrorText, Field, H2, Pill, Row, Sheet, Well } from "@/lib/ui";

const nextStage = (current: RecruiterPipelineStage): RecruiterPipelineStage => {
  const idx = RECRUITER_PIPELINE_STAGES.indexOf(current);
  return RECRUITER_PIPELINE_STAGES[(idx + 1) % RECRUITER_PIPELINE_STAGES.length] ?? "SHORTLISTED";
};

function InviteForm({ username, defaultJobTitle }: { username: string; defaultJobTitle: string }) {
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [datetime, setDatetime] = useState("");
  const [salary, setSalary] = useState("");
  const [prompt, setPrompt] = useState("");
  const [unlockViaWallet, setUnlockViaWallet] = useState(false);
  const inviteMutation = useSendRecruiterInviteMutation();
  const validDate = !Number.isNaN(Date.parse(datetime));

  return (
    <Sheet testID="mobile-recruiter-invite-drawer" title={`Interview Invite for @${username}`}>
      <Field testID="recruiter-invite-job-input" value={jobTitle} onChangeText={setJobTitle} placeholder="Job title" />
      <Field testID="recruiter-invite-datetime-input" value={datetime} onChangeText={setDatetime} placeholder="Interview time (ISO, e.g. 2026-11-03T14:00:00Z)" />
      <Field testID="recruiter-invite-salary-input" value={salary} onChangeText={setSalary} placeholder="Offered salary range" />
      <Field testID="recruiter-invite-prompt-input" value={prompt} onChangeText={setPrompt} placeholder="Video prompt for the candidate" />
      <Button
        testID="recruiter-invite-wallet-toggle"
        variant={unlockViaWallet ? "primary" : "secondary"}
        label={`${unlockViaWallet ? "✓ " : ""}Unlock contact via B2B wallet (49,000 VND)`}
        onPress={() => setUnlockViaWallet((v) => !v)}
      />
      <Button
        testID="mobile-recruiter-invite-btn"
        label="Send Invite"
        disabled={inviteMutation.isPending || !jobTitle.trim() || !validDate}
        onPress={() =>
          inviteMutation.mutate({
            username,
            job_title: jobTitle.trim(),
            interview_datetime: new Date(datetime).toISOString(),
            offered_salary_range: salary.trim(),
            custom_video_prompt: prompt.trim(),
            unlock_contact_via_wallet: unlockViaWallet,
          })
        }
      />
      <ErrorText error={inviteMutation.error} />
      {inviteMutation.isSuccess ? <Body tone="success">Invite sent.</Body> : null}
    </Sheet>
  );
}

export function RecruiterHubSection() {
  const [roleFilter, setRoleFilter] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [jdBenchmark, setJdBenchmark] = useState("");
  const [inviteTarget, setInviteTarget] = useState<{ username: string; jobTitle: string } | null>(null);

  const pipelineQuery = useRecruiterPipelineQuery(roleFilter || undefined);
  const addMutation = useAddRecruiterCandidateMutation();
  const updateStageMutation = useUpdateRecruiterPipelineMutation();
  const compareMutation = useCompareRecruiterCandidatesMutation();
  const items = pipelineQuery.data?.items ?? [];

  const toggleCompare = (username: string) =>
    setSelectedForCompare((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : prev.length < 3 ? [...prev, username] : prev
    );

  return (
    <View testID="mobile-recruiter-hub-section" style={{ gap: 12 }}>
      <Card testID="mobile-recruiter-header-card">
        <Row style={{ justifyContent: "space-between" }}>
          <H2>Recruiter Hiring Command Center</H2>
          <Pill label={`${items.length} in pipeline`} />
        </Row>
        <Field testID="mobile-recruiter-role-filter-input" value={roleFilter} onChangeText={setRoleFilter} placeholder="Filter by role..." />
        <Field testID="mobile-recruiter-add-username-input" value={newUsername} onChangeText={setNewUsername} placeholder="Candidate username" />
        <Field testID="mobile-recruiter-add-role-input" value={newRoleTitle} onChangeText={setNewRoleTitle} placeholder="For role" />
        <Button
          testID="mobile-recruiter-add-btn"
          label="+ Shortlist"
          disabled={addMutation.isPending || !newUsername.trim() || !newRoleTitle.trim()}
          onPress={() =>
            addMutation.mutate(
              { username: newUsername.trim(), job_title: newRoleTitle.trim(), recruiter_rating: 5 },
              { onSuccess: () => setNewUsername("") }
            )
          }
        />
        <ErrorText error={addMutation.error ?? pipelineQuery.error ?? updateStageMutation.error} />
      </Card>

      <Card testID="mobile-recruiter-pipeline-list">
        <H2>Hiring Pipeline</H2>
        {items.map((item) => (
          <Well key={item.id} testID={`recruiter-pipeline-card-${item.id}`}>
            <Button
              testID={`recruiter-compare-checkbox-${item.username}`}
              variant={selectedForCompare.includes(item.username) ? "primary" : "secondary"}
              label={`${selectedForCompare.includes(item.username) ? "✓ " : ""}${item.full_name} (@${item.username})`}
              onPress={() => toggleCompare(item.username)}
            />
            <Body>
              {item.job_title} • {item.stage} • {item.ats_score}% ATS • rating {item.recruiter_rating}/5
            </Body>
            <Row>
              <Button
                testID={`mobile-recruiter-stage-btn-${item.id}`}
                label={`Advance → ${nextStage(item.stage)}`}
                variant="secondary"
                onPress={() => updateStageMutation.mutate({ itemId: item.id, input: { stage: nextStage(item.stage) } })}
              />
              <Button
                testID={`recruiter-invite-open-btn-${item.username}`}
                label="Invite"
                onPress={() => setInviteTarget({ username: item.username, jobTitle: item.job_title })}
              />
            </Row>
          </Well>
        ))}
      </Card>

      <Card testID="mobile-recruiter-comparison-card">
        <H2>Compare Candidates ({selectedForCompare.length}/3)</H2>
        <Field testID="recruiter-compare-jd-input" value={jdBenchmark} onChangeText={setJdBenchmark} placeholder="Benchmark job description" multiline />
        <Button
          testID="mobile-recruiter-compare-btn"
          label={`Compare ${selectedForCompare.length} Candidates`}
          disabled={compareMutation.isPending || selectedForCompare.length < 2 || !jdBenchmark.trim()}
          onPress={() => compareMutation.mutate({ usernames: selectedForCompare, jd_text: jdBenchmark })}
        />
        <ErrorText error={compareMutation.error} />
        {compareMutation.data ? (
          <>
            {compareMutation.data.candidates.map((cand) => (
              <Well key={cand.username}>
                <Body>
                  {cand.full_name} (@{cand.username}) — {cand.ats_score}% ATS • {cand.expected_salary}
                </Body>
                <Body tone="success">Matched: {cand.matched_skills.join(", ") || "—"}</Body>
                <Body tone="warning">Gap: {cand.missing_skills.join(", ") || "None"}</Body>
              </Well>
            ))}
            <Body testID="recruiter-dossier-preview">{buildRecruiterShortlistDossier(compareMutation.data)}</Body>
          </>
        ) : null}
      </Card>

      {inviteTarget ? (
        <InviteForm key={inviteTarget.username} username={inviteTarget.username} defaultJobTitle={inviteTarget.jobTitle} />
      ) : null}
      <TopCandidatesSection />
    </View>
  );
}
