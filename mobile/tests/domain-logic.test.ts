import { computeCandidateSkillMatch } from "@/hooks/use-mobile-discovery";
import { createValidMobileUploadId } from "@/hooks/use-mobile-studio";
import { filterMobileTrackedJobs } from "@/hooks/use-mobile-tracker";
import { resolveNotificationSpotlightTarget } from "@/hooks/use-mobile-auth";
import { loginSchema, registerSchema, type TrackedJobItemDTO } from "@/lib/schemas";
import { normalizeMobileUser } from "@/store/auth-store";

describe("auth schemas", () => {
  it("rejects malformed login input with the user-facing message", () => {
    const res = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toBe("Please enter a valid email address");
  });

  it("enforces username charset and password length on register", () => {
    const base = { firstName: "An", lastName: "Nguyen", email: "an@example.com" };
    expect(registerSchema.safeParse({ ...base, username: "An Nguyen", password: "longenough" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, username: "annguyen", password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, username: "an_nguyen-1", password: "longenough" }).success).toBe(true);
  });
});

describe("normalizeMobileUser", () => {
  it("maps snake_case payloads and defaults unknown roles to candidate", () => {
    expect(normalizeMobileUser({ id: 7, username: "bao", first_name: "Bao", role: "superuser" })).toEqual({
      id: "7",
      email: "",
      username: "bao",
      firstName: "Bao",
      lastName: "",
      avatarUrl: undefined,
      role: "candidate",
    });
    expect(normalizeMobileUser({ email: "x@y.z" })).toBeNull();
  });
});

describe("computeCandidateSkillMatch", () => {
  it("matches selected skills case-insensitively", () => {
    const res = computeCandidateSkillMatch(["FastAPI", "PostgreSQL"], ["postgresql", "Rust"]);
    expect(res).toMatchObject({ matchedCount: 1, totalSelected: 2, matchedSkills: ["postgresql"] });
  });
});

describe("filterMobileTrackedJobs", () => {
  const jobs: TrackedJobItemDTO[] = [
    { id: "1", company: "Stripe", position: "Staff Mobile", status: "APPLIED", salary: "", score: 0, notes: "" },
    { id: "2", company: "Grab", position: "Backend", status: "INTERVIEW", salary: "", score: 0, notes: "" },
  ];

  it("filters by search text and stage", () => {
    expect(filterMobileTrackedJobs(jobs, "stripe", "ALL").map((j) => j.id)).toEqual(["1"]);
    expect(filterMobileTrackedJobs(jobs, "", "INTERVIEW").map((j) => j.id)).toEqual(["2"]);
  });
});

describe("createValidMobileUploadId", () => {
  it("produces ids accepted by the backend pattern and rejects nothing valid", () => {
    expect(createValidMobileUploadId(1700000000, "ab-c!")).toBe("upload_1700000000_abc");
    expect(createValidMobileUploadId()).toMatch(/^upload_\d+_[a-zA-Z0-9]+$/);
  });
});

describe("resolveNotificationSpotlightTarget", () => {
  it("prefers the server deep link and strips query strings", () => {
    expect(
      resolveNotificationSpotlightTarget({ title: "t", message: "m", deep_link: "/career?tab=wallet", action_label: "" })
    ).toMatchObject({ route: "/career", actionLabel: "Open Linked Item" });
  });

  it("routes interview notifications to the tracker", () => {
    expect(resolveNotificationSpotlightTarget({ title: "Interview scheduled", message: "" }).route).toBe("/(tabs)/tracker");
  });
});
