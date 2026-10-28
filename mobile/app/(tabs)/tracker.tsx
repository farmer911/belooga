import React, { useState } from "react";
import { router } from "expo-router";
import {
  filterMobileTrackedJobs,
  flushMobileJobOfflineOutbox,
  useCreateMobileJobMutation,
  useDeleteMobileJobMutation,
  useMobileCareerGoalsQuery,
  useMobileJobPipelineAnalyticsQuery,
  useMobileTrackedJobsQuery,
  useSaveMobileCareerGoalMutation,
  useTriggerMobileAiJobMatchMutation,
  useUpdateMobileJobStatusMutation,
} from "@/hooks/use-mobile-tracker";
import type { MobileJobStatus } from "@/lib/schemas";
import { Body, Button, Card, ErrorText, Field, H1, H2, Pill, Row, Screen, Sheet } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

const KANBAN_STAGES: readonly MobileJobStatus[] = ["TARGETING", "TAILORED", "APPLIED", "INTERVIEW", "OFFER"];
const STAGE_FILTERS = ["ALL", "SAVED", "APPLIED", "INTERVIEW", "OFFER"] as const;

function TrackerBoard() {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [isOnline, setIsOnline] = useState(true);
  const [targetRole, setTargetRole] = useState("");
  const [targetSkillsText, setTargetSkillsText] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");

  const jobsQuery = useMobileTrackedJobsQuery();
  const analyticsQuery = useMobileJobPipelineAnalyticsQuery();
  const careerGoalsQuery = useMobileCareerGoalsQuery();
  const saveGoalMutation = useSaveMobileCareerGoalMutation();
  const aiJobMatchMutation = useTriggerMobileAiJobMatchMutation();
  const createMutation = useCreateMobileJobMutation();
  const statusMutation = useUpdateMobileJobStatusMutation();
  const deleteJobMutation = useDeleteMobileJobMutation();

  const activeGoal = careerGoalsQuery.data?.[0];
  const analytics = analyticsQuery.data;
  const visibleJobs = filterMobileTrackedJobs(jobsQuery.data ?? [], searchQuery, stageFilter);

  const handleAddJob = () => {
    if (!company.trim() || !position.trim()) return;
    createMutation.mutate(
      { company: company.trim(), position: position.trim(), status: "TARGETING", salary: "", score: 0, notes: "" },
      {
        onSuccess: () => {
          setCompany("");
          setPosition("");
        },
      }
    );
  };

  const toggleOnline = async () => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    if (nextOnline) {
      await flushMobileJobOfflineOutbox();
      await jobsQuery.refetch();
    }
  };

  return (
    <>
      <Card testID="mobile-job-tracker-header">
        <Row style={{ justifyContent: "space-between" }}>
          <Pill label="CANDIDATE CRM" />
          <Button
            testID="mobile-tracker-toggle-online"
            label={isOnline ? "Network: Online" : "Network: Offline Outbox"}
            variant="secondary"
            onPress={() => void toggleOnline()}
          />
        </Row>
        <H1 testID="mobile-tracker-title">Job Application Kanban Pipeline</H1>
        {analytics ? (
          <Row testID="mobile-tracker-analytics">
            <Pill label={`Total: ${analytics.total_applications}`} />
            <Pill label={`Avg ATS: ${analytics.average_ats_score}%`} tone="success" />
            <Pill label={`Interview Rate: ${analytics.interview_rate}%`} tone="neutral" />
          </Row>
        ) : null}
        <Field testID="mobile-tracker-search-input" value={searchQuery} placeholder="Tìm kiếm theo công ty / vị trí..." onChangeText={setSearchQuery} />
        <Row testID="mobile-tracker-stage-filters">
          {STAGE_FILTERS.map((st) => (
            <Button
              key={st}
              testID={`mobile-tracker-stage-filter-${st}`}
              label={st}
              variant={stageFilter === st ? "primary" : "inset"}
              onPress={() => setStageFilter(st)}
            />
          ))}
        </Row>
        <Field testID="mobile-tracker-company-input" value={company} placeholder="Company (e.g. Stripe)" autoCapitalize="words" onChangeText={setCompany} />
        <Field testID="mobile-tracker-position-input" value={position} placeholder="Role (e.g. Staff Mobile)" autoCapitalize="words" onChangeText={setPosition} />
        <Button
          testID="mobile-tracker-add-job"
          label="Add Application to Pipeline"
          disabled={createMutation.isPending}
          onPress={handleAddJob}
        />
        <ErrorText error={createMutation.error ?? statusMutation.error ?? deleteJobMutation.error} />
      </Card>

      <Sheet testID="mobile-career-goal-card" title="Mục Tiêu Săn Việc & AI Job Matcher">
        <Pill label={activeGoal ? `Saved goal #${activeGoal.id}` : "No saved goal yet"} tone={activeGoal ? "success" : "neutral"} />
        <Field testID="mobile-career-goal-role-input" value={targetRole} placeholder={activeGoal?.target_role ?? "Target role"} onChangeText={setTargetRole} />
        <Field testID="mobile-career-goal-salary-input" value={minSalary} placeholder="Min salary ($/mo)" keyboardType="numeric" onChangeText={setMinSalary} />
        <Field testID="mobile-career-goal-skills-input" value={targetSkillsText} placeholder="Target skills (comma separated)" onChangeText={setTargetSkillsText} />
        <Field testID="mobile-career-goal-location-input" value={preferredLocation} placeholder="Preferred location" onChangeText={setPreferredLocation} />
        <Row>
          <Button
            testID="mobile-save-career-goal-btn"
            label={saveGoalMutation.isPending ? "Đang lưu..." : "Lưu Mục Tiêu"}
            variant="secondary"
            disabled={saveGoalMutation.isPending || !targetRole.trim()}
            onPress={() =>
              saveGoalMutation.mutate({
                target_role: targetRole.trim(),
                target_skills: targetSkillsText.split(",").map((s) => s.trim()).filter(Boolean),
                min_salary: Number(minSalary) || 0,
                preferred_location: preferredLocation.trim(),
              })
            }
          />
          <Button
            testID="mobile-trigger-ai-job-match-btn"
            label="Nhờ AI Săn Job (29k • Ví)"
            disabled={!activeGoal || aiJobMatchMutation.isPending}
            onPress={() => activeGoal && aiJobMatchMutation.mutate({ goalId: activeGoal.id, paymentMethod: "WALLET" })}
          />
        </Row>
        <ErrorText error={saveGoalMutation.error ?? aiJobMatchMutation.error} />
        {aiJobMatchMutation.data ? (
          <Pill
            testID="mobile-ai-job-match-results"
            label={`AI matched ${aiJobMatchMutation.data.matched_jobs.length} jobs (${aiJobMatchMutation.data.fee_vnd} VND)`}
            tone="success"
          />
        ) : null}
      </Sheet>

      <ErrorText testID="mobile-tracker-error" error={jobsQuery.error} />
      {visibleJobs.map((job) => (
        <Card key={job.id} testID={`mobile-tracker-card-${job.id}`}>
          <H2 testID={`mobile-tracker-job-title-${job.id}`}>
            {job.position} @ {job.company}
          </H2>
          <Pill testID={`mobile-tracker-job-status-${job.id}`} label={job.status} tone="success" />
          <Row>
            {KANBAN_STAGES.map((stage) => (
              <Button
                key={stage}
                testID={`mobile-tracker-move-${job.id}-${stage}`}
                label={stage}
                variant={job.status === stage ? "primary" : "inset"}
                onPress={() => statusMutation.mutate({ jobId: job.id, status: stage, isOnline })}
              />
            ))}
            <Button testID={`mobile-tracker-delete-${job.id}`} label="Remove" variant="danger" onPress={() => deleteJobMutation.mutate(job.id)} />
          </Row>
        </Card>
      ))}
      {jobsQuery.isSuccess && visibleJobs.length === 0 ? <Body>No applications in this view yet.</Body> : null}
    </>
  );
}

export default function TrackerScreen() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  return (
    <Screen testID="mobile-job-tracker-screen">
      {isAuthenticated ? (
        <TrackerBoard />
      ) : (
        <Card>
          <H1 testID="mobile-tracker-title">Job Application Kanban Pipeline</H1>
          <Body>Sign in to track your applications.</Body>
          <Button testID="mobile-tracker-signin" label="Sign In" onPress={() => router.push("/login")} />
        </Card>
      )}
    </Screen>
  );
}
