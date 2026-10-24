import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const readSrc = (relPath: string) => readFileSync(join(process.cwd(), "src", relPath), "utf8");

describe("BEL-237 Shared Hooks/Components Deduplication (NTA-P005) & Viewfinder Tailwind Style (NTA-C004)", () => {
  test("studio-viewfinder.tsx replaces static inline style={{}} with Tailwind utility classes", () => {
    const viewfinderSrc = readSrc("components/features/studio/studio-viewfinder.tsx");
    expect(viewfinderSrc.includes("style={{")).toBe(false);
    expect(viewfinderSrc.includes("-scale-x-100")).toBe(true);
    expect(viewfinderSrc.includes("transform-gpu")).toBe(true);
    expect(viewfinderSrc.includes("will-change-transform")).toBe(true);
    expect(viewfinderSrc.includes("backface-hidden")).toBe(true);
  });

  test("update/page.tsx and settings/page.tsx share useProfileOwnerGuard and WorkspaceSubpageShell", () => {
    const updateSrc = readSrc("app/user/[username]/update/page.tsx");
    const settingsSrc = readSrc("app/user/[username]/settings/page.tsx");
    expect(updateSrc.includes("useProfileOwnerGuard")).toBe(true);
    expect(updateSrc.includes("WorkspaceSubpageShell")).toBe(true);
    expect(settingsSrc.includes("useProfileOwnerGuard")).toBe(true);
    expect(settingsSrc.includes("WorkspaceSubpageShell")).toBe(true);
  });

  test("blog/page.tsx and recruiter/hub/page.tsx share query-cache-utils helpers", () => {
    const blogSrc = readSrc("app/(public)/blog/page.tsx");
    const recruiterSrc = readSrc("app/recruiter/hub/page.tsx");
    expect(blogSrc.includes("prependAndInvalidateList")).toBe(true);
    expect(blogSrc.includes("replaceAndInvalidateByKey")).toBe(true);
    expect(recruiterSrc.includes("prependAndInvalidateList")).toBe(true);
  });

  test("login/page.tsx and register/page.tsx share AuthSplitShell and buildOAuthCallbackUrl", () => {
    const loginSrc = readSrc("app/(auth)/login/page.tsx");
    const registerSrc = readSrc("app/(auth)/register/page.tsx");
    expect(loginSrc.includes("AuthSplitShell")).toBe(true);
    expect(loginSrc.includes("buildOAuthCallbackUrl")).toBe(true);
    expect(registerSrc.includes("AuthSplitShell")).toBe(true);
    expect(registerSrc.includes("buildOAuthCallbackUrl")).toBe(true);
  });

  test("cv-studio-preview.tsx reuses STANDARD_CV_SECTIONS from cv-studio-sidebar.tsx", () => {
    const cvPreviewSrc = readSrc("components/features/cv-studio/cv-studio-preview.tsx");
    expect(cvPreviewSrc.includes("STANDARD_CV_SECTIONS")).toBe(true);
  });
});
