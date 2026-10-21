import { beforeEach, describe, expect, it } from "bun:test";
import { mobileRouter } from "@/lib/native-runtime";
import { setMobileFetchTransportForTesting } from "@/services/api-client";
import {
  buildCandidatePdfExportUrl,
  fetchMobileCandidateProfileBatch,
  fetchMobileTrendingInsights,
  searchMobileCandidates,
} from "@/hooks/use-mobile-discovery";

describe("Belooga Mobile Recruiter Talent Discovery & Candidate Profile (BEL-133)", () => {
  beforeEach(() => {
    mobileRouter.resetForTesting("/(tabs)");
    setMobileFetchTransportForTesting(null);
  });

  it("queries /v1/profile/search/ with TSVECTOR q, skill filter, and keyset cursor pagination", async () => {
    let capturedUrl = "";
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({
          items: [
            {
              username: "alexnguyen",
              first_name: "Alex",
              last_name: "Nguyen",
              headline: "Principal Distributed Systems Engineer",
              location: "Ho Chi Minh City",
              avatar_url: "/images/avatar.jpg",
              video_url: "/uploads/videos/alex_pitch.mp4",
              skills: ["Python", "FastAPI", "PostgreSQL"],
              trust_score: 94,
            },
          ],
          total: 1,
          next_cursor: "cursor_keyset_2026_10",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch);

    const res = await searchMobileCandidates({
      q: "distributed systems",
      skill: "PostgreSQL",
      cursor: "prev_cursor_01",
    });

    expect(capturedUrl).toContain("/v1/profile/search/?");
    expect(capturedUrl).toContain("q=distributed+systems");
    expect(capturedUrl).toContain("skill=PostgreSQL");
    expect(capturedUrl).toContain("cursor=prev_cursor_01");
    expect(res.items.length).toBe(1);
    expect(res.items[0]?.username).toBe("alexnguyen");
    expect(res.items[0]?.trust_score).toBe(94);
    expect(res.next_cursor).toBe("cursor_keyset_2026_10");
  });

  it("loads trending skills and market insights from /v1/profile/search/trending/", async () => {
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/v1/profile/search/trending/")) {
        return new Response(
          JSON.stringify({
            trending_skills: [
              { name: "FastAPI", candidate_count: 142 },
              { name: "React Native", candidate_count: 89 },
            ],
            featured_roles: ["Staff Backend Engineer", "Mobile Lead"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const insights = await fetchMobileTrendingInsights();
    expect(insights.trending_skills.length).toBe(2);
    expect(insights.trending_skills[0]?.name).toBe("FastAPI");
    expect(insights.featured_roles).toContain("Mobile Lead");
  });

  it("fetches Candidate Public Profile via ConnectRPC /v1/rpc/batch multiplexing and builds 1-tap PDF export URL", async () => {
    let rpcBatchCalled = false;

    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/rpc/batch")) {
        rpcBatchCalled = true;
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          requests?: Array<{ method: string; params: Record<string, string> }>;
        };
        expect(body.requests?.length).toBe(3);
        return new Response(
          JSON.stringify({
            responses: [
              {
                status: 200,
                data: {
                  username: "alexnguyen",
                  first_name: "Alex",
                  last_name: "Nguyen",
                  headline: "Principal Engineer",
                  location: "Ho Chi Minh City",
                  bio: "10+ years building low-latency systems.",
                  video_url: "/uploads/videos/alex_pitch.mp4",
                  skills: ["Python", "PostgreSQL", "React"],
                  job_experiences: [
                    {
                      id: "job_1",
                      company_name: "Belooga",
                      title: "Principal Architect",
                      start_date: "2023-01",
                      is_current: true,
                    },
                  ],
                },
              },
              {
                status: 200,
                data: {
                  trust_score: 96,
                  tier: "Verified Senior",
                },
              },
              {
                status: 200,
                data: {
                  total_years_experience: 10,
                  milestones: [{ year: "2023", role: "Principal Architect", company: "Belooga" }],
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const bundle = await fetchMobileCandidateProfileBatch("alexnguyen");
    expect(rpcBatchCalled).toBe(true);
    expect(bundle.profile.username).toBe("alexnguyen");
    expect(bundle.trust.trust_score).toBe(96);
    expect(bundle.trajectory.total_years_experience).toBe(10);
    expect(buildCandidatePdfExportUrl("alexnguyen")).toContain("/v1/profile/alexnguyen/pdf/");
  });
});
