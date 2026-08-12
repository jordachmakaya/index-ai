import { defineConfig } from '@playwright/test'

// E2E smoke against the built site (Q7: Playwright). The webServer serves the
// static output of `pnpm docs:build` via the project's own preview script
// (vitepress preview reads the /index-ai/ base from config.mts) — no `vite`
// binary, no dev server, production-like assertions under the Pages base.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/index-ai/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm docs:build && pnpm docs:preview --port 4173 --strictPort',
    url: 'http://localhost:4173/index-ai/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
