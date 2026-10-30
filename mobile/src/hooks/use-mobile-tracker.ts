import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  AiJobMatchResponseDTO,
  aiJobMatchResponseSchema,
  CareerGoalDTO,
  careerGoalSchema,
  CreateTrackedJobInput,
  createTrackedJobSchema,
  JobPipelineAnalyticsDTO,
  jobPipelineAnalyticsSchema,
  jobStatusEnum,
  MobileJobStatus,
  SaveCareerGoalInput,
  saveCareerGoalInputSchema,
  TrackedJobItemDTO,
  trackedJobItemSchema,
} from "@/lib/schemas";
import * as SecureStore from "expo-secure-store";
import { mobileApiClient } from "@/services/api-client";

export const MOBILE_TRACKER_OUTBOX_KEY = "belooga.mobile.tracker_offline_outbox";
export const MOBILE_CAREER_GOAL_VAULT_KEY = "belooga.mobile.tracker_career_goal_vault";
export const MOBILE_TRACKED_JOBS_QUERY_KEY = ["mobile", "tracker", "jobs"] as const;
export const MOBILE_CAREER_GOALS_QUERY_KEY = ["mobile", "tracker", "goals"] as const;

export interface QueuedJobStatusMutation {
  jobId: string;
  status: MobileJobStatus;
  queuedAt: number;
}

// ponytail: outbox lives in SecureStore (values ~2KB recommended); move to SQLite/AsyncStorage if queues grow past ~20 items.
async function readOfflineOutbox(): Promise<QueuedJobStatusMutation[]> {
  const raw = await SecureStore.getItemAsync(MOBILE_TRACKER_OUTBOX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedJobStatusMutation[];
  } catch {
    return [];
  }
}

async function writeOfflineOutbox(items: QueuedJobStatusMutation[]): Promise<void> {
  if (items.length === 0) {
    await SecureStore.deleteItemAsync(MOBILE_TRACKER_OUTBOX_KEY);
    return;
  }
  await SecureStore.setItemAsync(MOBILE_TRACKER_OUTBOX_KEY, JSON.stringify(items));
}

export async function getQueuedMobileJobMutationsCount(): Promise<number> {
  const items = await readOfflineOutbox();
  return items.length;
}

export async function fetchMobileTrackedJobs(): Promise<TrackedJobItemDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/tracker/jobs/");
  return z.array(trackedJobItemSchema).parse(raw);
}

export async function createMobileTrackedJob(
  input: CreateTrackedJobInput
): Promise<TrackedJobItemDTO> {
  const validated = createTrackedJobSchema.parse(input);
  const raw = await mobileApiClient.post<unknown>("/v1/tracker/jobs/", validated);
  return trackedJobItemSchema.parse(raw);
}

export async function updateMobileJobStatus(
  jobId: string,
  status: MobileJobStatus
): Promise<{ id: string; status: MobileJobStatus }> {
  const validatedStatus = jobStatusEnum.parse(status);
  return mobileApiClient.patch<{ id: string; status: MobileJobStatus }>(
    `/v1/tracker/jobs/${encodeURIComponent(jobId)}/status`,
    { status: validatedStatus }
  );
}

export async function deleteMobileTrackedJob(jobId: string): Promise<void> {
  await mobileApiClient.delete<Record<string, unknown>>(
    `/v1/tracker/jobs/${encodeURIComponent(jobId)}`
  );
}

export async function updateMobileTrackedJob(
  jobId: string,
  input: Partial<CreateTrackedJobInput>
): Promise<TrackedJobItemDTO> {
  const raw = await mobileApiClient.patch<unknown>(
    `/v1/tracker/jobs/${encodeURIComponent(jobId)}`,
    input
  );
  return trackedJobItemSchema.parse(raw);
}

export async function fetchMobileJobPipelineAnalytics(): Promise<JobPipelineAnalyticsDTO> {
  const raw = await mobileApiClient.get<unknown>("/v1/tracker/jobs/analytics");
  return jobPipelineAnalyticsSchema.parse(raw);
}

export async function queueOrSyncMobileJobStatus(
  jobId: string,
  status: MobileJobStatus,
  isOnline = true
): Promise<{ queuedOffline: boolean }> {
  const validatedStatus = jobStatusEnum.parse(status);
  if (!isOnline) {
    const outbox = await readOfflineOutbox();
    outbox.push({ jobId, status: validatedStatus, queuedAt: Date.now() });
    await writeOfflineOutbox(outbox);
    return { queuedOffline: true };
  }

  await updateMobileJobStatus(jobId, validatedStatus);
  return { queuedOffline: false };
}

export async function flushMobileJobOfflineOutbox(): Promise<number> {
  const outbox = await readOfflineOutbox();
  if (outbox.length === 0) return 0;

  let flushed = 0;
  const remaining: QueuedJobStatusMutation[] = [];

  for (const item of outbox) {
    try {
      await updateMobileJobStatus(item.jobId, item.status);
      flushed += 1;
    } catch {
      remaining.push(item);
    }
  }

  await writeOfflineOutbox(remaining);
  return flushed;
}

export function useMobileTrackedJobsQuery() {
  return useQuery({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY, queryFn: fetchMobileTrackedJobs, staleTime: 30_000 });
}

export function useCreateMobileJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMobileTrackedJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY }),
  });
}

export function useUpdateMobileJobStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, status, isOnline = true }: { jobId: string; status: MobileJobStatus; isOnline?: boolean }) =>
      queueOrSyncMobileJobStatus(jobId, status, isOnline),
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY }),
  });
}

export function useUpdateMobileJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, input }: { jobId: string; input: Partial<CreateTrackedJobInput> }) =>
      updateMobileTrackedJob(jobId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY }),
  });
}

export function useDeleteMobileJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMobileTrackedJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY }),
  });
}

export function useMobileJobPipelineAnalyticsQuery() {
  return useQuery({ queryKey: ["mobile", "tracker", "analytics"] as const, queryFn: fetchMobileJobPipelineAnalytics, staleTime: 30_000 });
}

export function filterMobileTrackedJobs(
  jobs: TrackedJobItemDTO[],
  searchQuery = "",
  stageFilter = "ALL"
): TrackedJobItemDTO[] {
  const cleanQuery = searchQuery.trim().toLowerCase();
  const normalizedStage = stageFilter.trim().toUpperCase();
  return jobs.filter((job) => {
    if (normalizedStage && normalizedStage !== "ALL") {
      const mappedStage = normalizedStage === "SAVED" ? "TARGETING" : normalizedStage;
      if (job.status !== normalizedStage && job.status !== mappedStage) {
        return false;
      }
    }
    if (!cleanQuery) return true;
    return (
      job.company.toLowerCase().includes(cleanQuery) ||
      job.position.toLowerCase().includes(cleanQuery) ||
      job.notes.toLowerCase().includes(cleanQuery)
    );
  });
}

export async function fetchMobileCareerGoals(): Promise<CareerGoalDTO[]> {
  try {
    const raw = await mobileApiClient.get<unknown>("/v1/tracker/goals");
    const items = Array.isArray(raw)
      ? z.array(careerGoalSchema).parse(raw)
      : z.array(careerGoalSchema).parse((raw as { items?: unknown }).items ?? []);
    if (items.length > 0) {
      await SecureStore.setItemAsync(MOBILE_CAREER_GOAL_VAULT_KEY, JSON.stringify(items));
    }
    return items;
  } catch {
    const cached = await SecureStore.getItemAsync(MOBILE_CAREER_GOAL_VAULT_KEY);
    if (!cached) return [];
    try {
      return z.array(careerGoalSchema).parse(JSON.parse(cached));
    } catch {
      return [];
    }
  }
}

export async function saveMobileCareerGoal(
  input: SaveCareerGoalInput
): Promise<CareerGoalDTO> {
  const validated = saveCareerGoalInputSchema.parse(input);
  const raw = await mobileApiClient.post<unknown>("/v1/tracker/goals", validated);
  const saved = careerGoalSchema.parse(raw);
  await SecureStore.setItemAsync(MOBILE_CAREER_GOAL_VAULT_KEY, JSON.stringify([saved]));
  return saved;
}

export async function triggerMobileAiJobMatch(
  goalId: string,
  paymentMethod: "WALLET" | "MOMO" = "WALLET"
): Promise<AiJobMatchResponseDTO> {
  const cleanId = goalId.trim();
  if (!cleanId) {
    throw new Error("Career Goal ID is required for AI Job Matching");
  }
  const raw = await mobileApiClient.post<unknown>(
    `/v1/tracker/goals/${encodeURIComponent(cleanId)}/ai-match`,
    { payment_method: paymentMethod }
  );
  return aiJobMatchResponseSchema.parse(raw);
}

export function useMobileCareerGoalsQuery() {
  return useQuery({
    queryKey: MOBILE_CAREER_GOALS_QUERY_KEY,
    queryFn: fetchMobileCareerGoals,
    staleTime: 60_000,
  });
}

export function useSaveMobileCareerGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMobileCareerGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_CAREER_GOALS_QUERY_KEY });
    },
  });
}

export function useTriggerMobileAiJobMatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      goalId,
      paymentMethod = "WALLET",
    }: {
      goalId: string;
      paymentMethod?: "WALLET" | "MOMO";
    }) => triggerMobileAiJobMatch(goalId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY });
    },
  });
}

