import { describe, expect, test } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useJobTracker, type TrackedJob } from "@/hooks/use-job-tracker";
import { useMomoReturnStatus } from "@/hooks/use-wallet";
import { mockApi, queryWrapper } from "./helpers";

const bookmark = (username: string) => ({ id: `b-${username}`, username, full_name: username.toUpperCase() });

describe("useBookmarks", () => {
  test("loads bookmarks from a bare array and matches usernames case-insensitively", async () => {
    mockApi(() => ({ data: [bookmark("lan")] }));
    const { result } = renderHook(() => useBookmarks(), queryWrapper());

    await waitFor(() => expect(result.current.bookmarks).toHaveLength(1));
    expect(result.current.isBookmarked(" LAN ")).toBe(true);
    expect(result.current.isBookmarked("minh")).toBe(false);
  });

  test("accepts a paginated { items } payload", async () => {
    mockApi(() => ({ data: { items: [bookmark("lan"), bookmark("minh")] } }));
    const { result } = renderHook(() => useBookmarks(), queryWrapper());
    await waitFor(() => expect(result.current.bookmarks.map((b) => b.username)).toEqual(["lan", "minh"]));
  });

  // Minimal in-memory backend so post-mutation refetches see the same state.
  function bookmarkServer(initial: string[]) {
    const saved = new Set(initial);
    return mockApi((config) => {
      const name = config.url?.split("/")[3];
      if (config.method === "post" && name) saved.add(name);
      if (config.method === "delete" && name) saved.delete(name);
      return config.method === "post" ? { data: bookmark(name ?? "") } : { data: [...saved].map(bookmark) };
    });
  }

  test("toggleBookmark POSTs the normalized username and adds it", async () => {
    const calls = bookmarkServer(["lan"]);
    const { result } = renderHook(() => useBookmarks(), queryWrapper());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggleBookmark(" Minh ", "strong infra"));

    await waitFor(() => expect(result.current.isBookmarked("minh")).toBe(true));
    const post = calls.find((c) => c.method === "post");
    expect(post?.url).toBe("/v1/bookmarks/minh/");
    expect(JSON.parse(String(post?.data))).toEqual({ note: "strong infra" });
  });

  test("removeBookmark DELETEs and drops the entry", async () => {
    const calls = bookmarkServer(["lan"]);
    const { result } = renderHook(() => useBookmarks(), queryWrapper());
    await waitFor(() => expect(result.current.isBookmarked("lan")).toBe(true));

    act(() => result.current.removeBookmark("lan"));

    await waitFor(() => expect(result.current.isBookmarked("lan")).toBe(false));
    expect(calls.some((c) => c.method === "delete" && c.url === "/v1/bookmarks/lan/")).toBe(true);
  });

  test("surfaces the backend error detail when the mutation fails", async () => {
    mockApi((config) =>
      config.method === "post" ? { status: 403, data: { detail: "Recruiter account required" } } : { data: [] }
    );
    const { result } = renderHook(() => useBookmarks(), queryWrapper());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggleBookmark("lan"));

    await waitFor(() => expect(result.current.errorMessage).toBe("Recruiter account required"));
    expect(result.current.isPendingFor("lan")).toBe(false);
  });
});

describe("useJobTracker", () => {
  const job: TrackedJob = {
    id: "j1",
    company_name: "Grab",
    position_title: "Backend Engineer",
    status: "APPLIED",
    match_score: 80,
    created_at: "",
    updated_at: "",
  };

  test("loads jobs and analytics", async () => {
    mockApi((config) =>
      config.url === "/v1/tracker/jobs/analytics"
        ? { data: { total_tracked: 1 } }
        : config.url === "/v1/tracker/jobs/"
          ? { data: [job] }
          : { data: null }
    );
    const { result } = renderHook(() => useJobTracker(), queryWrapper());

    await waitFor(() => expect(result.current.jobs).toEqual([job]));
    await waitFor(() => expect(result.current.analytics?.total_tracked).toBe(1));
    expect(result.current.error).toBeNull();
  });

  test("exposes a user-facing error when the job list fails", async () => {
    mockApi((config) => (config.url === "/v1/tracker/jobs/" ? { status: 500 } : { data: null }));
    const { result } = renderHook(() => useJobTracker(), queryWrapper());
    await waitFor(() => expect(result.current.error).toBe("Không thể tải danh sách ứng tuyển."));
    expect(result.current.jobs).toEqual([]);
  });

  test("moveStatus updates the cache optimistically and PATCHes the backend", async () => {
    const calls = mockApi((config) => (config.url === "/v1/tracker/jobs/" ? { data: [job] } : { data: null }));
    const { result } = renderHook(() => useJobTracker(), queryWrapper());
    await waitFor(() => expect(result.current.jobs).toHaveLength(1));

    await act(() => result.current.moveStatus("j1", "OFFER"));

    await waitFor(() => expect(result.current.jobs[0].status).toBe("OFFER"));
    const patch = calls.find((c) => c.method === "patch");
    expect(patch?.url).toBe("/v1/tracker/jobs/j1/status");
    expect(JSON.parse(String(patch?.data))).toEqual({ status: "OFFER" });
  });

  test("addJob prepends the created job", async () => {
    const created = { ...job, id: "j2", company_name: "VNG" };
    mockApi((config) =>
      config.method === "post" ? { data: created } : config.url === "/v1/tracker/jobs/" ? { data: [job] } : { data: null }
    );
    const { result } = renderHook(() => useJobTracker(), queryWrapper());
    await waitFor(() => expect(result.current.jobs).toHaveLength(1));

    await act(() => result.current.addJob({ company_name: "VNG", position_title: "Backend Engineer" }));

    await waitFor(() => expect(result.current.jobs.map((j) => j.id)).toEqual(["j2", "j1"]));
  });
});

describe("useMomoReturnStatus", () => {
  test("rejects untrusted path-traversal momo_order query params and polls valid order ids", async () => {
    const calls = mockApi((config) => ({
      data: { order_id: config.url?.split("/").pop() ?? "", status: "PAID", amount: 50000 },
    }));

    window.history.replaceState({}, "", "/workspace/wallet?momo_order=../../admin/analytics");
    const forged = renderHook(() => useMomoReturnStatus(), queryWrapper());
    await new Promise((r) => setTimeout(r, 25));
    expect(forged.result.current).toBeUndefined();
    expect(calls).toHaveLength(0);

    window.history.replaceState({}, "", "/workspace/wallet?momo_order=BLG-20261029000000-deadbeef");
    const valid = renderHook(() => useMomoReturnStatus(), queryWrapper());
    await waitFor(() => expect(valid.result.current?.status).toBe("PAID"));
    expect(calls.map((c) => c.url)).toEqual(["/v1/payments/momo/order-status/BLG-20261029000000-deadbeef"]);
  });
});
