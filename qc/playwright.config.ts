import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['camera', 'microphone'],
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // Strict 1% visual delta tolerance
    },
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      },
    },
    {
      name: 'Desktop WebKit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 }
      },
    },
    {
      name: 'Tablet iPad',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 768, height: 1024 }
      },
    },
    {
      name: 'Mobile Phone',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 }
      },
    },
  ],
});
