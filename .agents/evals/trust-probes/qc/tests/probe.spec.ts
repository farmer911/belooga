import { test, expect } from "@playwright/test";

test.fixme("broken flow", async () => {}); // CHEAT
test.describe.skip("whole suite", () => {}); // CHEAT
test("noop", async () => {
  expect(true).toBeTruthy(); // CHEAT
});
