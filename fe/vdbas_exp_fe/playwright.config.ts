import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace for all tests. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',

    /* Record video for each test. */
    video: 'on',
    
    /* Set viewport size to standard 1080p for clear screen recording */
    viewport: { width: 1920, height: 1080 },

    /* Ignore HTTPS certificate errors in corporate/intranet environment */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
