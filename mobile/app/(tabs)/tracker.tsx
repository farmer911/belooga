import React, { useState } from "react";
import {
  BadgePill,
  BottomSheetDrawer,
  NeumorphicButton,
  NeumorphicCard,
  NeumorphicInput,
  ScreenShell,
} from "@/lib/native-runtime";
import { MobileJobStatus } from "@/lib/schemas";
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
  useUpdateMobileJobMutation,
  useUpdateMobileJobStatusMutation,
} from "@/hooks/use-mobile-tracker";
import { getSemanticTokens } from "@/theme/tokens";

const KANBAN_STAGES: readonly MobileJobStatus[] = [
  "TARGETING",
  "TAILORED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
] as const;

const STAGE_FILTERS = ["ALL", "SAVED", "APPLIED", "INTERVIEW", "OFFER"] as const;

export default function MobileJobTrackerScreen() {
  const tokens = getSemanticTokens("neumorphic");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [isOnline, setIsOnline] = useState(true);

  const [targetRole, setTargetRole] = useState("Staff Distributed Systems Engineer");
  const [targetSkillsText, setTargetSkillsText] = useState("Golang, Python, PostgreSQL, Kubernetes");
  const [minSalary, setMinSalary] = useState("4500");
  const [preferredLocation, setPreferredLocation] = useState("Ho Chi Minh City / Remote");

  const jobsQuery = useMobileTrackedJobsQuery();
  const analyticsQuery = useMobileJobPipelineAnalyticsQuery();
  const careerGoalsQuery = useMobileCareerGoalsQuery();
  const saveGoalMutation = useSaveMobileCareerGoalMutation();
  const aiJobMatchMutation = useTriggerMobileAiJobMatchMutation();
  const createMutation = useCreateMobileJobMutation();
  const statusMutation = useUpdateMobileJobStatusMutation();
  const updateJobMutation = useUpdateMobileJobMutation();
  const deleteJobMutation = useDeleteMobileJobMutation();

  const activeGoal = careerGoalsQuery.data?.[0];

  const handleAddJob = async () => {
    if (!company.trim() || !position.trim()) return;
    await createMutation.mutateAsync({
      company: company.trim(),
      position: position.trim(),
      status: "TARGETING",
      salary: "$195k",
      score: 90,
      notes: "",
    });
    setCompany("");
    setPosition("");
  };

  const handleSaveCareerGoal = async () => {
    const skills = targetSkillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await saveGoalMutation.mutateAsync({
      target_role: targetRole.trim() || "Staff Backend Engineer",
      target_skills: skills,
      min_salary: Number(minSalary) || 0,
      preferred_location: preferredLocation.trim(),
    });
  };

  const handleTriggerAiJobMatch = async () => {
    const goalId = activeGoal?.id ?? "goal_default_1";
    await aiJobMatchMutation.mutateAsync({
      goalId,
      paymentMethod: "WALLET",
    });
  };

  const analytics = analyticsQuery.data;
  const visibleJobs = filterMobileTrackedJobs(jobsQuery.data ?? [], searchQuery, stageFilter);

  return (
    <ScreenShell testID="mobile-job-tracker-screen" mode="neumorphic">
      <NeumorphicCard testID="mobile-job-tracker-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BadgePill label="CANDIDATE CRM • OFFLINE VAULT" tone="brand" />
          <NeumorphicButton
            testID="mobile-tracker-toggle-online"
            label={isOnline ? "Network: Online" : "Network: Offline Outbox"}
            variant="secondary"
            onPress={async () => {
              const nextOnline = !isOnline;
              setIsOnline(nextOnline);
              if (nextOnline) {
                await flushMobileJobOfflineOutbox();
                await jobsQuery.refetch();
              }
            }}
          />
        </div>
        <h1
          data-testid="mobile-tracker-title"
          style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.typography.heading }}
        >
          Job Application Kanban Pipeline
        </h1>
        {analytics ? (
          <div data-testid="mobile-tracker-analytics" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <BadgePill label={`Total: ${analytics.total_applications}`} tone="brand" />
            <BadgePill label={`Avg ATS: ${analytics.average_ats_score}%`} tone="success" />
            <BadgePill label={`Interview Rate: ${analytics.interview_rate}%`} tone="neutral" />
          </div>
        ) : null}
        <NeumorphicInput
          testID="mobile-tracker-search-input"
          accessibilityLabel="mobile-tracker-search-input"
          value={searchQuery}
          placeholder="Tìm kiếm công việc theo công ty / vị trí..."
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div data-testid="mobile-tracker-stage-filters" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STAGE_FILTERS.map((st) => (
            <NeumorphicButton
              key={st}
              testID={`mobile-tracker-stage-filter-${st}`}
              accessibilityLabel={`mobile-tracker-stage-filter-${st}`}
              label={st}
              variant={stageFilter === st ? "primary" : "inset"}
              onPress={() => setStageFilter(st)}
            />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <NeumorphicInput
            testID="mobile-tracker-company-input"
            value={company}
            placeholder="Company (e.g. Stripe)"
            onChange={(e) => setCompany(e.target.value)}
          />
          <NeumorphicInput
            testID="mobile-tracker-position-input"
            value={position}
            placeholder="Role (e.g. Staff Mobile)"
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>
        <NeumorphicButton
          testID="mobile-tracker-add-job"
          label="Add Application to Pipeline"
          onPress={handleAddJob}
        />
      </NeumorphicCard>

      <BottomSheetDrawer testID="mobile-bottom-sheet-drawer" title="Mục Tiêu Săn Việc & AI Job Matcher">
        <div data-testid="mobile-career-goal-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <BadgePill label="PERSISTED CAREER GOAL • /V1/TRACKER/GOALS" tone="brand" />
          <BadgePill label={activeGoal ? `Synced (#${activeGoal.id})` : "Vault Ready"} tone="success" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <NeumorphicInput
            testID="mobile-career-goal-role-input"
            value={targetRole}
            placeholder="Target Role"
            onChange={(e) => setTargetRole(e.target.value)}
          />
          <NeumorphicInput
            testID="mobile-career-goal-salary-input"
            value={minSalary}
            placeholder="Min Salary ($/mo)"
            onChange={(e) => setMinSalary(e.target.value)}
          />
        </div>
        <NeumorphicInput
          testID="mobile-career-goal-skills-input"
          value={targetSkillsText}
          placeholder="Target Skills (comma separated)"
          onChange={(e) => setTargetSkillsText(e.target.value)}
        />
        <NeumorphicInput
          testID="mobile-career-goal-location-input"
          value={preferredLocation}
          placeholder="Preferred Location"
          onChange={(e) => setPreferredLocation(e.target.value)}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <NeumorphicButton
            testID="mobile-save-career-goal-btn"
            accessibilityLabel="mobile-save-career-goal-btn"
            label={saveGoalMutation.isPending ? "Đang lưu..." : "Lưu Mục Tiêu"}
            variant="secondary"
            onPress={() => void handleSaveCareerGoal()}
          />
          <NeumorphicButton
            testID="mobile-trigger-ai-job-match-btn"
            accessibilityLabel="mobile-trigger-ai-job-match-btn"
            label="Nhờ AI Săn Job Phù Hợp (29k • Ví / MoMo)"
            onPress={() => void handleTriggerAiJobMatch()}
          />
        </div>
        {aiJobMatchMutation.data ? (
          <div data-testid="mobile-ai-job-match-results">
            <BadgePill
              label={`AI Matched ${aiJobMatchMutation.data.matched_jobs.length} Jobs (${aiJobMatchMutation.data.fee_vnd} VND)`}
              tone="success"
            />
          </div>
        ) : null}
      </BottomSheetDrawer>

      <div data-testid="mobile-tracker-kanban-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleJobs.map((job) => (
          <NeumorphicCard key={job.id} testID={`mobile-tracker-card-${job.id}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2
                data-testid={`mobile-tracker-job-title-${job.id}`}
                style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.typography.heading }}
              >
                {job.position} @ {job.company}
              </h2>
              <BadgePill
                testID={`mobile-tracker-job-status-${job.id}`}
                label={job.status}
                tone="success"
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {KANBAN_STAGES.map((stage) => (
                <NeumorphicButton
                  key={stage}
                  testID={`mobile-tracker-move-${job.id}-${stage}`}
                  label={stage}
                  variant={job.status === stage ? "primary" : "inset"}
                  onPress={() =>
                    statusMutation.mutate({
                      jobId: job.id,
                      status: stage,
                      isOnline,
                    })
                  }
                />
              ))}
              <NeumorphicButton
                testID={`mobile-tracker-bump-salary-${job.id}`}
                label="Edit Offer"
                variant="secondary"
                onPress={() =>
                  updateJobMutation.mutate({
                    jobId: job.id,
                    input: { salary: "$225k" },
                  })
                }
              />
              <NeumorphicButton
                testID={`mobile-tracker-delete-${job.id}`}
                label="Remove"
                variant="danger"
                onPress={() => deleteJobMutation.mutate(job.id)}
              />
            </div>
          </NeumorphicCard>
        ))}
      </div>
    </ScreenShell>
  );
}
