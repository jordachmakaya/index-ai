import { test, expect } from '@playwright/test'

// V-002 spec page: TOC visible, each anchor links into the canonical spec,
// the four level cards present, and the status label rendered.
test.describe('specification page (V-002)', () => {
  test('renders the TOC, four level cards, and the status label', async ({ page }) => {
    await page.goto('/spec/')
    const toc = page.getByRole('navigation', { name: 'Table of contents' })
    await expect(toc).toBeVisible()
    // level cards 1 / 2a / 2b / 3
    await expect(page.locator('.level-card')).toHaveCount(4)
    await expect(page.locator('.level-card').first()).toContainText('AI Manifest')
    await expect(page.locator('.level-card').last()).toContainText('Query Interface')
    // meta row: version + status
    await expect(page.locator('.meta-row')).toContainText('1.0-rc1')
    await expect(page.locator('.meta-row')).toContainText('REQUEST FOR COMMENTS')
  })

  test('level links point into the canonical spec anchors', async ({ page }) => {
    await page.goto('/spec/')
    const firstLevel = page.locator('.level-card').first()
    const href = await firstLevel.getAttribute('href')
    expect(href).toMatch(/\/spec\/SPEC-v1\.0-rc1#_6-level-1/)
    // follow it: the target section heading exists on the canonical page
    await firstLevel.click()
    await expect(page).toHaveURL(/#_6-level-1/)
    await expect(page.getByRole('heading', { level: 2, name: /6\. Level 1 — AI Manifest/ })).toBeVisible()
  })

  test('TOC links include security, privacy and changelog sections', async ({ page }) => {
    await page.goto('/spec/')
    const toc = page.getByRole('navigation', { name: 'Table of contents' })
    for (const label of ['Security', 'Privacy', 'Changelog', 'Level 1', 'Level 3']) {
      await expect(toc.getByRole('link', { name: new RegExp(label) }).first()).toBeVisible()
    }
  })
})
