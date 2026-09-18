import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The client is runtime-agnostic and every dependency is injected, so the
    // tests need no DOM — only fetch/Headers/Response/FormData, which Node 20
    // provides natively.
    environment: "node",
    coverage: { provider: "v8", include: ["src/**/*.ts"], exclude: ["src/**/*.test.ts"] },
  },
});
