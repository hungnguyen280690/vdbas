import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HTML_DIR = path.resolve(__dirname, '../../file/req/01-inputs/layout')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx --yes serve "${HTML_DIR}" -p 8080 --no-clipboard`,
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 15000,
  },
  reporter: [['html'], ['json', { outputFile: 'test-results/fidelity-report.json' }]],
})
