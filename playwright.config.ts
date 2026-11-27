import { defineConfig, devices } from '@playwright/test'

// Real-browser smoke tests, run against a production build of the site. The
// real content may have no pieces yet, so scripts/smoke-build.sh runs these
// after building with the fixture pieces. To run them on their own, build
// first (npm run build), then npm run test:browser.
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
