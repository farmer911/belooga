import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  clearSecureVaultForTesting,
  isSecureVaultAdapter,
  SecureStore,
  type SecureVaultAdapter,
} from "../src/lib/native-runtime";
import { fetchMobileExecutiveAnalytics } from "../src/hooks/use-mobile-career-tools";
import { fetchMobileSearchSuggestions } from "../src/hooks/use-mobile-discovery";
import { fetchMobileVideoTranscodingStatus } from "../src/hooks/use-mobile-studio";
import { setMobileFetchTransportForTesting } from "../src/services/api-client";

const MOBILE_ROOT = join(import.meta.dir, "..");

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

describe("[BEL-238] (#222) Zero eslint suppressions in native-runtime.ts & 3 Live Query Hooks Wired", () => {
  it("NTA-S003: enforces 0 eslint suppressions and 0 blind double-casts across mobile/src, mobile/app, and mobile/tests", () => {
    const dirs = [
      join(MOBILE_ROOT, "src"),
      join(MOBILE_ROOT, "app"),
      join(MOBILE_ROOT, "tests"),
    ];
    const files = dirs.flatMap((d) => collectTsFiles(d));
    const eslintDisableRegex = new RegExp(["eslint", "disable"].join("-"));
    const blindCastRegex = new RegExp(["as", "unknown", "as"].join("\\s+"));

    const eslintOffenders: string[] = [];
    const castOffenders: string[] = [];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      const rel = file.replace(`${MOBILE_ROOT}/`, "");
      if (eslintDisableRegex.test(src)) {
        eslintOffenders.push(rel);
      }
      if (blindCastRegex.test(src)) {
        castOffenders.push(rel);
      }
    }

    expect(eslintOffenders).toEqual([]);
    expect(castOffenders).toEqual([]);
  });

  it("NTA-S003: native-runtime.ts uses Reflect.get(globalThis, 'ExpoSecureStore') and runtime member check isSecureVaultAdapter", async () => {
    const nativeRuntimeSrc = readFileSync(
      join(MOBILE_ROOT, "src/lib/native-runtime.ts"),
      "utf8"
    );
    expect(nativeRuntimeSrc).toContain("interface GlobalWithSecureStore");
    expect(nativeRuntimeSrc).toContain('Reflect.get(globalThis, "ExpoSecureStore")');
    expect(nativeRuntimeSrc).toContain('typeof candidate.getItemAsync === "function"');
    expect(nativeRuntimeSrc.includes("declare global")).toBe(false);

    expect(isSecureVaultAdapter(null)).toBe(false);
    expect(isSecureVaultAdapter({})).toBe(false);

    const validAdapter: SecureVaultAdapter = {
      async getItemAsync(key: string) {
        return `reflect-vault:${key}`;
      },
      async setItemAsync() {},
      async deleteItemAsync() {},
    };
    expect(isSecureVaultAdapter(validAdapter)).toBe(true);

    Reflect.set(globalThis, "ExpoSecureStore", validAdapter);
    try {
      const token = await SecureStore.getItemAsync("access_token");
      expect(token).toBe("reflect-vault:access_token");
    } finally {
      Reflect.set(globalThis, "ExpoSecureStore", undefined);
      await clearSecureVaultForTesting();
    }
  });

  it("NTA-P004: wires useMobileExecutiveAnalyticsQuery, useMobileVideoStatusQuery, and useMobileSearchSuggestionsQuery into mobile/app/(tabs)/*.tsx with 0 dead hooks", async () => {
    const careerScreenSrc = readFileSync(
      join(MOBILE_ROOT, "app/(tabs)/career.tsx"),
      "utf8"
    );
    expect(careerScreenSrc).toContain("useMobileExecutiveAnalyticsQuery");
    expect(careerScreenSrc).toContain("mobile-career-exec-bi-summary");

    const studioScreenSrc = readFileSync(
      join(MOBILE_ROOT, "app/(tabs)/studio.tsx"),
      "utf8"
    );
    expect(studioScreenSrc).toContain("useMobileVideoStatusQuery");
    expect(studioScreenSrc).toContain("mobile-studio-video-transcode-status");

    const discoverScreenSrc = readFileSync(
      join(MOBILE_ROOT, "app/(tabs)/index.tsx"),
      "utf8"
    );
    expect(discoverScreenSrc).toContain("useMobileSearchSuggestionsQuery");
    expect(discoverScreenSrc).toContain("mobile-search-suggestions");

    // Verify 100% of exported use* hooks in mobile/src/hooks/*.ts are referenced in mobile/app or mobile/src/components
    const hookFiles = collectTsFiles(join(MOBILE_ROOT, "src/hooks"));
    const uiFiles = [
      ...collectTsFiles(join(MOBILE_ROOT, "app")),
      ...collectTsFiles(join(MOBILE_ROOT, "src/components")),
    ];
    const combinedUiSource = uiFiles.map((f) => readFileSync(f, "utf8")).join("\n");

    const deadHooks: string[] = [];
    for (const hf of hookFiles) {
      const src = readFileSync(hf, "utf8");
      const matches = src.matchAll(/export\s+function\s+(use[A-Za-z0-9_]+)/g);
      for (const m of matches) {
        const hookName = m[1];
        if (!combinedUiSource.includes(hookName)) {
          deadHooks.push(hookName);
        }
      }
    }
    expect(deadHooks).toEqual([]);

    // Verify the underlying query fetchers execute real transport requests
    const mockFetch: typeof fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);
      if (url.includes("/v1/analytics/dashboard")) {
        return new Response(
          JSON.stringify({
            total_gmv_usd: 128400,
            momo_conversion_rate: 64.5,
            search_p95_ms: 8.4,
            active_candidates: 4120,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/profile/alexnguyen/video-status/")) {
        return new Response(
          JSON.stringify({
            status: "COMPLETED",
            video_url: "https://cdn.belooga.com/pitches/alexnguyen.mp4",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/profile/search/suggest/?q=Fast")) {
        return new Response(
          JSON.stringify({
            suggestions: ["FastAPI", "Fastify"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    };
    setMobileFetchTransportForTesting(mockFetch);

    try {
      const bi = await fetchMobileExecutiveAnalytics();
      expect(bi.total_gmv_usd).toBe(128400);
      expect(bi.momo_conversion_rate).toBe(64.5);

      const videoStatus = await fetchMobileVideoTranscodingStatus("alexnguyen");
      expect(videoStatus.status).toBe("COMPLETED");
      expect(videoStatus.video_url).toBe("https://cdn.belooga.com/pitches/alexnguyen.mp4");

      const suggestions = await fetchMobileSearchSuggestions("Fast");
      expect(suggestions).toEqual(["FastAPI", "Fastify"]);
    } finally {
      setMobileFetchTransportForTesting(null);
    }
  });
});
