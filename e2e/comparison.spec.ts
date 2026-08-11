import { test, expect } from '@playwright/test'

// V-004 comparison: at least one concrete distinction, the coexistence
// statement, and a semantic table.
test.describe('comparison page (V-004)', () => {
  test('shows concrete distinctions between index-ai and llms.txt', async ({ page }) => {
    await page.goto('/compare/llms-txt')
    await expect(page.getByRole('heading', { name: 'index-ai vs llms.txt' })).toBeVisible()
    // table is semantic
    const table = page.getByRole('table')
    await expect(table).toBeVisible()
    await expect(table).toContainText('Verification')
    await expect(table).toContainText('Measured and checked')
    await expect(table).toContainText('Declared, never verified')
    await expect(table).toContainText('Known before fetch')
  })

  test('states the one-line difference and the coexistence statement', async ({ page }) => {
    await page.goto('/compare/llms-txt')
    await expect(page.getByText('The one-line difference')).toBeVisible()
    await expect(page.getByText('tells an agent what content exists')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Do they coexist?' })).toBeVisible()
    await expect(page.getByText('Yes — index-ai is additive.')).toBeVisible()
    // edge case 2: explicit non-replacement
    await expect(page.getByText('Not a replacement, not a fork')).toBeVisible()
  })

  test('facts link to the canonical spec compatibility section', async ({ page }) => {
    await page.goto('/compare/llms-txt')
    const link = page.getByRole('link', { name: /16 Compatibility/ })
    await expect(link).toBeVisible()
    expect(await link.getAttribute('href')).toMatch(/SPEC-v1\.0-rc1#_16-compatibility/)
  })
})
