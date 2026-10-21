declare var process: {
  env: Record<string, string | undefined>;
};

interface ImportMeta {
  dir: string;
}

declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function expect<T>(actual: T): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(expected: number): void;
    toContain(expected: unknown): void;
    rejects: {
      toThrow(expected?: string | RegExp): Promise<void>;
    };
  };
}
