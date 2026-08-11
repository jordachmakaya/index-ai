import { test, expect } from '@playwright/test'

// V-005 changelog: at least one versioned dated entry, the status label,
// maturity matrix, and no invented versions/dates (facts from the SPEC).
test.describe('changelog page (V-005)', () => {
  test('shows a versioned entry consistent with the SPEC', async ({ page }) => {
    await page.goto('/changelog')
    await expect(page.getByRole('heading', { name: '1.0-rc1 — Request for Comments' })).toBeVisible()
    await expect(page.getByText('1.0-rc1', { exact: true }).first()).toBeVisible()
    // facts traceable to the spec: conformance ladder + content_chars
    await expect(page.getByText('conformance ladder: Level 1')).toBeVisible()
    await expect(page.getByText('content_chars contract')).toBeVisible()
  })

  test('shows the maturity matrix', async ({ page }) => {
    await page.goto('/changelog')
    const table = page.getByRole('table')
    await expect(table).toContainText('Normative text')
    await expect(table).toContainText('Tested')
    await expect(table).toContainText('Proposed')
  })

  test('status label is consistent with the header pill (edge case 3)', async ({ page }) => {
    await page.goto('/changelog')
    await expect(page.getByText('1.0-rc1 · RFC').first()).toBeVisible()
    // no invented dates: the rc1 entry references the SPEC frontmatter
    await expect(page.getByText('exact public date is set in the SPEC frontmatter')).toBeVisible()
  })
})
