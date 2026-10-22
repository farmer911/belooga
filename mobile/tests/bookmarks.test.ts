import { beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { mobileRouter } from "@/lib/native-runtime";
import { MobileApiError, setMobileFetchTransportForTesting } from "@/services/api-client";
import {
  addMobileBookmark,
  fetchMobileBookmarks,
  isCandidateBookmarked,
  removeMobileBookmark,
  toggleMobileBookmark,
} from "@/hooks/use-mobile-bookmarks";

const MOBILE_ROOT = join(import.meta.dir, "..");

describe("Belooga Mobile Candidate Shortlist Bookmarks (BEL-147)", () => {
  beforeEach(() => {
    mobileRouter.resetForTesting("/(tabs)");
    setMobileFetchTransportForTesting(null);
  });

  it("fetches saved candidate shortlist from GET /v1/bookmarks/ with Design #64 metadata contract", async () => {
    let capturedUrl = "";
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify([
          {
            id: "bm_101",
            username: "alexnguyen",
            full_name: "Alex Nguyen",
            headline: "Principal Distributed Systems Engineer",
            location: "Ho Chi Minh City",
            seeking_status: "Open to Offers",
            avatar_url: "/images/avatar.jpg",
            note: "Strong PostgreSQL 16 GIN & RN 0.88 experience",
            created_at: "2026-10-22T09:00:00Z",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch);

    const list = await fetchMobileBookmarks();
    expect(capturedUrl).toContain("/v1/bookmarks/");
    expect(list.length).toBe(1);
    expect(list[0]?.username).toBe("alexnguyen");
    expect(list[0]?.full_name).toBe("Alex Nguyen");
    expect(list[0]?.seeking_status).toBe("Open to Offers");
    expect(isCandidateBookmarked(list, "alexnguyen")).toBe(true);
    expect(isCandidateBookmarked(list, "sarahchen")).toBe(false);
  });

  it("creates bookmark via POST /v1/bookmarks/{username}/ and rejects hidden/missing profiles with 404 (Zero Fake Feedback)", async () => {
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/bookmarks/hiddenuser/") && init?.method === "POST") {
        return new Response(
          JSON.stringify({ detail: "Candidate profile not found or hidden" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/bookmarks/alexnguyen/") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            id: "bm_102",
            username: "alexnguyen",
            full_name: "Alex Nguyen",
            headline: "Principal Distributed Systems Engineer",
            location: "Ho Chi Minh City",
            seeking_status: "Open to Offers",
            avatar_url: null,
            note: "Top shortlist pick",
            created_at: "2026-10-22T09:15:00Z",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch);

    const created = await addMobileBookmark("alexnguyen", "Top shortlist pick");
    expect(created.username).toBe("alexnguyen");
    expect(created.note).toBe("Top shortlist pick");

    let caughtError: MobileApiError | null = null;
    try {
      await addMobileBookmark("hiddenuser");
    } catch (err) {
      caughtError = err as MobileApiError;
    }
    expect(caughtError).toBeTruthy();
    expect(caughtError?.status).toBe(404);
  });

  it("removes bookmark via DELETE /v1/bookmarks/{username}/ supporting 204 No Content and toggles deterministically", async () => {
    const calls: Array<{ method: string; url: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const url = String(input);
      calls.push({ method, url });
      if (method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      return new Response(
        JSON.stringify({
          id: "bm_103",
          username: "sarahchen",
          full_name: "Sarah Chen",
          headline: "Staff Mobile Architect",
          location: "Singapore",
          seeking_status: "Active",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch);

    await removeMobileBookmark("alexnguyen");
    expect(calls[0]?.method).toBe("DELETE");
    expect(calls[0]?.url).toContain("/v1/bookmarks/alexnguyen/");

    const toggleAdd = await toggleMobileBookmark({ username: "sarahchen", currentlyBookmarked: false });
    expect(toggleAdd.bookmarked).toBe(true);

    const toggleRemove = await toggleMobileBookmark({ username: "sarahchen", currentlyBookmarked: true });
    expect(toggleRemove.bookmarked).toBe(false);
  });

  it("enforces Design #64 accessibilityLabel / content-desc contracts on Expo Discover and Android Native Discover", () => {
    const expoDiscover = readFileSync(join(MOBILE_ROOT, "app", "(tabs)", "index.tsx"), "utf-8");
    const mainActivity = readFileSync(
      join(
        MOBILE_ROOT,
        "android",
        "app",
        "src",
        "main",
        "java",
        "com",
        "belooga",
        "mobile",
        "MainActivity.java"
      ),
      "utf-8"
    );

    expect(expoDiscover).toContain("filter-saved-shortlist-chip");
    expect(expoDiscover).toContain("bookmark-candidate-");
    expect(expoDiscover).toContain("Saved Shortlist");

    expect(mainActivity).toContain("filter-saved-shortlist-chip");
    expect(mainActivity).toContain("bookmark-candidate-alexnguyen");
    expect(mainActivity).toContain("Saved Shortlist");
  });
});
