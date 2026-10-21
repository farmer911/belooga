import { useMutation, useQuery } from "@tanstack/react-query";
import {
  InterviewKitResponseDTO,
  interviewKitResponseSchema,
  VideoUploadCompleteDTO,
  videoUploadCompleteSchema,
} from "@/lib/schemas";
import { mobileApiClient } from "@/services/api-client";

const UPLOAD_ID_PATTERN = /^upload_\d+_[a-zA-Z0-9]+$/;

export function createValidMobileUploadId(
  timestampSec = Math.floor(Date.now() / 1000),
  suffix = "m0b1le"
): string {
  const cleanSuffix = suffix.replace(/[^a-zA-Z0-9]/g, "") || "pitch";
  const uploadId = `upload_${Math.abs(Math.trunc(timestampSec))}_${cleanSuffix}`;
  if (!UPLOAD_ID_PATTERN.test(uploadId)) {
    throw new Error(`Invalid upload_id format: ${uploadId}`);
  }
  return uploadId;
}

export interface TeleprompterInput {
  targetRole: string;
  jobDescription: string;
}

export async function generateMobileTeleprompterScript(
  input: TeleprompterInput
): Promise<InterviewKitResponseDTO> {
  const raw = await mobileApiClient.post<unknown>("/v1/match/interview-kit", {
    target_role: input.targetRole.trim(),
    job_description: input.jobDescription.trim(),
  });
  return interviewKitResponseSchema.parse(raw);
}

export interface ChunkedVideoUploadParams {
  uploadId: string;
  chunksBase64: string[];
  onProgress?: (percent: number) => void;
}

export async function uploadMobilePitchVideoInChunks(
  params: ChunkedVideoUploadParams
): Promise<VideoUploadCompleteDTO> {
  if (!UPLOAD_ID_PATTERN.test(params.uploadId)) {
    throw new Error("uploadId must match ^upload_\\d+_[a-zA-Z0-9]+$ security pattern");
  }
  const totalChunks = params.chunksBase64.length;
  if (totalChunks === 0) {
    throw new Error("At least one video chunk is required");
  }

  for (let index = 0; index < totalChunks; index += 1) {
    await mobileApiClient.post("/v1/media/upload/chunk", {
      upload_id: params.uploadId,
      chunk_index: index,
      total_chunks: totalChunks,
      chunk_data: params.chunksBase64[index],
    });
    if (params.onProgress) {
      params.onProgress(Math.round(((index + 1) / totalChunks) * 100));
    }
  }

  const rawComplete = await mobileApiClient.post<unknown>("/v1/media/upload/complete", {
    upload_id: params.uploadId,
    total_chunks: totalChunks,
  });
  return videoUploadCompleteSchema.parse(rawComplete);
}

export async function fetchMobileVideoTranscodingStatus(
  username: string
): Promise<{ status: string; video_url?: string | null }> {
  return mobileApiClient.get<{ status: string; video_url?: string | null }>(
    `/v1/profile/${encodeURIComponent(username.trim())}/video-status/`
  );
}

export function useMobileTeleprompterMutation() {
  return useMutation({
    mutationFn: generateMobileTeleprompterScript,
  });
}

export function useMobileChunkUploadMutation() {
  return useMutation({
    mutationFn: uploadMobilePitchVideoInChunks,
  });
}

export function useMobileVideoStatusQuery(username: string) {
  return useQuery({
    queryKey: ["mobile", "studio", "video-status", username] as const,
    queryFn: () => fetchMobileVideoTranscodingStatus(username),
    enabled: Boolean(username.trim()),
    refetchInterval: 5_000,
  });
}
