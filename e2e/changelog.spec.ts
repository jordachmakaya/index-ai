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

  test('version index: two hairline-ruled entries with typed changes', async ({ page }) => {
    await page.goto('/index-ai/changelog')
    // index-first rows: one per published version, RC first (newest)
    const entries = page.locator('.ventry')
    await expect(entries).toHaveCount(2)
    await expect(entries.nth(0).locator('.ventry-ver')).toHaveText('1.0-rc1')
    await expect(entries.nth(0).locator('.ventry-status')).toHaveText('RC')
    await expect(entries.nth(1).locator('.ventry-ver')).toHaveText('0.6')
    await expect(entries.nth(1).locator('.ventry-status')).toHaveText('Draft')
    // typed change list: 6 Added (4 in rc1 + 2 in 0.6), 1 Fixed (facts from the SPEC §18)
    await expect(entries.locator('.vtag.add')).toHaveCount(6)
    await expect(entries.locator('.vtag.fix')).toHaveCount(1)
    // the Fixed entry is the v0.6 breaking change
    await expect(entries.locator('.vtag.fix').first()).toContainText('Fixed')
    await expect(entries.nth(0)).toContainText('breaking change from v0.6')
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

  test('no invented dates: the rc1 entry references the SPEC frontmatter', async ({ page }) => {
    await page.goto('/index-ai/changelog')
    await expect(page.getByText('exact public date is set in the SPEC frontmatter')).toBeVisible()
  })
})
