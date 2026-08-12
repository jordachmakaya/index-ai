import { test, expect } from '@playwright/test'

// V-003 quickstart: copyable sequence ending in the npx command; the validator
// block renders its four deterministic demo states; posture = npx in the
// reader's terminal (never embedded).
test.describe('quickstart page (V-003)', () => {
  test('the copyable sequence ends with the npx validator command', async ({ page }) => {
    await page.goto('/index-ai/quickstart')
    // page head (v4 crumb + title)
    await expect(page.locator('.crumb')).toContainText('Quickstart')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Implement index-ai on your site')
    // four numbered step bands, ending with the validator
    const steps = ['Add the AI Manifest', 'Expose clean content endpoints', 'Build the Agent Index', 'Run the validator']
    for (const h of steps) {
      await expect(page.getByRole('heading', { name: new RegExp(h) }).first()).toBeVisible()
    }
    await expect(page.getByText('@hardmachinelabs/index-ai-validator')).toBeVisible()
    await expect(page.getByText('validate https://your-site.com')).toBeVisible()
    // copy-pasteable: every code block (3 steps + the scoped-discovery tip) carries a Copy button
    await expect(page.locator('.vp-adaptive-theme button.copy')).toHaveCount(4)
  })

  test('validator block shows the verdict state by default (valid to ship)', async ({ page }) => {
    await page.goto('/index-ai/quickstart')
    const block = page.getByRole('tabpanel', { name: /Validator/ })
    await expect(block).toContainText('Conformance: Level 2a')
    await expect(block).toContainText('valid to ship')
  })

  test('all four states are switchable and deterministic', async ({ page }) => {
    await page.goto('/index-ai/quickstart')
    const tabs = page.getByRole('tablist', { name: 'Validator output states' })
    const block = page.getByRole('tabpanel', { name: /Validator/ })

    await tabs.getByRole('tab', { name: 'Loading' }).click()
    await expect(block.locator('.shimmer').first()).toBeVisible()

    await tabs.getByRole('tab', { name: 'Empty' }).click()
    await expect(block).toContainText('No index-ai manifest found')
    // the empty state's back-link targets a real anchor on the page
    const back = block.getByRole('link', { name: 'Back to step 1' })
    await expect(back).toBeVisible()
    expect(await back.getAttribute('href')).toBe('#step-1')
    const hasAnchor = await page.evaluate(() => document.getElementById('step-1') !== null)
    expect(hasAnchor).toBe(true)

    await tabs.getByRole('tab', { name: 'Data (pass)' }).click()
    await expect(block).toContainText('valid to ship')

    await tabs.getByRole('tab', { name: 'Error (fail)' }).click()
    await expect(block).toContainText('identity.domain missing')
    await expect(block).toContainText('content_chars_mode missing')
    await expect(block).toContainText('Level 0 — not conformant')
  })

  test('coexistence and partial-conformance notes are present (edge cases)', async ({ page }) => {
    await page.goto('/index-ai/quickstart')
    await expect(page.getByText('Partial conformance is valid to ship')).toBeVisible()
    await expect(page.getByText('index-ai coexists with both')).toBeVisible()
  })
})
