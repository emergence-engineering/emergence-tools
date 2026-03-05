import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "whoWroteWhat",
      testDir: "./e2e/tests",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3334",
      },
    },
  ],

  webServer: [
    {
      command: "pnpm e2e:server",
      url: "http://localhost:3334",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
