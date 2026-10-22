import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  applyMobileCareerJob,
  completeMobileExpertReviewEscrow,
  createMobileCareerJobPosting,
  createMobileSocialBlogPost,
  extractMobileCvFile,
  fetchMobileCareerJobs,
  fetchMobileSocialBlogPosts,
  fetchMobileWalletSummary,
  likeMobileSocialBlogPost,
  loadMobileProfileCvText,
  topUpMobileWallet,
  triggerMobileSalaryCrawl,
} from "../src/hooks/use-mobile-parity-part2";
import { fetchMobileSalaryBenchmark } from "../src/hooks/use-mobile-career-tools";
import { setMobileFetchTransportForTesting } from "../src/services/api-client";

const MOBILE_ROOT = join(import.meta.dir, "..");

describe("BEL-179 (#101): Mobile Parity Part 2 — Wallet & Escrow, ATS PDF/DOCX & Profile Loader, Salary 2024-2026 Crawler & Social/Careers", () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it("manages User Wallet balance, top-up (/v1/wallet/*), and 4-step Expert Review Escrow completion", async () => {
    const calls: Array<{ url: string; method: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method });

      if (url.endsWith("/v1/wallet/balance") && method === "GET") {
        return new Response(
          JSON.stringify({
            available_balance_vnd: 1500000,
            escrow_locked_vnd: 1475000,
            total_topup_vnd: 3000000,
            transactions: [
              {
                id: "tx_1",
                type: "TOPUP",
                amount_vnd: 500000,
                description: "MoMo QR Wallet Top-up",
                created_at: "2026-10-22T10:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/v1/wallet/topup") && method === "POST") {
        return new Response(
          JSON.stringify({
            available_balance_vnd: 2000000,
            escrow_locked_vnd: 1475000,
            total_topup_vnd: 3500000,
            status: "COMPLETED",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/expert-review/orders/ord_8841/complete") && method === "POST") {
        return new Response(
          JSON.stringify({
            order_id: "ord_8841",
            status: "COMPLETED",
            escrow_released_vnd: 1475000,
            sla_step: 4,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    }) as typeof fetch);

    const summary = await fetchMobileWalletSummary();
    expect(summary.available_balance_vnd).toBe(1500000);
    expect(summary.escrow_locked_vnd).toBe(1475000);
    expect(summary.transactions.length).toBe(1);

    const toppedUp = await topUpMobileWallet(500000);
    expect(toppedUp.available_balance_vnd).toBe(2000000);

    const escrowDone = await completeMobileExpertReviewEscrow("ord_8841");
    expect(escrowDone.status).toBe("COMPLETED");
    expect(escrowDone.sla_step).toBe(4);
  });

  it("extracts PDF/DOCX CV text (/v1/match/extract-cv-file), loads profile CV draft, and queries 2024-2026 salary crawler", async () => {
    const calls: Array<{ url: string; method: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method });

      if (url.endsWith("/v1/match/extract-cv-file") && method === "POST") {
        return new Response(
          JSON.stringify({
            filename: "alex_cv.pdf",
            extracted_text: "Alex Nguyen — Staff Distributed Engineer (Golang, Python, PostgreSQL 16)",
            char_count: 74,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/profile/alexnguyen/cv-draft/")) {
        return new Response(
          JSON.stringify({
            template_id: "executive-dark",
            summary: "Principal Distributed Engineer with 10 yrs exp",
            skills: ["Golang", "Python", "PostgreSQL 16"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/catalogs/salary-benchmark/crawl") && method === "POST") {
        return new Response(
          JSON.stringify({
            status: "CRAWLED",
            sources_synced: 4,
            years_covered: ["2024", "2025", "2026"],
            records_ingested: 1280,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/catalogs/salary-benchmark")) {
        return new Response(
          JSON.stringify({
            role: "Staff Backend Engineer",
            location: "Ho Chi Minh City",
            year: "2024",
            p25: 132000,
            p50: 168000,
            p75: 205000,
            p90: 225000,
            currency: "USD",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    }) as typeof fetch);

    const extracted = await extractMobileCvFile({
      filename: "alex_cv.pdf",
      contentBase64: "JVBERi0xLjQK",
    });
    expect(extracted.filename).toBe("alex_cv.pdf");
    expect(extracted.extracted_text).toContain("PostgreSQL 16");

    const profileCvText = await loadMobileProfileCvText("alexnguyen");
    expect(profileCvText).toContain("Principal Distributed Engineer");
    expect(profileCvText).toContain("Golang");

    const salary2024 = await fetchMobileSalaryBenchmark(
      "Staff Backend Engineer",
      "Ho Chi Minh City",
      "2024"
    );
    expect(salary2024.p50).toBe(168000);
    expect(calls.some((c) => c.url.includes("year=2024"))).toBe(true);

    const crawlRes = await triggerMobileSalaryCrawl("Staff Backend Engineer");
    expect(crawlRes.status).toBe("CRAWLED");
    expect(crawlRes.years_covered).toContain("2024");
  });

  it("supports Community Social Blog (/v1/blog/posts) and Multi-Company Careers (/v1/career/jobs/*)", async () => {
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if ((url.endsWith("/v1/blog/posts/") || url.endsWith("/v1/blog/posts")) && method === "GET") {
        return new Response(
          JSON.stringify([
            {
              id: "post_1",
              author_username: "alexnguyen",
              title: "How we tuned PG16 GIN to 12ms",
              content: "Bounded CTEs + L1/L2 cache.",
              likes_count: 14,
              comments_count: 3,
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if ((url.endsWith("/v1/blog/posts/") || url.endsWith("/v1/blog/posts")) && method === "POST") {
        return new Response(
          JSON.stringify({
            id: "post_2",
            author_username: "alexnguyen",
            title: "Passed Stripe System Design",
            content: "Used Belooga ATS & Teleprompter.",
            likes_count: 1,
            comments_count: 0,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/blog/posts/post_2/like") && method === "POST") {
        return new Response(
          JSON.stringify({ id: "post_2", likes_count: 2 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/v1/career/jobs/") && method === "GET") {
        return new Response(
          JSON.stringify([
            {
              id: "cjob_1",
              company_name: "Databricks",
              title: "Staff Systems Engineer",
              location: "Remote APAC",
              salary_range: "$190k - $230k",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/v1/career/jobs/") && method === "POST") {
        return new Response(
          JSON.stringify({
            id: "cjob_2",
            company_name: "Figma",
            title: "Principal Mobile Engineer",
            location: "Singapore",
            salary_range: "$210k - $250k",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/career/jobs/cjob_1/apply/") && method === "POST") {
        return new Response(
          JSON.stringify({ job_id: "cjob_1", status: "APPLIED" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    }) as typeof fetch);

    const posts = await fetchMobileSocialBlogPosts();
    expect(posts.length).toBe(1);

    const createdPost = await createMobileSocialBlogPost({
      title: "Passed Stripe System Design",
      content: "Used Belooga ATS & Teleprompter.",
    });
    expect(createdPost.id).toBe("post_2");

    const liked = await likeMobileSocialBlogPost("post_2");
    expect(liked.likes_count).toBe(2);

    const jobs = await fetchMobileCareerJobs();
    expect(jobs[0]?.company_name).toBe("Databricks");

    const postedJob = await createMobileCareerJobPosting({
      company_name: "Figma",
      title: "Principal Mobile Engineer",
      location: "Singapore",
      salary_range: "$210k - $250k",
    });
    expect(postedJob.id).toBe("cjob_2");

    const applied = await applyMobileCareerJob("cjob_1");
    expect(applied.status).toBe("APPLIED");
  });

  it("enforces Design Spec #99 (10:1003 & 10:1004) accessibilityLabel and content-desc contracts across Expo and Android Native", () => {
    const careerTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/career.tsx"), "utf-8");
    const studioTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/studio.tsx"), "utf-8");
    const mainJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/MainActivity.java"),
      "utf-8"
    );
    const careerJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java"),
      "utf-8"
    );

    expect(mainJava).toContain("mobile-wallet-balance-pill");
    expect(careerTsx).toContain("mobile-wallet-balance-pill");

    for (const token of [
      "mobile-wallet-topup-chip-",
      "mobile-wallet-topup-submit-btn",
      "mobile-view-expert-report-btn",
      "mobile-apply-expert-fixes-btn",
      "mobile-release-escrow-btn",
      "mobile-salary-year-",
      "mobile-trigger-salary-crawl-btn",
      "mobile-social-post-input",
      "mobile-social-post-submit-btn",
      "mobile-careers-post-job-btn",
      "mobile-careers-apply-btn-",
    ]) {
      expect(careerTsx).toContain(token);
      expect(careerJava).toContain(token);
    }

    for (const token of ["mobile-ats-upload-file-btn", "mobile-ats-load-profile-btn"]) {
      expect(studioTsx).toContain(token);
      expect(careerJava).toContain(token);
    }
  });
});
