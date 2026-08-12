import { defineConfig } from '@playwright/test'

// E2E smoke against the built site (Q7: Playwright). The webServer serves the
// static output of `pnpm docs:build` — no dev server, production-like assertions.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm docs:build && pnpm exec vite preview --outDir docs/.vitepress/dist --base /index-ai/ --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
