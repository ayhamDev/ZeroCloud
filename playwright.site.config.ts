import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:14373/publication/';
const shareURL = 'http://127.0.0.1:14375/share-preview/';

export default defineConfig({
  testDir: './tests/site',
  outputDir: './test-results/site',
  fullyParallel: true,
  workers: process.env.CI ? 2 : process.platform === 'win32' ? 1 : 3,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'site-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'site-android-viewport', use: { ...devices['Pixel 7'] } },
  ],
  webServer:
    process.env.ZEROCLOUD_EXTERNAL_SERVERS === '1'
      ? []
      : [
          {
            command: 'node apps/site/scripts/test-server.mjs',
            env: { SITE_URL: shareURL, ZEROCLOUD_APP: 'share', ASTRO_TELEMETRY_DISABLED: '1' },
            url: shareURL,
            reuseExistingServer: false,
            timeout: 120_000,
          },
          {
            command: 'node apps/site/scripts/test-server.mjs',
            env: { SITE_URL: baseURL, ASTRO_TELEMETRY_DISABLED: '1' },
            url: baseURL,
            reuseExistingServer: false,
            timeout: 120_000,
          },
        ],
});
