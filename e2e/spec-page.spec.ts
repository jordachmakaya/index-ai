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

  test('TOC covers the full canonical spec, grouped (Phase C′)', async ({ page }) => {
    await page.goto('/spec/')
    const toc = page.getByRole('navigation', { name: 'Table of contents' })
    // four groups
    for (const g of ['Overview', 'Conformance levels', 'Details', 'Standard']) {
      await expect(toc.getByText(g, { exact: true })).toBeVisible()
    }
    // one link per canonical top-level section (19 links, incl. the 4 levels)
    await expect(toc.locator('a')).toHaveCount(19)
    for (const label of ['1. The Problem This Solves', '3. Terminology', '9. Token Economics', '10. Policy & Usage Preferences', '13. Conformance', '14. Security Considerations', '15. Privacy Considerations', '16. Compatibility', '17. Governance', '18. Changelog', 'Level 1', 'Level 3']) {
      await expect(toc.getByRole('link', { name: new RegExp(label) }).first()).toBeVisible()
    }
  })

  test('every level deep-link target exists in the canonical spec (no dead anchors)', async ({ page }) => {
    // verify the anchor targets exist in the rendered canonical spec before
    // asserting hrefs, so a future heading rename fails CI instead of silently
    // breaking links.
    const slugs = ['_6-level-1-—-ai-manifest', '_7-level-2-—-agent-view', '_8-level-3-—-query-interface', '_1-the-problem-this-solves', '_9-token-economics', '_16-compatibility', '_17-governance', '_18-changelog']
    const res = await page.request.get('/spec/SPEC-v1.0-rc1')
    expect(res.ok()).toBe(true)
    const html = await res.text()
    for (const slug of slugs) {
      expect(html.includes(`id="${slug}"`), `anchor #${slug} must exist in the canonical spec`).toBe(true)
    }
  })
})
