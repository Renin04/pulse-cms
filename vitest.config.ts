import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // Matches apps/website tsconfig paths ("@/*") so route modules under
      // test resolve their "@/lib/..." imports.
      "@": fileURLToPath(new URL("./apps/website", import.meta.url)),
    },
  },
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["packages/core/src/**/*.ts"],
      exclude: ["packages/core/src/types/**/*.ts"],
    },
  },
});
