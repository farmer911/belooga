import React, { useState } from "react";
import { ActionButton, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import { MobileJobStatus } from "@/lib/schemas";
import {
  flushMobileJobOfflineOutbox,
  useCreateMobileJobMutation,
  useMobileTrackedJobsQuery,
  useUpdateMobileJobStatusMutation,
} from "@/hooks/use-mobile-tracker";

const KANBAN_STAGES: readonly MobileJobStatus[] = [
  "TARGETING",
  "TAILORED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
] as const;

export default function MobileJobTrackerScreen() {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const jobsQuery = useMobileTrackedJobsQuery();
  const createMutation = useCreateMobileJobMutation();
  const statusMutation = useUpdateMobileJobStatusMutation();

  const handleAddJob = async () => {
    if (!company.trim() || !position.trim()) return;
    await createMutation.mutateAsync({
      company: company.trim(),
      position: position.trim(),
      status: "TARGETING",
      salary: "$180k",
      score: 85,
      notes: "",
    });
    setCompany("");
    setPosition("");
  };

  return (
    <ScreenShell testID="mobile-job-tracker-screen" mode="dark">
      <SurfaceCard testID="mobile-job-tracker-header" mode="dark">
        <h1 data-testid="mobile-tracker-title">Job Application Kanban Pipeline</h1>
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
        <input
          data-testid="mobile-tracker-company-input"
          value={company}
          placeholder="Company"
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          data-testid="mobile-tracker-position-input"
          value={position}
          placeholder="Position"
          onChange={(e) => setPosition(e.target.value)}
        />
        <ActionButton
          testID="mobile-tracker-add-job"
          label="Add Application"
          onPress={handleAddJob}
        />
      </SurfaceCard>

      <div data-testid="mobile-tracker-kanban-list">
        {(jobsQuery.data ?? []).map((job) => (
          <SurfaceCard key={job.id} testID={`mobile-tracker-card-${job.id}`} mode="dark">
            <h2 data-testid={`mobile-tracker-job-title-${job.id}`}>
              {job.position} @ {job.company}
            </h2>
            <span data-testid={`mobile-tracker-job-status-${job.id}`}>{job.status}</span>
            <div>
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
            </div>
          </SurfaceCard>
        ))}
      </div>
    </ScreenShell>
  );
}
