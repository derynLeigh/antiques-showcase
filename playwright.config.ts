import { defineConfig, devices } from '@playwright/test'

// Real-browser smoke tests, run against a production build of the site. They
// need the fixture pieces, so run them with npm run test:build: the smoke
// build builds with the fixtures, then runs these before removing them. (npm
// run test:browser alone runs them against whatever is in .next, which has no
// pieces after a normal build.)
//
// Tests live in e2e/, outside src/, so Vitest never picks them up.
export default defineConfig({
  testDir: 'e2e',
  // A test.only left in by mistake fails CI rather than skipping the rest.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3100',
    // A missing link or button fails in seconds, not at the test's timeout.
    actionTimeout: 5_000,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    // Safari's engine on an iPhone-sized screen: the closest to what many
    // visitors will use.
    { name: 'iphone-webkit', use: { ...devices['iPhone 15'] } },
  ],
  // Its own port, so a dev server on 3000 doesn't get in the way.
  webServer: {
    command: 'npx next start --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
  },
})
