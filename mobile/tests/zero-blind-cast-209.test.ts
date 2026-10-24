import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  clearSecureVaultForTesting,
  SecureStore,
  type SecureVaultAdapter,
} from "../src/lib/native-runtime";
import {
  type MobileUserInput,
  normalizeMobileUser,
} from "../src/store/auth-store";

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

describe("[BEL-232] (#209) Zero Blind Double-Cast & MobileUserInput Type Safety", () => {
  it("normalizes typed MobileUserInput and snake_case UserProfileDTO directly without double casts", () => {
    const dtoInput: MobileUserInput = {
      id: "usr_101",
      email: "alex@belooga.com",
      username: "alexnguyen",
      first_name: "Alex",
      last_name: "Nguyen",
      role: "candidate",
      avatar_url: "https://cdn.belooga.com/alex.png",
    };

    const normalized = normalizeMobileUser(dtoInput);
    expect(normalized).toEqual({
      id: "usr_101",
      email: "alex@belooga.com",
      username: "alexnguyen",
      firstName: "Alex",
      lastName: "Nguyen",
      avatarUrl: "https://cdn.belooga.com/alex.png",
      role: "candidate",
    });

    const camelInput: MobileUserInput = {
      id: "usr_202",
      email: "hr@stripe.com",
      username: "stripehr",
      firstName: "Sarah",
      lastName: "Chen",
      role: "employer",
      avatarUrl: null,
    };

    const normalizedEmployer = normalizeMobileUser(camelInput);
    expect(normalizedEmployer).toEqual({
      id: "usr_202",
      email: "hr@stripe.com",
      username: "stripehr",
      firstName: "Sarah",
      lastName: "Chen",
      avatarUrl: undefined,
      role: "employer",
    });

    expect(normalizeMobileUser(null)).toBeNull();
    expect(normalizeMobileUser({})).toBeNull();
  });

  it("types globalThis.ExpoSecureStore via global declaration without blind casting", async () => {
    const adapter: SecureVaultAdapter = {
      async getItemAsync(key: string) {
        return `typed-vault:${key}`;
      },
      async setItemAsync() {},
      async deleteItemAsync() {},
    };

    Reflect.set(globalThis, "ExpoSecureStore", adapter);
    try {
      const value = await SecureStore.getItemAsync("jwt");
      expect(value).toBe("typed-vault:jwt");
    } finally {
      Reflect.set(globalThis, "ExpoSecureStore", undefined);
      await clearSecureVaultForTesting();
    }
  });

  it("enforces 0 occurrences of blind double-casts across mobile/src, mobile/app, and mobile/tests", () => {
    const dirs = [
      join(MOBILE_ROOT, "src"),
      join(MOBILE_ROOT, "app"),
      join(MOBILE_ROOT, "tests"),
    ];
    const files = dirs.flatMap((d) => collectTsFiles(d));
    const blindCastRegex = new RegExp(["as", "unknown", "as"].join("\\s+"));

    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (blindCastRegex.test(src)) {
        offenders.push(file.replace(`${MOBILE_ROOT}/`, ""));
      }
    }

    expect(offenders).toEqual([]);
  });
});
