import React from "react";
import { screen } from "@testing-library/react-native";
import DiscoveryScreen from "../app/(tabs)/index";
import { mockFetch, on, renderWithQuery, resetSession } from "./test-utils";

beforeEach(resetSession);

it("renders candidates returned by the search API", async () => {
  const calls = mockFetch(
    on("GET", "/v1/profile/search/trending/", { trending_skills: [{ name: "FastAPI", candidate_count: 12 }] }),
    on("GET", "/v1/profile/search/", {
      items: [
        {
          username: "linhtran",
          first_name: "Linh",
          last_name: "Tran",
          headline: "Staff Backend Engineer",
          skills: ["FastAPI", "PostgreSQL"],
          trust_score: 91,
        },
      ],
      total: 1,
      next_cursor: null,
    }),
    on("GET", "/v1/catalogs/skills", []),
    on("GET", "/v1/companies/search", { items: [], total: 0 }),
    on("GET", "/v1/", { items: [] })
  );

  await renderWithQuery(<DiscoveryScreen />);

  expect(await screen.findByText("Linh Tran (@linhtran)")).toBeTruthy();
  expect(screen.getByText("Staff Backend Engineer")).toBeTruthy();
  expect(screen.getByText("Trust Score: 91%")).toBeTruthy();
  expect(await screen.findByText("FastAPI (12)")).toBeTruthy();
  // Anonymous users get no bookmark controls and no bookmarks request (it would 401).
  expect(screen.queryByTestId("bookmark-candidate-linhtran")).toBeNull();
  expect(calls.some((c) => c.url.includes("/bookmarks"))).toBe(false);
});

it("shows the API error instead of an empty feed when search fails", async () => {
  mockFetch(on("GET", "/v1/profile/search/", { detail: "Search temporarily unavailable" }, 503), on("GET", "/v1/", { items: [] }));

  await renderWithQuery(<DiscoveryScreen />);

  expect(await screen.findByText("Search temporarily unavailable")).toBeTruthy();
});
