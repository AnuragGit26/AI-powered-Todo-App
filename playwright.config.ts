import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100,
    },
  },

  projects: process.env.CI
    ? [
      // 1) Setup project: performs login and saves storage state
      {
        name: 'setup',
        testMatch: /.*auth\.setup\.ts/,
        use: { ...devices['Desktop Chrome'] },
      },
      // 2) Auth UI project: runs auth.spec.ts independently (no storage state)
      {
        name: 'auth-ui',
        testMatch: /.*auth\.spec\.ts/,
        use: { ...devices['Desktop Chrome'] },
      },
      // 3) Main browser project(s) depending on setup and reusing storage state
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
        testIgnore: /.*auth\.(?:setup|spec)\.ts/,
      },
    ]
    : [
      // 1) Setup project: performs login and saves storage state
      {
        name: 'setup',
        testMatch: /.*auth\.setup\.ts/,
        use: { ...devices['Desktop Chrome'] },
      },
      // 2) Auth UI project: runs auth.spec.ts independently (no storage state)
      {
        name: 'auth-ui',
        testMatch: /.*auth\.spec\.ts/,
        use: { ...devices['Desktop Chrome'] },
      },
      // 3) Main browser projects depending on setup and reusing storage state
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
        testIgnore: /.*auth\.(?:setup|spec)\.ts/,
      },

      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
        testIgnore: /.*auth\.(?:setup|spec)\.ts/,
      },

      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
        testIgnore: /.*auth\.(?:setup|spec)\.ts/,
      },

      /* Test against mobile viewports. */
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 8'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
        testIgnore: /.*auth\.(?:setup|spec)\.ts/,
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 14'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
        testIgnore: /.*auth\.(?:setup|spec)\.ts/,
      },

    ],

  webServer: {
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
