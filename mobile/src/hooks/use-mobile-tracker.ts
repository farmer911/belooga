import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  CreateTrackedJobInput,
  createTrackedJobSchema,
  JobPipelineAnalyticsDTO,
  jobPipelineAnalyticsSchema,
  jobStatusEnum,
  MobileJobStatus,
  TrackedJobItemDTO,
  trackedJobItemSchema,
} from "@/lib/schemas";
import { SecureStore } from "@/lib/native-runtime";
import { mobileApiClient } from "@/services/api-client";

export const MOBILE_TRACKER_OUTBOX_KEY = "belooga.mobile.tracker_offline_outbox";
export const MOBILE_TRACKED_JOBS_QUERY_KEY = ["mobile", "tracker", "jobs"] as const;

export interface QueuedJobStatusMutation {
  jobId: string;
  status: MobileJobStatus;
  queuedAt: number;
}

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
  return useQuery({
    queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY,
    queryFn: fetchMobileTrackedJobs,
    staleTime: 30_000,
  });
}

export function useCreateMobileJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMobileTrackedJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY });
    },
  });
}

export function useUpdateMobileJobStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      status,
      isOnline = true,
    }: {
      jobId: string;
      status: MobileJobStatus;
      isOnline?: boolean;
    }) => queueOrSyncMobileJobStatus(jobId, status, isOnline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY });
    },
  });
}

export function useUpdateMobileJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      input,
    }: {
      jobId: string;
      input: Partial<CreateTrackedJobInput>;
    }) => updateMobileTrackedJob(jobId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY });
    },
  });
}

export function useDeleteMobileJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMobileTrackedJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_TRACKED_JOBS_QUERY_KEY });
    },
  });
}

export function useMobileJobPipelineAnalyticsQuery() {
  return useQuery({
    queryKey: ["mobile", "tracker", "analytics"] as const,
    queryFn: fetchMobileJobPipelineAnalytics,
    staleTime: 30_000,
  });
}
