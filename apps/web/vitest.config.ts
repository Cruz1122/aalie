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
      "@aa/content-catalog": path.resolve(
        __dirname,
        "../../packages/content-catalog/src/index.ts",
      ),
    },
  },
});
