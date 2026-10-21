import { beforeEach, describe, expect, it } from "bun:test";
import { clearSecureVaultForTesting } from "@/lib/native-runtime";
import { setMobileFetchTransportForTesting } from "@/services/api-client";
import {
  createValidMobileUploadId,
  generateMobileTeleprompterScript,
  uploadMobilePitchVideoInChunks,
} from "@/hooks/use-mobile-studio";
import {
  createMobileTrackedJob,
  fetchMobileTrackedJobs,
  flushMobileJobOfflineOutbox,
  getQueuedMobileJobMutationsCount,
  queueOrSyncMobileJobStatus,
} from "@/hooks/use-mobile-tracker";

describe("Belooga Mobile Native Video Pitch Studio & Job Kanban Tracker (BEL-134)", () => {
  beforeEach(() => {
    clearSecureVaultForTesting();
    setMobileFetchTransportForTesting(null);
  });

  it("generates AI teleprompter script via /v1/match/interview-kit and uploads video pitch in validated chunks", async () => {
    const uploadedChunks: number[] = [];
    let completedUploadId = "";

    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/match/interview-kit")) {
        return new Response(
          JSON.stringify({
            elevator_pitch_script: "Hi, I am Alex, a Staff Distributed Systems Engineer with 10 years of experience.",
            questions: [
              { question: "How did you bound GIN CTE scans?", tip: "Mention LIMIT 250 and keyset cursors." },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/v1/media/upload/chunk")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          upload_id: string;
          chunk_index: number;
          total_chunks: number;
        };
        expect(/^upload_\d+_[a-zA-Z0-9]+$/.test(body.upload_id)).toBe(true);
        uploadedChunks.push(body.chunk_index);
        return new Response(
          JSON.stringify({ status: "chunk_received", chunk_index: body.chunk_index }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/v1/media/upload/complete")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          upload_id: string;
          total_chunks: number;
        };
        completedUploadId = body.upload_id;
        return new Response(
          JSON.stringify({
            status: "completed",
            video_url: `/uploads/videos/${body.upload_id}.mp4`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const kit = await generateMobileTeleprompterScript({
      targetRole: "Staff Backend Engineer",
      jobDescription: "Distributed PostgreSQL 16 and FastAPI systems.",
    });
    expect(kit.elevator_pitch_script).toContain("Staff Distributed Systems Engineer");
    expect(kit.questions.length).toBe(1);

    const uploadId = createValidMobileUploadId(1729500000, "alex99");
    expect(/^upload_\d+_[a-zA-Z0-9]+$/.test(uploadId)).toBe(true);

    const progressHistory: number[] = [];
    const result = await uploadMobilePitchVideoInChunks({
      uploadId,
      chunksBase64: ["chunk_part_0", "chunk_part_1", "chunk_part_2"],
      onProgress: (pct) => progressHistory.push(pct),
    });

    expect(uploadedChunks).toEqual([0, 1, 2]);
    expect(progressHistory).toEqual([33, 67, 100]);
    expect(completedUploadId).toBe(uploadId);
    expect(result.video_url).toContain(uploadId);
  });

  it("manages Job Kanban CRUD and queues status updates in SecureStore outbox when offline", async () => {
    const syncedStatuses: Array<{ jobId: string; status: string }> = [];

    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/tracker/jobs/") && (!init?.method || init.method === "GET")) {
        return new Response(
          JSON.stringify([
            {
              id: "job_101",
              company: "Stripe",
              position: "Staff Mobile Engineer",
              status: "APPLIED",
              salary: "$210k",
              score: 92,
              notes: "Referral from team lead",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/tracker/jobs/") && init?.method === "POST") {
        const body = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            id: "job_102",
            ...body,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/tracker/jobs/") && url.endsWith("/status") && init?.method === "PATCH") {
        const parts = url.split("/");
        const jobId = parts[parts.length - 2] ?? "";
        const body = JSON.parse(String(init.body ?? "{}")) as { status: string };
        syncedStatuses.push({ jobId, status: body.status });
        return new Response(
          JSON.stringify({ id: jobId, status: body.status }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const list = await fetchMobileTrackedJobs();
    expect(list.length).toBe(1);
    expect(list[0]?.company).toBe("Stripe");

    const created = await createMobileTrackedJob({
      company: "Linear",
      position: "Product Engineer",
      status: "TARGETING",
      salary: "$195k",
      score: 88,
      notes: "High priority",
    });
    expect(created.id).toBe("job_102");

    // Simulate offline status transition: queues in SecureStore outbox without firing HTTP request
    const offlineRes = await queueOrSyncMobileJobStatus("job_101", "INTERVIEW", false);
    expect(offlineRes.queuedOffline).toBe(true);
    expect(await getQueuedMobileJobMutationsCount()).toBe(1);
    expect(syncedStatuses.length).toBe(0);

    // Reconnect and flush outbox
    const flushedCount = await flushMobileJobOfflineOutbox();
    expect(flushedCount).toBe(1);
    expect(await getQueuedMobileJobMutationsCount()).toBe(0);
    expect(syncedStatuses).toEqual([{ jobId: "job_101", status: "INTERVIEW" }]);
  });
});
