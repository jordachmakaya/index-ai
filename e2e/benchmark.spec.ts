import { test, expect } from '@playwright/test'

// V-006 benchmark: the published §13.4 numbers are FACTS from the run
// (results/2026-08-12-seed20260813.json, locked by tests/benchmark-full.spec.ts)
// — the page must render them verbatim, in the v4 page-head voice, without
// breaking the 320px overflow rule.
test.describe('benchmark page (V-006)', () => {
  test('shows the v4 page head and the run scope', async ({ page }) => {
    await page.goto('/index-ai/benchmark')
    await expect(page.getByText('index-ai / Benchmark')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Public benchmark' })).toBeVisible()
    await expect(page.getByText('1,250 queries', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('250 synthetic sites', { exact: false }).first()).toBeVisible()
  })

  test('per-level table carries the published token numbers and citation rates', async ({ page }) => {
    await page.goto('/index-ai/benchmark')
    const table = page.getByRole('table', { name: 'Per-level results — tokens and citation rate' })
    await expect(table).toBeVisible()
    // L0 reference baseline (955 mean) and L1's scoped contract (40% overall)
    await expect(table).toContainText('955')
    await expect(table).toContainText('40%')
    // L2a/L2b at ~15% of L0, L3 at 22%
    await expect(table).toContainText('147')
    await expect(table).toContainText('210')
    // five level rows
    await expect(table.locator('tbody tr')).toHaveCount(5)
  })

  test('citation matrix shows L1 = 0% on content query types by design', async ({ page }) => {
    await page.goto('/index-ai/benchmark')
    const matrix = page.getByRole('table', { name: 'Citation rate by query type and level' })
    await expect(matrix).toBeVisible()
    const l1 = matrix.locator('tbody tr').filter({ hasText: 'L1' })
    await expect(l1).toContainText('100%')
    await expect(l1).toContainText('0%')
    // every other level cites 100% across all five types
    const others = matrix.locator('tbody tr').filter({ hasNotText: 'L1' })
    await expect(others).toHaveCount(4)
    for (const row of await others.all()) {
      await expect(row.getByText('100%')).toHaveCount(5)
    }
  })

  test('stat band leads with the headline results (Stat-Led, each figure worded)', async ({ page }) => {
    await page.goto('/index-ai/benchmark')
    const band = page.locator('.bmk-stats')
    await expect(band).toBeVisible()
    await expect(band.locator('.bmk-stat')).toHaveCount(4)
    // the three efficiency ratios + the corpus size, each with its words
    await expect(band.getByText('6.6×', { exact: true })).toBeVisible()
    await expect(band.getByText('6.5×', { exact: true })).toBeVisible()
    await expect(band.getByText('4.6×', { exact: true })).toBeVisible()
    await expect(band.getByText('250', { exact: true })).toBeVisible()
    await expect(band).toContainText('Token cut vs raw HTML')
    await expect(band).toContainText('Synthetic sites, 50 per level')
  })

  test('token-cost chart renders the published means (hand-built, accessible)', async ({ page }) => {
    await page.goto('/index-ai/benchmark')
    const chart = page.getByRole('img', { name: /Token consumption per query/ })
    await expect(chart).toBeVisible()
    await expect(chart.locator('.tok-row')).toHaveCount(5)
    // the published mean tokens, level by level
    await expect(chart.locator('.tok-level').nth(0)).toContainText('L0')
    await expect(chart.locator('.tok-val').nth(0)).toHaveText('955')
    await expect(chart.locator('.tok-val').nth(1)).toHaveText('145')
    await expect(chart.locator('.tok-val').nth(4)).toHaveText('210')
    // L0 is the reference baseline: its bar is the widest
    const widths = await chart.locator('.tok-bar').evaluateAll((bars) => bars.map((b) => b.getBoundingClientRect().width))
    expect(Math.max(...widths)).toBe(widths[0])
  })

  test('page never overflows at 320px (wide tables scroll inside their containers)', async ({ page }) => {
    await page.goto('/index-ai/benchmark')
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/index-ai/benchmark')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    // the 40rem tables are reachable by horizontal scroll, not page overflow
    const wrap = page.locator('.bmk-t-wrap').first()
    await expect(wrap).toBeVisible()
    const wrapScrolls = await wrap.evaluate((el) => el.scrollWidth > el.clientWidth)
    expect(wrapScrolls).toBe(true)
  })
})
