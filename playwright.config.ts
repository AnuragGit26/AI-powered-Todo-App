import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5175',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    launchOptions: {
      // Disable slow motion on CI to avoid tests appearing to be stuck.
      slowMo: process.env.CI ? 0 : 100,
    },
  },

  /* Configure projects for major browsers */
  projects: process.env.CI
    ? [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ]
    : [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },

      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },

      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },

      /* Test against mobile viewports. */
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 8'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 14'] },
      },

      /* Test against branded browsers. */
      // {
      //   name: 'Microsoft Edge',
      //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
      // },
      // {
      //   name: 'Google Chrome',
      //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      // },
    ],

  webServer: {
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    // Allow extra time on CI for the dev server to compile
    timeout: 180 * 1000,
  },
});
