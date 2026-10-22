import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  computeCandidateSkillMatch,
  createMobileCustomSkill,
  fetchMobileSkillCatalog,
  searchMobileCandidates,
} from "../src/hooks/use-mobile-discovery";
import {
  fetchMobileCareerGoals,
  filterMobileTrackedJobs,
  saveMobileCareerGoal,
  triggerMobileAiJobMatch,
} from "../src/hooks/use-mobile-tracker";
import { resolveNotificationSpotlightTarget } from "../src/hooks/use-mobile-auth";
import { setMobileFetchTransportForTesting } from "../src/services/api-client";
import { useMobileAuthStore } from "../src/store/auth-store";

const MOBILE_ROOT = join(import.meta.dir, "..");

describe("BEL-178 (#100): Mobile Parity Part 1 — Multi-Skill Search, Tracker Career Goal & Rich Notification Spotlight", () => {
  beforeEach(async () => {
    await useMobileAuthStore.getState().clearSession();
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it("fetches skill catalog, creates custom skills via POST /v1/catalogs/skills, and computes skill match counts", async () => {
    const calls: Array<{ url: string; method: string; body?: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const body = typeof init?.body === "string" ? init.body : undefined;
      calls.push({ url, method, body });

      if (url.includes("/v1/catalogs/skills") && method === "GET") {
        return new Response(
          JSON.stringify({
            items: [
              { id: "sk_1", name: "Golang", category: "Backend" },
              { id: "sk_2", name: "Python", category: "Backend" },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/catalogs/skills") && method === "POST") {
        const parsed = JSON.parse(body ?? "{}") as { name: string };
        return new Response(
          JSON.stringify({
            id: "sk_custom_1",
            name: parsed.name,
            category: "Custom",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/profile/search/")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                username: "alexnguyen",
                first_name: "Alex",
                last_name: "Nguyen",
                headline: "Principal Systems Engineer",
                location: "Ho Chi Minh City",
                skills: ["Golang", "Python", "PostgreSQL"],
                trust_score: 96,
              },
            ],
            total: 1,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    }) as typeof fetch);

    const skills = await fetchMobileSkillCatalog();
    expect(skills.length).toBe(2);
    expect(skills[0]?.name).toBe("Golang");

    const created = await createMobileCustomSkill("Rust Async");
    expect(created.name).toBe("Rust Async");
    expect(calls[1]?.method).toBe("POST");
    expect(calls[1]?.url).toContain("/v1/catalogs/skills");

    const searchRes = await searchMobileCandidates({
      q: "Backend",
      skills: ["Golang", "Python"],
    });
    expect(searchRes.items.length).toBe(1);
    expect(calls[2]?.url).toContain("skills=Golang%2CPython");

    const match = computeCandidateSkillMatch(
      ["Golang", "Python", "PostgreSQL"],
      ["golang", "Kubernetes"]
    );
    expect(match.matchedCount).toBe(1);
    expect(match.totalSelected).toBe(2);
    expect(match.label).toBe("Khớp 1/2 kỹ năng");
  });

  it("persists career goals (/v1/tracker/goals), triggers AI job match (/v1/tracker/goals/{id}/ai-match), and filters Kanban jobs", async () => {
    const calls: Array<{ url: string; method: string; body?: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const body = typeof init?.body === "string" ? init.body : undefined;
      calls.push({ url, method, body });

      if (url.endsWith("/v1/tracker/goals") && method === "GET") {
        return new Response(
          JSON.stringify([
            {
              id: "goal_101",
              target_role: "Staff Distributed Engineer",
              target_skills: ["Golang", "PostgreSQL", "Kafka"],
              min_salary: 4500,
              preferred_location: "Ho Chi Minh City",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/v1/tracker/goals") && method === "POST") {
        const payload = JSON.parse(body ?? "{}") as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            id: "goal_102",
            ...payload,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/tracker/goals/goal_102/ai-match") && method === "POST") {
        return new Response(
          JSON.stringify({
            goal_id: "goal_102",
            fee_vnd: 29000,
            matched_jobs: [
              {
                id: "job_ai_1",
                company: "Databricks",
                position: "Staff Systems Engineer",
                status: "TARGETING",
                salary: "$215k",
                score: 96,
                notes: "AI Matched (96% ATS)",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("{}", { status: 200 });
    }) as typeof fetch);

    const goals = await fetchMobileCareerGoals();
    expect(goals[0]?.id).toBe("goal_101");
    expect(goals[0]?.target_role).toBe("Staff Distributed Engineer");

    const saved = await saveMobileCareerGoal({
      target_role: "Principal AI Architect",
      target_skills: ["Python", "AI/LLM", "PostgreSQL"],
      min_salary: 5500,
      preferred_location: "Remote APAC",
    });
    expect(saved.id).toBe("goal_102");
    expect(saved.target_role).toBe("Principal AI Architect");

    const aiMatch = await triggerMobileAiJobMatch("goal_102", "WALLET");
    expect(aiMatch.fee_vnd).toBe(29000);
    expect(aiMatch.matched_jobs.length).toBe(1);
    expect(aiMatch.matched_jobs[0]?.company).toBe("Databricks");

    const filtered = filterMobileTrackedJobs(
      [
        {
          id: "1",
          company: "Stripe",
          position: "Staff Mobile",
          status: "APPLIED",
          salary: "$200k",
          score: 92,
          notes: "",
        },
        {
          id: "2",
          company: "Linear",
          position: "Product Engineer",
          status: "INTERVIEW",
          salary: "$190k",
          score: 90,
          notes: "",
        },
      ],
      "stripe",
      "ALL"
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.company).toBe("Stripe");
  });

  it("resolves rich notification spotlight deep-links to relevant mobile screens", () => {
    const orderTarget = resolveNotificationSpotlightTarget({
      id: "notif_1",
      title: "Expert CV Review Completed",
      message: "Sarah Jenkins finished your line-by-line STAR review ($59 Escrow ready).",
      is_read: false,
      created_at: "2m ago",
      category: "EXPERT_REVIEW",
      deep_link: "/(tabs)/career?sub=expert&order=ord_88",
      action_label: "View Expert CV Report",
      email_sent: true,
    });
    expect(orderTarget.route).toBe("/(tabs)/career");
    expect(orderTarget.actionLabel).toBe("View Expert CV Report");

    const trackerTarget = resolveNotificationSpotlightTarget({
      id: "notif_2",
      title: "ATS Match Alert: 96% Match at Anthropic",
      message: "Your persisted Career Goal matched Staff Distributed Systems @ Anthropic.",
      is_read: false,
      created_at: "5m ago",
    });
    expect(trackerTarget.route).toBe("/(tabs)/tracker");
  });

  it("enforces Design Spec #99 accessibilityLabel and content-desc contracts across Expo and Android Native", () => {
    const discoverTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/index.tsx"), "utf-8");
    const trackerTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/tracker.tsx"), "utf-8");
    const profileTsx = readFileSync(join(MOBILE_ROOT, "app/(tabs)/profile.tsx"), "utf-8");
    const mainJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/MainActivity.java"),
      "utf-8"
    );
    const careerJava = readFileSync(
      join(MOBILE_ROOT, "android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java"),
      "utf-8"
    );

    for (const token of [
      "mobile-custom-skill-input",
      "mobile-add-custom-skill-btn",
      "mobile-skill-match-badge-",
      "mobile-watch-pitch-",
    ]) {
      expect(discoverTsx).toContain(token);
      expect(mainJava).toContain(token);
    }

    for (const token of [
      "mobile-tracker-search-input",
      "mobile-tracker-stage-filter-",
      "mobile-career-goal-card",
      "mobile-save-career-goal-btn",
      "mobile-trigger-ai-job-match-btn",
    ]) {
      expect(trackerTsx).toContain(token);
      expect(mainJava).toContain(token);
    }

    expect(profileTsx).toContain("mobile-notification-spotlight-drawer");
    expect(careerJava).toContain("mobile-notification-spotlight-drawer");
  });
});
