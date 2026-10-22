import React, { useState } from "react";
import { ActionButton, BadgePill, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import { MobileJobStatus } from "@/lib/schemas";
import {
  flushMobileJobOfflineOutbox,
  useCreateMobileJobMutation,
  useDeleteMobileJobMutation,
  useMobileJobPipelineAnalyticsQuery,
  useMobileTrackedJobsQuery,
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

export default function MobileJobTrackerScreen() {
  const tokens = getSemanticTokens("dark");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const jobsQuery = useMobileTrackedJobsQuery();
  const analyticsQuery = useMobileJobPipelineAnalyticsQuery();
  const createMutation = useCreateMobileJobMutation();
  const statusMutation = useUpdateMobileJobStatusMutation();
  const updateJobMutation = useUpdateMobileJobMutation();
  const deleteJobMutation = useDeleteMobileJobMutation();

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

  const analytics = analyticsQuery.data;

  return (
    <ScreenShell testID="mobile-job-tracker-screen" mode="dark">
      <SurfaceCard testID="mobile-job-tracker-header" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BadgePill label="CANDIDATE CRM • OFFLINE VAULT" tone="brand" />
          <ActionButton
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            data-testid="mobile-tracker-company-input"
            value={company}
            placeholder="Company (e.g. Stripe)"
            onChange={(e) => setCompany(e.target.value)}
            style={{
              backgroundColor: tokens.surface.elevated,
              color: tokens.typography.main,
              border: `1px solid ${tokens.surface.border}`,
              borderRadius: 12,
              padding: "10px 12px",
            }}
          />
          <input
            data-testid="mobile-tracker-position-input"
            value={position}
            placeholder="Role (e.g. Staff Mobile)"
            onChange={(e) => setPosition(e.target.value)}
            style={{
              backgroundColor: tokens.surface.elevated,
              color: tokens.typography.main,
              border: `1px solid ${tokens.surface.border}`,
              borderRadius: 12,
              padding: "10px 12px",
            }}
          />
        </div>
        <ActionButton
          testID="mobile-tracker-add-job"
          label="Add Application to Pipeline"
          onPress={handleAddJob}
        />
      </SurfaceCard>

      <div data-testid="mobile-tracker-kanban-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(jobsQuery.data ?? []).map((job) => (
          <SurfaceCard key={job.id} testID={`mobile-tracker-card-${job.id}`} mode="dark">
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
                <ActionButton
                  key={stage}
                  testID={`mobile-tracker-move-${job.id}-${stage}`}
                  label={stage}
                  variant={job.status === stage ? "primary" : "secondary"}
                  onPress={() =>
                    statusMutation.mutate({
                      jobId: job.id,
                      status: stage,
                      isOnline,
                    })
                  }
                />
              ))}
              <ActionButton
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
              <ActionButton
                testID={`mobile-tracker-delete-${job.id}`}
                label="Remove"
                variant="danger"
                onPress={() => deleteJobMutation.mutate(job.id)}
              />
            </div>
          </SurfaceCard>
        ))}
      </div>
    </ScreenShell>
  );
}
