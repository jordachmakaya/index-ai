import { test, expect } from '@playwright/test'

// V-001 · FR-2: the first screen (no scroll, no click) states the index-ai gist,
// the status pill, the 4-rung conformance ladder, and a CTA to the spec page.
test('homepage states the gist in the first screen', async ({ page }) => {
  await page.goto('/')

  // First-screen gist: what + why
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toContainText('verifiably readable')
  await expect(page.getByText('index-ai is an open specification')).toBeVisible()

  // Status pill 1.0-rc1 · RFC
  await expect(page.getByText('1.0-rc1 · RFC').first()).toBeVisible()

  // Conformance ladder: 4 rungs (1 → 2a → 2b → 3)
  await expect(page.getByText('AI Manifest')).toBeVisible()
  await expect(page.getByText('Agent Index')).toBeVisible()
  await expect(page.getByText('Agent Graph')).toBeVisible()
  await expect(page.getByText('Query Interface')).toBeVisible()

  // CTA to the spec page
  const cta = page.getByRole('link', { name: 'Read the specification' })
  await expect(cta).toBeVisible()
  await expect(cta).toHaveAttribute('href', '/spec/')

  // Hero video present (16:9 asset, no cropping)
  const video = page.locator('video')
  await expect(video).toBeVisible()

  // v4 two-column hero: copy column + media column side by side at desktop
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const hero = page.locator('.hero')
  const copyBox = await page.locator('.hero-copy').boundingBox()
  const mediaBox = await page.locator('.hero-media').boundingBox()
  expect(copyBox && mediaBox && copyBox.x < mediaBox.x).toBe(true)

  // nav CTA "Read the spec" (validated v4 nav)
  await expect(page.getByRole('link', { name: 'Read the spec' }).first()).toBeVisible()
})

test('hero video keeps a 16:9 ratio (no cropping) and the page never overflows at 320px', async ({ page }) => {
  await page.goto('/')

  const ratio = await page.locator('video').evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height)
  expect(ratio).toBeGreaterThan(1.7)
  expect(ratio).toBeLessThan(1.85)

  // 320px viewport: no horizontal overflow (the v4 lesson — bounded bleed)
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  // The video carries native controls (v4) — no cropping, sound affordance
  const controls = await page.locator('video').getAttribute('controls')
  expect(controls).not.toBeNull()
})
