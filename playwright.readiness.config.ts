import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/readiness',
  workers: 1,
  timeout: 90000,
  expect: { timeout: 12000 },
  outputDir: 'readiness-results',
  reporter: [['list'], ['json', { outputFile: 'docs/B07_BROWSER_MATRIX.json' }]],
  use: {
    baseURL: process.env.RESOLVE_PREVIEW_URL || 'http://127.0.0.1:3090',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.RESOLVE_PREVIEW_URL
    ? undefined
    : {
        command: 'node scripts/serve.mjs --port 3090',
        url: 'http://127.0.0.1:3090/',
        reuseExistingServer: true,
        timeout: 20000,
      },
  projects: [
    { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
