import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 2 } : process.platform === 'win32' ? { workers: 1 } : {}),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:14371',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-viewport', use: { ...devices['Pixel 7'] } },
  ],
  webServer:
    process.env.ZEROCLOUD_EXTERNAL_SERVERS === '1'
      ? []
      : {
          command: 'bun run --filter @zerocloud/share-web dev --port 14371',
          url: 'http://127.0.0.1:14371',
          reuseExistingServer: false,
          timeout: 30_000,
        },
});
