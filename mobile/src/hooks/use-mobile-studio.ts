import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  AtsScanHistoryItemDTO,
  atsScanHistoryItemSchema,
  AtsScanResultDTO,
  atsScanResultSchema,
  InterviewKitResponseDTO,
  interviewKitResponseSchema,
  VideoUploadCompleteDTO,
  videoUploadCompleteSchema,
} from "@/lib/schemas";
import { mobileApiClient } from "@/services/api-client";

const extractedCvFileSchema = z.object({
  extracted_text: z.string().default(""),
  extracted_skills: z.array(z.string()).default([]),
});

const UPLOAD_ID_PATTERN = /^upload_\d+_[a-zA-Z0-9]+$/;

export function createValidMobileUploadId(
  timestampSec = Math.floor(Date.now() / 1000),
  suffix = Math.random().toString(36).slice(2, 10)
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

export interface PitchVideoUploadParams {
  uploadId: string;
  username: string;
  /** Local file URI produced by expo-camera's recordAsync(). */
  fileUri: string;
  onProgress?: (percent: number) => void;
}

/** React Native's FormData accepts `{ uri, name, type }` file descriptors for multipart uploads. */
function nativeFilePart(uri: string, name: string, type: string): NativeFilePart {
  return { uri, name, type };
}

// ponytail: the recording is sent as a single chunk (total_chunks=1); split into byte ranges if long recordings hit gateway body limits.
export async function uploadMobilePitchVideo(params: PitchVideoUploadParams): Promise<VideoUploadCompleteDTO> {
  if (!UPLOAD_ID_PATTERN.test(params.uploadId)) {
    throw new Error("uploadId must match ^upload_\d+_[a-zA-Z0-9]+$ security pattern");
  }
  const filename = params.fileUri.split("/").pop() || "pitch.mp4";
  const form = new FormData();
  form.append("upload_id", params.uploadId);
  form.append("chunk_index", "0");
  form.append("total_chunks", "1");
  form.append("username", params.username);
  form.append("file", nativeFilePart(params.fileUri, filename, "video/mp4"));
  await mobileApiClient.post("/v1/media/upload/chunk", form);
  params.onProgress?.(100);

  const rawComplete = await mobileApiClient.post<unknown>("/v1/media/upload/complete", {
    upload_id: params.uploadId,
    total_chunks: 1,
    username: params.username,
    filename,
  });
  return videoUploadCompleteSchema.parse(rawComplete);
}

export async function extractMobileCvFile(file: {
  uri: string;
  name: string;
  mimeType?: string;
}): Promise<{ extracted_text: string; extracted_skills: string[] }> {
  const form = new FormData();
  form.append("file", nativeFilePart(file.uri, file.name, file.mimeType ?? "application/octet-stream"));
  const raw = await mobileApiClient.post<unknown>("/v1/match/extract-cv-file", form);
  return extractedCvFileSchema.parse(raw);
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

export function useMobilePitchUploadMutation() {
  return useMutation({
    mutationFn: uploadMobilePitchVideo,
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

export async function scanMobileCvAgainstJd(input: {
  cvText: string;
  jdText: string;
}): Promise<AtsScanResultDTO> {
  const raw = await mobileApiClient.post<unknown>("/v1/match/ats-scan", {
    cv_text: input.cvText.trim(),
    job_description: input.jdText.trim(),
  });
  return atsScanResultSchema.parse(raw);
}

export async function fetchMobileAtsScanHistory(): Promise<AtsScanHistoryItemDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/match/history");
  if (Array.isArray(raw)) {
    return z.array(atsScanHistoryItemSchema).parse(raw);
  }
  const wrapped = raw as { items?: unknown };
  return z.array(atsScanHistoryItemSchema).parse(wrapped.items ?? []);
}

export function useMobileAtsScanMutation() {
  return useMutation({
    mutationFn: scanMobileCvAgainstJd,
  });
}

export function useMobileAtsHistoryQuery() {
  return useQuery({
    queryKey: ["mobile", "studio", "ats-history"] as const,
    queryFn: fetchMobileAtsScanHistory,
    staleTime: 60_000,
  });
}
