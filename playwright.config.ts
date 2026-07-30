import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

const PORT = 3987;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * End-to-end coverage of the one flow the business depends on:
 * home page → quote form → submitted request → confirmation.
 *
 * Runs against `next dev` by default so a full production build isn't needed
 * locally; point `E2E_BASE_URL` at a preview deployment to run it there.
 * A `DATABASE_URL` must be reachable — the submission test writes a real row.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'fr-CA',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Most contractor traffic is on a phone, so the flow is verified there too.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT}`,
        url: `${baseURL}/fr`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
