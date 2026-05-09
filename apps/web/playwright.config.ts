import { defineConfig, devices } from "@playwright/test";

/**
 * Recursive Invariant E2E Test Configuration
 *
 * This configuration runs tests against the AALIE analyzer frontend,
 * validating the full recursive invariant workflow.
 */

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*recursive*.spec.ts",

  // Run tests in 3 workers by default
  fullyParallel: true,
  workers: process.env.CI ? 1 : 3,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  // Shared settings for all projects
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Test projects (browsers)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  // Web Server Configuration
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Reporter configuration
  reporter: [
    ["html"],
    ["list"],
    ...(process.env.CI ? [["github"]] : []),
  ],
});
