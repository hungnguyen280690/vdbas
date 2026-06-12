import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/mock',
  fullyParallel: false,
  retries: 0,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3003',
    channel: 'chrome',
    headless: true,
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
      command: 'node ../mock-server/server.js',
      port: 9090,
      reuseExistingServer: true,
      timeout: 10_000,
    },
    {
      command: 'cd ../vdbas_exp_fe && npm run dev:mock',
      port: 3003,
      // false: luôn start server mock mới, tránh tái dùng vite preview / dev server sai mode
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
