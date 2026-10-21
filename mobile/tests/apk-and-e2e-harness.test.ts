import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const MOBILE_ROOT = join(import.meta.dir, "..");

describe("Belooga Mobile RN 0.88.0 APK Pipeline & E2E Automation Harness (BEL-135)", () => {
  it("enforces latest React Native 0.88.0 and Expo 58.0.16 in package.json", () => {
    const pkg = JSON.parse(readFileSync(join(MOBILE_ROOT, "package.json"), "utf-8")) as {
      dependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.dependencies["react-native"]).toBe("0.88.0");
    expect(pkg.dependencies.expo).toBe("58.0.16");
    expect(pkg.scripts["build:apk"]).toContain("scripts/build-apk.sh");
    expect(pkg.scripts["test:e2e:android"]).toContain("scripts/e2e-mobile-adb.sh");
  });

  it("enforces mandatory old-APK purge and cryptographic signature verification in build-apk.sh", () => {
    const buildScriptPath = join(MOBILE_ROOT, "scripts", "build-apk.sh");
    expect(existsSync(buildScriptPath)).toBe(true);
    const scriptContent = readFileSync(buildScriptPath, "utf-8");
    expect(scriptContent).toContain("-name \"*.apk\"");
    expect(scriptContent).toContain("-delete");
    expect(scriptContent).toContain("apksigner\" verify");
  });

  it("defines UIAutomator2 ADB E2E runner and Maestro declarative YAML flow across all 4 tabs", () => {
    const adbScript = readFileSync(join(MOBILE_ROOT, "scripts", "e2e-mobile-adb.sh"), "utf-8");
    const maestroYaml = readFileSync(join(MOBILE_ROOT, "e2e", "maestro-flow.yaml"), "utf-8");

    for (const tabNode of [
      "mobile-discovery-heading",
      "mobile-studio-title",
      "mobile-tracker-title",
      "mobile-workspace-heading",
    ]) {
      expect(adbScript).toContain(tabNode);
      expect(maestroYaml).toContain(tabNode);
    }
  });
});
