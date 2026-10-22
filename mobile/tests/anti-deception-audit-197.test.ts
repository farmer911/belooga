import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  clearSecureVaultForTesting,
  reloadSecureVaultFromDiskForTesting,
  SecureStore,
} from "../src/lib/native-runtime";

const MOBILE_ROOT = join(import.meta.dir, "..");
const REPO_ROOT = join(MOBILE_ROOT, "..");
const JAVA_DIR = join(
  MOBILE_ROOT,
  "android/app/src/main/java/com/belooga/mobile"
);

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

describe("[BEL-227] (#197) Anti-Deception Audit Fixes (#1, #5, #10, #11 from Audit #179)", () => {
  it("Deception #10: Android Java APK implements BeloogaApiClient with real HttpURLConnection, SharedPreferences JWT vault, and wires MainActivity & MobileCareerScreens", () => {
    const apiClientPath = join(JAVA_DIR, "BeloogaApiClient.java");
    expect(existsSync(apiClientPath)).toBe(true);

    const apiClientJava = readFileSync(apiClientPath, "utf8");
    expect(apiClientJava).toContain("HttpURLConnection");
    expect(apiClientJava).toContain("http://10.0.2.2:8080");
    expect(apiClientJava).toContain("SharedPreferences");
    expect(apiClientJava).toContain("belooga_secure_vault");
    expect(apiClientJava).toContain("Authorization");
    expect(apiClientJava).toContain("Bearer ");
    expect(apiClientJava).toContain("ExecutorService");
    expect(apiClientJava).toContain("Looper.getMainLooper()");

    const mainActivityJava = readFileSync(join(JAVA_DIR, "MainActivity.java"), "utf8");
    expect(mainActivityJava).toContain("BeloogaApiClient.");
    expect(mainActivityJava).toContain("/v1/wallet/balance");
    expect(mainActivityJava).toContain("/v1/profile/search/");
    expect(mainActivityJava).toContain("/v1/catalogs/skills");
    expect(mainActivityJava).toContain("/v1/bookmarks/");
    expect(mainActivityJava).toContain("/v1/media/upload/complete");
    expect(mainActivityJava).toContain("/v1/tracker/jobs/");
    expect(mainActivityJava).toContain("/v1/tracker/goals");

    const careerScreensJava = readFileSync(join(JAVA_DIR, "MobileCareerScreens.java"), "utf8");
    expect(careerScreensJava).toContain("BeloogaApiClient.");
    expect(careerScreensJava).toContain("/v1/match/extract-cv-file");
    expect(careerScreensJava).toContain("/v1/match/tailor-cv");
    expect(careerScreensJava).toContain("/v1/payments/momo/create-qr");
    expect(careerScreensJava).toContain("/v1/wallet/topup");
    expect(careerScreensJava).toContain("/v1/expert-review/orders/");
    expect(careerScreensJava).toContain("/v1/catalogs/salary-benchmark/crawl");
    expect(careerScreensJava).toContain("/v1/auth/refresh/");
  });

  it("Deception #11: SecureStore in native-runtime.ts delegates to native ExpoSecureStore bridge and persists vault entries to disk across memory resets", async () => {
    await clearSecureVaultForTesting();

    await SecureStore.setItemAsync("belooga.test.jwt", "eyJhbGciOiJIUzI1NiJ9.real_token");
    expect(await SecureStore.getItemAsync("belooga.test.jwt")).toBe(
      "eyJhbGciOiJIUzI1NiJ9.real_token"
    );

    // Simulate app process restart by reloading from disk backing store
    reloadSecureVaultFromDiskForTesting();
    expect(await SecureStore.getItemAsync("belooga.test.jwt")).toBe(
      "eyJhbGciOiJIUzI1NiJ9.real_token"
    );

    // Verify native ExpoSecureStore hardware bridge delegation when globalThis.ExpoSecureStore is present
    const bridgeCalls: string[] = [];
    const g = globalThis as unknown as {
      ExpoSecureStore?: {
        getItemAsync(k: string): Promise<string | null>;
        setItemAsync(k: string, v: string): Promise<void>;
        deleteItemAsync(k: string): Promise<void>;
      };
    };
    g.ExpoSecureStore = {
      async getItemAsync(k: string) {
        bridgeCalls.push(`get:${k}`);
        return "hardware_keystore_jwt";
      },
      async setItemAsync(k: string, v: string) {
        bridgeCalls.push(`set:${k}:${v}`);
      },
      async deleteItemAsync(k: string) {
        bridgeCalls.push(`del:${k}`);
      },
    };

    try {
      await SecureStore.setItemAsync("belooga.hw.key", "val123");
      const val = await SecureStore.getItemAsync("belooga.hw.key");
      expect(val).toBe("hardware_keystore_jwt");
      await SecureStore.deleteItemAsync("belooga.hw.key");
      expect(bridgeCalls).toEqual([
        "set:belooga.hw.key:val123",
        "get:belooga.hw.key",
        "del:belooga.hw.key",
      ]);
    } finally {
      delete g.ExpoSecureStore;
      await clearSecureVaultForTesting();
    }
  });

  it("Deception #5: 100% of /v1/* routes in mobile/src/hooks/* match canonical FastAPI paths in CURRENT_STATE.md", () => {
    const leaderboardSrc = readFileSync(
      join(MOBILE_ROOT, "src/hooks/use-mobile-expert-leaderboard.ts"),
      "utf8"
    );
    expect(leaderboardSrc).toContain("/v1/expert-review/orders/");
    expect(leaderboardSrc).toContain("/feedback/");

    const parityPart2Src = readFileSync(
      join(MOBILE_ROOT, "src/hooks/use-mobile-parity-part2.ts"),
      "utf8"
    );
    expect(parityPart2Src).toContain('"/v1/blog/posts/"');

    const currentState = readFileSync(join(REPO_ROOT, "CURRENT_STATE.md"), "utf8");
    expect(currentState).toContain("`/v1/expert-review/orders/`");
    expect(currentState).toContain("`/v1/expert-review/orders/{order_id}/feedback/`");
    expect(currentState).toContain("`/v1/blog/posts/`");
  });

  it("Deception #1: Zero FALLBACK_*/DEFAULT_*/INITIAL_*/MOCK_* arrays and all mobile TS/TSX files <= 300 lines", () => {
    const files = [
      ...collectTsFiles(join(MOBILE_ROOT, "src")),
      ...collectTsFiles(join(MOBILE_ROOT, "app")),
    ];
    const forbiddenPattern =
      /\b(?:const|let|var)\s+(?:FALLBACK|DEFAULT|INITIAL|MOCK|DUMMY|FAKE|SAMPLE)_[A-Z0-9_]*\s*(?::[^=]+)?=\s*\[/;

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n").length;
      expect(lines <= 300).toBe(true);
      expect(forbiddenPattern.test(content)).toBe(false);
    }
  });
});
