import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AddJobDialog } from "@/components/features/job-tracker/add-job-dialog";
import { ReportProfileModal } from "@/components/features/profile/report-profile-modal";
import { SavedShortlistDrawer } from "@/components/features/search/saved-shortlist-drawer";
import { TopCandidatesLeaderboard } from "@/components/features/search/top-candidates-leaderboard";
import { candidateBookmarkItemSchema } from "@/lib/schemas";
import { mockApi, queryWrapper } from "./helpers";

describe("AddJobDialog", () => {
  test("shows validation errors and does not submit an empty form", async () => {
    const onAdd = mock(async () => undefined);
    const { container } = render(<AddJobDialog isOpen onClose={() => {}} onAdd={onAdd} />);

    fireEvent.submit(container.querySelector("form")!);

    expect(await screen.findByText("Tên công ty không được để trống")).toBeTruthy();
    expect(screen.getByText("Vị trí ứng tuyển không được để trống")).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });

  test("maps form values to the API payload and closes on success", async () => {
    const onAdd = mock(async () => undefined);
    const onClose = mock(() => {});
    const { container } = render(<AddJobDialog isOpen onClose={onClose} onAdd={onAdd} />);

    fireEvent.input(screen.getByPlaceholderText("vd: Shopee, VNG, Grab, FPT"), { target: { value: "Grab" } });
    fireEvent.input(screen.getByPlaceholderText("vd: Senior Backend Engineer"), { target: { value: "SRE" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onAdd).toHaveBeenCalledWith({
      company_name: "Grab",
      position_title: "SRE",
      status: "TARGETING",
      expected_salary: undefined,
      match_score: 85,
      notes: undefined,
    });
  });

  test("renders nothing when closed", () => {
    const { container } = render(<AddJobDialog isOpen={false} onClose={() => {}} onAdd={async () => undefined} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("ReportProfileModal", () => {
  const renderModal = () =>
    render(<ReportProfileModal isOpen onClose={() => {}} candidateId="c-1" username="lan" />, queryWrapper());

  test("rejects a too-short reason without calling the API", async () => {
    const calls = mockApi(() => ({ data: {} }));
    renderModal();
    fireEvent.input(screen.getByPlaceholderText("Describe the issue..."), { target: { value: "bad" } });
    fireEvent.click(screen.getByTestId("report-modal-submit"));

    expect(await screen.findByText("Please provide a clear reason (min 5 characters)")).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  test("posts the report and shows the confirmation", async () => {
    const calls = mockApi(() => ({ data: {} }));
    renderModal();
    fireEvent.input(screen.getByPlaceholderText("Describe the issue..."), { target: { value: "Fake credentials" } });
    fireEvent.click(screen.getByTestId("report-modal-submit"));

    expect(await screen.findByText(/Report received/)).toBeTruthy();
    expect(calls[0].url).toBe("/v1/profile/c-1/report/");
    expect(JSON.parse(String(calls[0].data))).toEqual({ reason: "Fake credentials" });
  });

  test("shows an error state when the API fails", async () => {
    mockApi(() => ({ status: 500 }));
    renderModal();
    fireEvent.input(screen.getByPlaceholderText("Describe the issue..."), { target: { value: "Fake credentials" } });
    fireEvent.click(screen.getByTestId("report-modal-submit"));

    expect(await screen.findByText("Failed to submit report. Please try again.")).toBeTruthy();
    expect(screen.queryByText(/Report received/)).toBeNull();
  });
});

describe("SavedShortlistDrawer", () => {
  const item = candidateBookmarkItemSchema.parse({ id: "b1", username: "lan", full_name: "Lan Tran", location: "Hanoi" });

  test("shows the empty state", () => {
    render(<SavedShortlistDrawer isOpen onClose={() => {}} bookmarks={[]} onRemove={() => {}} isPendingFor={() => false} />);
    expect(screen.getByTestId("shortlist-empty-state")).toBeTruthy();
  });

  test("lists bookmarks, removes one and closes on Escape", () => {
    const onRemove = mock(() => {});
    const onClose = mock(() => {});
    render(<SavedShortlistDrawer isOpen onClose={onClose} bookmarks={[item]} onRemove={onRemove} isPendingFor={() => false} />);

    expect(screen.getByText("Lan Tran")).toBeTruthy();
    expect(screen.getByText("Hanoi")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remove Lan Tran from shortlist"));
    expect(onRemove).toHaveBeenCalledWith("lan");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  test("disables removal while a request is pending", () => {
    render(<SavedShortlistDrawer isOpen onClose={() => {}} bookmarks={[item]} onRemove={() => {}} isPendingFor={() => true} />);
    expect((screen.getByTestId("remove-bookmark-lan") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("TopCandidatesLeaderboard", () => {
  const candidate = (username: string, category: string) => ({
    rank: 1,
    username,
    full_name: `Name ${username}`,
    headline: "Engineer",
    category,
    location: "HCMC",
    potential_score: 97,
    badge_tier: "TOP_1_PCT",
    highlight_reason: "Shipped infra at scale",
    skills: ["Go"],
    actively_looking: true,
    has_video_pitch: true,
  });

  test("renders fetched candidates and refetches with the category filter", async () => {
    const calls = mockApi((config) => {
      if (config.url === "/v1/bookmarks/") return { data: [] };
      return config.params.category === "ai"
        ? { data: [candidate("minh", "ai")] }
        : { data: [candidate("lan", "backend"), candidate("minh", "ai")] };
    });
    render(<TopCandidatesLeaderboard />, queryWrapper());

    expect(await screen.findByTestId("top-candidate-card-lan")).toBeTruthy();
    expect(screen.getByTestId("top-candidate-badge-lan").textContent).toBe("Top 1% Talent");
    expect(screen.getByTestId("top-candidate-score-lan").textContent).toBe("97 / 100 pts");

    fireEvent.click(screen.getByTestId("top-candidates-category-ai"));

    await waitFor(() => expect(screen.queryByTestId("top-candidate-card-lan")).toBeNull());
    expect(screen.getByTestId("top-candidate-card-minh")).toBeTruthy();
    expect(calls.some((c) => c.url === "/v1/search/top-candidates" && c.params.category === "ai")).toBe(true);
  });

  test("renders no cards when the API fails", async () => {
    const calls = mockApi(() => ({ status: 500 }));
    render(<TopCandidatesLeaderboard />, queryWrapper());
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(screen.queryAllByTestId(/^top-candidate-card-/)).toHaveLength(0);
  });
});
