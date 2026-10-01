import { defineConfig } from "vitest/config";

/**
 * Only `src`. Vitest's default glob matches `*.spec.ts` as well as `*.test.ts`, so without this
 * it picks up the Playwright suite in `e2e/` and fails with "Playwright Test did not expect
 * test() to be called here" - a confusing error for a configuration problem.
 */
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
