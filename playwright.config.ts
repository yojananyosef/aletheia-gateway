import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build fresco + estático en foreground (ver e2e/server.ts).
    command: 'bun run build && bun run preview:e2e',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
