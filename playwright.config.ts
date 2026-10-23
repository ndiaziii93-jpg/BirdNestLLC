import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the real app against a local Postgres (see README → Tests).
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
    ...(process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'phone', use: { ...devices['iPhone 14'], browserName: 'chromium' }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npx next dev -p 3100',
    url: 'http://localhost:3100/signin',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { AUTH_DISABLED: 'true' },
  },
});
