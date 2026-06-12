import { defineConfig, devices } from '@playwright/test'

// E2E against real backend — auth via real Keycloak (VITE_MOCK_AUTH=false).
// Prerequisites: quantri_be:8082 and exp_be:8085 must already be running (make start-be wait-be).
// exp_fe is built then served in preview mode so module federation shared-React works correctly.
export default defineConfig({
  testDir: './tests/real',
  fullyParallel: false,
  retries: 0,
  reporter: 'html',
  timeout: 60_000,

  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'vi-VN',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  webServer: [
    {
      // Build in dev mode (picks up .env.development → localhost:8085/8082) then preview.
      // Preview mode (unlike dev) lets module federation runtime properly share React
      // across host and remote — eliminating the dual-React / Invalid hook call issue.
      command: 'cd ../vdbas_exp_fe && npm run build:dev && npm run preview',
      port: 3003,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'cd ../vdbas_host && npm run dev:e2e',
      port: 3000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
