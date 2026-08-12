import { test, expect } from '@playwright/test'

// V-005 changelog: at least one versioned dated entry, the status label,
// maturity matrix, and no invented versions/dates (facts from the SPEC).
test.describe('changelog page (V-005)', () => {
  test('shows a versioned entry consistent with the SPEC', async ({ page }) => {
    await page.goto('/index-ai/changelog')
    // v4 page-head (V-005 scaffold, same voice as V-002..V-004)
    await expect(page.getByText('index-ai / Changelog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '1.0-rc1 — Request for Comments' })).toBeVisible()
    await expect(page.getByText('1.0-rc1', { exact: true }).first()).toBeVisible()
    // facts traceable to the spec: conformance ladder + content_chars
    await expect(page.getByText('conformance ladder: Level 1')).toBeVisible()
    await expect(page.getByText('content_chars contract')).toBeVisible()
  })

  test('version index: three hairline-ruled entries with typed changes', async ({ page }) => {
    await page.goto('/index-ai/changelog')
    // index-first rows: one per published version, newest first (rc2 → rc1 → 0.6)
    const entries = page.locator('.ventry')
    await expect(entries).toHaveCount(3)
    await expect(entries.nth(0).locator('.ventry-ver')).toHaveText('1.0-rc2')
    await expect(entries.nth(0).locator('.ventry-status')).toHaveText('RC')
    await expect(entries.nth(1).locator('.ventry-ver')).toHaveText('1.0-rc1')
    await expect(entries.nth(1).locator('.ventry-status')).toHaveText('RC')
    await expect(entries.nth(2).locator('.ventry-ver')).toHaveText('0.6')
    await expect(entries.nth(2).locator('.ventry-status')).toHaveText('Draft')
    // typed change list: 9 Added (3 in rc2 + 4 in rc1 + 2 in 0.6), 3 Fixed (facts from SPEC §18)
    await expect(entries.locator('.vtag.add')).toHaveCount(9)
    await expect(entries.locator('.vtag.fix')).toHaveCount(3)
    // the first Fixed entry belongs to the newest release (rc2 discovery fix)
    await expect(entries.locator('.vtag.fix').first()).toContainText('Fixed')
    await expect(entries.nth(0)).toContainText('discovery profiles')
    await expect(entries.nth(1)).toContainText('breaking change from v0.6')
  })

  test('shows the maturity matrix (v4 4-card grid)', async ({ page }) => {
    await page.goto('/index-ai/changelog')
    const grid = page.locator('.maturity-grid')
    await expect(grid).toBeVisible()
    await expect(grid).toContainText('Normative text')
    await expect(grid).toContainText('Tested')
    await expect(grid).toContainText('Proposed')
    // exactly four cards, one per artifact
    await expect(grid.locator('.maturity-card')).toHaveCount(4)
  })

  test('the rc1 entry carries the real public date (matches SPEC §18.1)', async ({ page }) => {
    await page.goto('/index-ai/changelog')
    // real release dates now published (SPEC §18.1 table) — no invented placeholders
    // (both rc2 and rc1 carry the date, so resolve the first match)
    await expect(page.getByText('Published 2026-08-12').first()).toBeVisible()
    await expect(page.getByText('SPEC §18.1').first()).toBeVisible()
  })
})
