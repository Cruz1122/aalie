import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.ts", "src/**/*.{test,spec}.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@aa/grammar": path.resolve(__dirname, "../../packages/grammar/index.ts"),
      "@aa/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@aa/content-catalog/server": path.resolve(
        __dirname,
        "../../packages/content-catalog/src/server.ts",
      ),
      "@aa/content-catalog/terms": path.resolve(
        __dirname,
        "../../packages/content-catalog/src/terms.ts",
      ),
      "@aa/content-catalog/types": path.resolve(
        __dirname,
        "../../packages/content-catalog/src/types.ts",
      ),
      "@aa/content-catalog/utils": path.resolve(
        __dirname,
        "../../packages/content-catalog/src/utils.ts",
      ),
      "@aa/content-catalog": path.resolve(
        __dirname,
        "../../packages/content-catalog/src/index.ts",
      ),
    },
  },
});
