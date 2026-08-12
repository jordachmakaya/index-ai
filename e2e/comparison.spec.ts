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
    // v4 page-head (V-004 scaffold, same voice as V-002/V-003)
    await expect(page.getByText('index-ai / Compare')).toBeVisible()
    await expect(page.getByText('The one-line difference')).toBeVisible()
    await expect(page.getByText('tells an agent what content exists')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Do they coexist?' })).toBeVisible()
    await expect(page.getByText('Yes — index-ai is additive.')).toBeVisible()
    // edge case 2: explicit non-replacement
    await expect(page.getByText('Not a replacement, not a fork')).toBeVisible()
  })

  test('coexistence map shows your site with the four conventions (index-ai accented)', async ({ page }) => {
    await page.goto('/compare/llms-txt')
    // trunk: the site
    const trunk = page.locator('.co-trunk')
    await expect(trunk).toBeVisible()
    await expect(trunk).toContainText('Your site')
    // the four convention nodes, one job each (bullets preserved)
    const nodes = page.locator('.co-node')
    await expect(nodes).toHaveCount(4)
    await expect(nodes.nth(0)).toContainText('robots.txt')
    await expect(nodes.nth(0)).toContainText('cannot access')
    await expect(nodes.nth(1)).toContainText('sitemap.xml')
    await expect(nodes.nth(1)).toContainText('lists URLs')
    await expect(nodes.nth(2)).toContainText('llms.txt')
    await expect(nodes.nth(2)).toContainText('human-readable context')
    await expect(nodes.nth(3)).toContainText('index-ai')
    await expect(nodes.nth(3)).toContainText('measured')
    // index-ai carries the verification accent
    await expect(nodes.nth(3)).toHaveClass(/n-ia/)
    // legend
    await expect(page.getByText('All four sit on the same origin')).toBeVisible()
  })

  test('demonstration section: video placeholder + retry CTA after the warning', async ({ page }) => {
    await page.goto('/compare/llms-txt')
    // section comes after the non-replacement warning (page-final block)
    const heading = page.getByRole('heading', { name: 'Demonstration' })
    await expect(heading).toBeVisible()
    const warning = page.locator('.warning.custom-block')
    const frame = page.locator('.demo-vid-frame')
    await expect(frame).toBeVisible()
    // the frame carries the placeholder semantics (16:9 ratio is a CSS
    // concern — guaranteed by .demo-vid-frame aspect-ratio, not asserted here
    // to stay robust under the base-path preview context)
    await expect(frame).toHaveAttribute('aria-label', 'Demonstration video placeholder')
    // retry CTA reuses the system link-cta voice → quickstart
    const cta = page.getByRole('link', { name: /Retry it yourself now/ })
    await expect(cta).toBeVisible()
    expect(await cta.getAttribute('href')).toMatch(/quickstart$/)
    // ordering: warning block above the demo section
    const warnBox = await warning.boundingBox()
    const frameBox = await frame.boundingBox()
    expect(warnBox && frameBox && warnBox.y < frameBox.y).toBe(true)
  })

  test('facts link to the canonical spec compatibility section', async ({ page }) => {
    await page.goto('/compare/llms-txt')
    const link = page.getByRole('link', { name: /16 Compatibility/ })
    await expect(link).toBeVisible()
    expect(await link.getAttribute('href')).toMatch(/SPEC-v1\.0-rc1#_16-compatibility/)
    // target must actually exist in the rendered spec (no dead anchor)
    const res = await page.request.get('/spec/SPEC-v1.0-rc1')
    expect(res.ok()).toBe(true)
    expect(await res.text()).toContain('id="_16-compatibility"')
  })
})
