import { defineConfig } from 'vitest/config'

// vitest runs ONLY the unit tests under tests/ — the e2e/*.spec.ts files are
// Playwright's (pnpm test:e2e) and must never be collected by vitest.
export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
  },
})
