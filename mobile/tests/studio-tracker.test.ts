import { beforeEach, describe, expect, it } from "bun:test";
import { clearSecureVaultForTesting } from "@/lib/native-runtime";
import { setMobileFetchTransportForTesting } from "@/services/api-client";
import {
  createValidMobileUploadId,
  fetchMobileAtsScanHistory,
  generateMobileTeleprompterScript,
  scanMobileCvAgainstJd,
  uploadMobilePitchVideoInChunks,
} from "@/hooks/use-mobile-studio";
import {
  createMobileTrackedJob,
  fetchMobileJobPipelineAnalytics,
  fetchMobileTrackedJobs,
  flushMobileJobOfflineOutbox,
  getQueuedMobileJobMutationsCount,
  queueOrSyncMobileJobStatus,
  updateMobileTrackedJob,
} from "@/hooks/use-mobile-tracker";
import {
  createMobileMomoPaymentQr,
  fetchMobileCvDraft,
  fetchMobileExecutiveAnalytics,
  fetchMobileExpertPackages,
  fetchMobileSalaryBenchmark,
  generateMobileTalentShortlist,
  saveMobileCvDraft,
} from "@/hooks/use-mobile-career-tools";

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

  it("supports ATS CV-to-JD scanning, scan history, full job PATCH updates, and pipeline analytics (BEL-140)", async () => {
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/match/ats-scan") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            match_score: 94,
            matched_keywords: ["FastAPI", "PostgreSQL 16", "React Native"],
            missing_keywords: ["GraphQL"],
            summary: "Strong distributed systems and mobile architecture alignment.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/match/history")) {
        return new Response(
          JSON.stringify([
            {
              id: "scan_01",
              job_title: "Staff Mobile Engineer",
              company: "Stripe",
              match_score: 94,
              created_at: "2026-10-22T10:00:00Z",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/tracker/jobs/analytics")) {
        return new Response(
          JSON.stringify({
            total_applications: 12,
            interview_rate: 33.3,
            average_ats_score: 92,
            by_status: { TARGETING: 3, TAILORED: 2, APPLIED: 3, INTERVIEW: 3, OFFER: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/tracker/jobs/job_101") && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            id: "job_101",
            company: body.company ?? "Stripe",
            position: body.position ?? "Staff Mobile Engineer",
            status: body.status ?? "INTERVIEW",
            salary: body.salary ?? "$225k",
            score: 95,
            notes: body.notes ?? "Updated notes",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const scan = await scanMobileCvAgainstJd({
      cvText: "Principal Engineer with FastAPI, PostgreSQL 16, React Native",
      jdText: "Looking for Staff Engineer with FastAPI, PostgreSQL 16, React Native, GraphQL",
    });
    expect(scan.match_score).toBe(94);
    expect(scan.matched_keywords).toContain("PostgreSQL 16");

    const history = await fetchMobileAtsScanHistory();
    expect(history.length).toBe(1);
    expect(history[0]?.company).toBe("Stripe");

    const analytics = await fetchMobileJobPipelineAnalytics();
    expect(analytics.total_applications).toBe(12);
    expect(analytics.average_ats_score).toBe(92);

    const updatedJob = await updateMobileTrackedJob("job_101", {
      company: "Stripe",
      position: "Principal Mobile Architect",
      status: "INTERVIEW",
      salary: "$225k",
      score: 95,
      notes: "Final round scheduled",
    });
    expect(updatedJob.position).toBe("Principal Mobile Architect");
    expect(updatedJob.salary).toBe("$225k");
  });

  it("integrates Expert CV Review, MoMo QR checkout, Salary Benchmark, CV Studio Drafts, AI Shortlist, and Executive BI on Mobile (BEL-141)", async () => {
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/expert-review/packages/")) {
        return new Response(
          JSON.stringify([
            { id: "pkg_staff", name: "Senior Staff Review", price_usd: 59, turnaround_hours: 24 },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/payments/momo/create-qr") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            order_id: "momo_ord_99",
            qr_code_url: "https://test-payment.momo.vn/qr/momo_ord_99",
            amount_vnd: 1475000,
            status: "PENDING",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/catalogs/salary-benchmark")) {
        return new Response(
          JSON.stringify({
            role: "Staff Backend Engineer",
            location: "Ho Chi Minh City",
            p25: 145000,
            p50: 185000,
            p75: 215000,
            p90: 245000,
            currency: "USD",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/profile/alexnguyen/cv-draft/")) {
        if (init?.method === "PUT") {
          return new Response(
            JSON.stringify({ status: "saved", template_id: "executive-dark" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            template_id: "executive-dark",
            summary: "Principal Distributed Systems Architect",
            skills: ["Python", "FastAPI", "PostgreSQL 16"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/match/talent-shortlist") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            role: "Staff Mobile Engineer",
            candidates: [{ username: "alexnguyen", match_score: 96, headline: "Principal Engineer" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/analytics/dashboard")) {
        return new Response(
          JSON.stringify({
            total_gmv_usd: 48250,
            momo_conversion_rate: 68.4,
            search_p95_ms: 12.4,
            active_candidates: 500000,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const pkgs = await fetchMobileExpertPackages();
    expect(pkgs[0]?.name).toBe("Senior Staff Review");

    const momo = await createMobileMomoPaymentQr({ packageId: "pkg_staff", amountVnd: 1475000 });
    expect(momo.order_id).toBe("momo_ord_99");

    const salary = await fetchMobileSalaryBenchmark("Staff Backend Engineer", "Ho Chi Minh City");
    expect(salary.p50).toBe(185000);

    const draft = await fetchMobileCvDraft("alexnguyen");
    expect(draft.template_id).toBe("executive-dark");

    const saved = await saveMobileCvDraft("alexnguyen", {
      template_id: "executive-dark",
      summary: "Updated Summary",
      skills: ["Python", "FastAPI"],
    });
    expect(saved.status).toBe("saved");

    const shortlist = await generateMobileTalentShortlist("Staff Mobile Engineer");
    expect(shortlist.candidates[0]?.username).toBe("alexnguyen");

    const bi = await fetchMobileExecutiveAnalytics();
    expect(bi.total_gmv_usd).toBe(48250);
  });
});
