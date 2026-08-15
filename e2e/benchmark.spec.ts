import { expect, test, type Locator, type Page } from '@playwright/test'

// V-007 benchmark — RED phase.
//
// These tests describe the page specified by .shokunin/jobs/ui/V-007-benchmark/JOB.md:
// Catalogue macrostructure, a horizontal chart.js BAR figure leading the page,
// ONE seven-column results table whose Coverage column replaces the 5x5
// citation matrix, and no Stat-Led hero band.
//
// CTO amendment (V-008-type-scale, 2026-08-15): the column width assertion
// below was widened from 64rem to 72rem per JOB.md V-008 §1bis, a dated,
// human-confirmed ruling ("ok pour 72rem, garde cet ordre", 2026-08-14) to
// unify the site's content column — benchmark was the one page still on the
// old 64rem grid. The ≥98% fill assertions this test also carries are
// untouched and still sealed by V-007; only the absolute column width changed.
//
// The published facts (JOB §4) come from benchmark/results/2026-08-12-seed20260813.json
// and are locked by tests/benchmark-full.spec.ts. They are never recomputed here,
// never rounded: the page must render them verbatim.

const PAGE_URL = '/index-ai/benchmark'

/** The five coverage dots, in the fixed order the JOB §3.2 prescribes. */
const TYPES = ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference'] as const

type LevelFacts = {
  level: string
  name: string
  mean: string
  median: string
  min: string
  max: string
  p90: string
  rate: RegExp
  cited: readonly string[]
  notCited: readonly string[]
}

/** JOB §4 — verbatim, in ladder order. */
const LEVELS: readonly LevelFacts[] = [
  { level: 'L0', name: 'HTML', mean: '955', median: '952', min: '908', max: '1021', p90: '989', rate: /100\s*%/, cited: TYPES, notCited: [] },
  { level: 'L1', name: 'Manifest', mean: '145', median: '147', min: '137', max: '153', p90: '150', rate: /40\s*%/, cited: ['identity', 'freshness'], notCited: ['specific-fact', 'listing', 'cross-reference'] },
  { level: 'L2a', name: 'Index', mean: '147', median: '162', min: '92', max: '202', p90: '188', rate: /100\s*%/, cited: TYPES, notCited: [] },
  { level: 'L2b', name: 'Graph', mean: '147', median: '162', min: '92', max: '207', p90: '187', rate: /100\s*%/, cited: TYPES, notCited: [] },
  { level: 'L3', name: 'Query', mean: '210', median: '190', min: '137', max: '302', p90: '292', rate: /100\s*%/, cited: TYPES, notCited: [] },
]

/** The single results table (JOB §3.2). */
function resultsTable(page: Page): Locator {
  return page.getByRole('table', { name: /Per-level results/i })
}

/** The bar figure (JOB §3.1) — `role="img"` + rich aria-label. */
function figure(page: Page): Locator {
  return page.getByRole('img', { name: /tokens per query/i })
}

/**
 * Scroll-reveal (ADR-001 pattern): the chart draws when it enters the viewport.
 * `data-state="drawn"` is the deterministic ready signal the component must expose
 * — a canvas paint is async, the chart instance existing is not.
 */
async function drawnFigure(page: Page): Promise<Locator> {
  const fig = figure(page)
  await expect(fig).toBeVisible()
  await fig.scrollIntoViewIfNeeded()
  await expect(fig).toHaveAttribute('data-state', 'drawn', { timeout: 10_000 })
  return fig
}

/** Poll the canvas until two consecutive frames are identical (animation settled). */
async function settledPixels(canvas: Locator): Promise<string> {
  let last = ''
  await expect
    .poll(
      async () => {
        const now = await canvas.evaluate((el: Element) => (el as HTMLCanvasElement).toDataURL())
        const stable = now === last && now.length > 128
        last = now
        return stable
      },
      { timeout: 15_000, intervals: [300, 300, 300, 500, 500] },
    )
    .toBe(true)
  return last
}

test.describe('benchmark page (V-007)', () => {
  test('keeps the shared page-head voice and narrows to the single 72rem column', async ({ page }) => {
    await page.goto(PAGE_URL)
    // Site cohesion (V-002..V-005 scaffolds) — non-negotiable.
    await expect(page.getByText('index-ai / Benchmark')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Public benchmark' })).toBeVisible()
    await expect(page.getByText('1,250 queries', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('250 synthetic sites', { exact: false }).first()).toBeVisible()

    // JOB §5 — one column, one left edge, one right edge.
    const grid = await page.evaluate(() => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
      const col = document.querySelector('.bmk-page')
      const prose = document.querySelector('.bmk-body > p')
      return {
        colRem: col ? parseFloat(getComputedStyle(col).maxWidth) / rem : -1,
        proseRem: prose ? parseFloat(getComputedStyle(prose).maxWidth) / rem : -1,
      }
    })
    expect(grid.colRem).toBeCloseTo(72, 1)
    expect(grid.proseRem).toBeCloseTo(46, 1)

    // Defect #5 — figures and tables fill the column, no dead space on the right.
    const column = await page.locator('.bmk-page').boundingBox()
    const table = await resultsTable(page).boundingBox()
    const fig = await figure(page).boundingBox()
    const markdownTable = await page.locator('.bmk-body > table').first().boundingBox()
    expect(column).not.toBeNull()
    expect(table).not.toBeNull()
    expect(fig).not.toBeNull()
    expect(markdownTable).not.toBeNull()
    const colWidth = column?.width ?? 0
    expect(table?.width ?? 0).toBeGreaterThanOrEqual(colWidth * 0.98)
    expect(fig?.width ?? 0).toBeGreaterThanOrEqual(colWidth * 0.98)
    expect(markdownTable?.width ?? 0).toBeGreaterThanOrEqual(colWidth * 0.98)
  })

  test('renders every published §13.4 figure verbatim in one seven-column table', async ({ page }) => {
    await page.goto(PAGE_URL)
    const table = resultsTable(page)
    await expect(table).toBeVisible()

    // JOB §3.2 — Level | Mean | Median | Min | Max | p90 | Coverage.
    const headers = table.locator('thead th')
    await expect(headers).toHaveCount(7)
    await expect(headers.nth(1)).toContainText(/Mean/i)
    await expect(headers.nth(2)).toContainText(/Median/i)
    await expect(headers.nth(3)).toContainText(/Min/i)
    await expect(headers.nth(4)).toContainText(/Max/i)
    await expect(headers.nth(5)).toContainText(/p90/i)
    await expect(headers.nth(6)).toContainText(/Coverage/i)
    // No `Serves` column — docs/benchmark.md §Corpus already carries it (JOB §3.2).
    await expect(table.locator('thead')).not.toContainText(/Serves|Artifacts served/i)

    const rows = table.locator('tbody tr')
    await expect(rows).toHaveCount(5)

    for (const [i, lv] of LEVELS.entries()) {
      const cells = rows.nth(i).locator('th, td')
      await expect(cells).toHaveCount(7)
      // Ladder order is part of the Catalogue: five equal items, one per level.
      await expect(cells.nth(0)).toContainText(lv.level)
      await expect(cells.nth(0)).toContainText(lv.name)
      await expect(cells.nth(1)).toHaveText(lv.mean)
      await expect(cells.nth(2)).toHaveText(lv.median)
      await expect(cells.nth(3)).toHaveText(lv.min)
      await expect(cells.nth(4)).toHaveText(lv.max)
      await expect(cells.nth(5)).toHaveText(lv.p90)
      // The rate stays readable TEXT beside the dots (JOB §3.2).
      await expect(cells.nth(6)).toContainText(lv.rate)
    }
  })

  test('renders without undefined, NaN, an uncaught error, or the word "funnel"', async ({ page }) => {
    const crashes: string[] = []
    page.on('pageerror', (err) => crashes.push(err.message))
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
    await drawnFigure(page)

    // Defect #1 shipped `undefined` to production. It must be impossible again:
    // scan the visible text AND every accessible name / tooltip on the page.
    const scan = await page.evaluate(() => {
      const attr = (name: string): string =>
        Array.from(document.querySelectorAll(`[${name}]`))
          .map((el) => el.getAttribute(name) ?? '')
          .join(' | ')
      return { text: document.documentElement.innerText, labels: attr('aria-label'), titles: attr('title') }
    })
    expect(scan.text).not.toMatch(/undefined/i)
    expect(scan.labels).not.toMatch(/undefined/i)
    expect(scan.titles).not.toMatch(/undefined/i)
    expect(scan.text).not.toMatch(/\bNaN\b/)
    expect(scan.labels).not.toMatch(/\bNaN\b/)
    // Defect #2 — the funnel form is retired; nothing on the page still claims one.
    expect(scan.text).not.toMatch(/funnel/i)
    expect(scan.labels).not.toMatch(/funnel/i)
    expect(crashes).toEqual([])
  })

  test('draws a horizontal bar figure whose accessible name carries all five levels', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
    const fig = await drawnFigure(page)

    // JOB §3.1 — bar, not funnel. The component declares the form it drew.
    await expect(fig).toHaveAttribute('data-chart-type', 'bar')
    await expect(fig.locator('canvas')).toHaveCount(1)

    const label = (await fig.getAttribute('aria-label')) ?? ''
    expect(label).not.toMatch(/funnel/i)
    expect(label).toMatch(/token/i)
    // The whisker is a min–max range; a screen-reader user must get it too.
    expect(label).toMatch(/min/i)
    expect(label).toMatch(/max/i)
    for (const lv of LEVELS) {
      expect(label).toContain(lv.level)
      expect(label).toContain(lv.name)
      expect(label).toContain(lv.mean)
      expect(label).toContain(lv.min)
      expect(label).toContain(lv.max)
    }

    // It actually painted — a blank canvas is not a chart.
    const painted = await fig.locator('canvas').evaluate((el: Element) => {
      const c = el as HTMLCanvasElement
      const ctx = c.getContext('2d')
      if (!ctx || c.width === 0 || c.height === 0) return 0
      const { data } = ctx.getImageData(0, 0, c.width, c.height)
      let opaque = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) opaque++
      return opaque
    })
    expect(painted).toBeGreaterThan(1000)
  })

  test('drops the V-006 stat band and the 5×5 citation matrix', async ({ page }) => {
    await page.goto(PAGE_URL)
    // JOB §3.2 — the Stat-Led hero band is deleted (it belonged to the old macrostructure).
    await expect(page.locator('.bmk-stats')).toHaveCount(0)
    await expect(page.locator('.bmk-stat')).toHaveCount(0)
    // Defect #3 — the 25-cell matrix is replaced by the Coverage column.
    await expect(page.getByRole('table', { name: /Citation rate by query type/i })).toHaveCount(0)
    // Exactly three tables survive: the results table + Corpus + Methodology.
    await expect(page.locator('table')).toHaveCount(3)
  })

  test('makes coverage readable by a screen reader, with a legend naming the dot order', async ({ page }) => {
    await page.goto(PAGE_URL)
    const rows = resultsTable(page).locator('tbody tr')

    for (const [i, lv] of LEVELS.entries()) {
      const coverage = rows.nth(i).locator('th, td').nth(6)
      // The dots are an image; the rate beside them stays text (JOB §3.2).
      const dots = coverage.getByRole('img')
      await expect(dots).toHaveCount(1)
      const label = (await dots.getAttribute('aria-label')) ?? ''
      for (const type of lv.cited) expect(label).toContain(type)
      for (const type of lv.notCited) expect(label).toContain(type)
      if (lv.notCited.length > 0) {
        // L1's scoped contract: the three it does NOT cite must be named as such.
        expect(label).toMatch(/not cited/i)
      } else {
        expect(label).not.toMatch(/not cited/i)
      }
      expect(await coverage.innerText()).toMatch(lv.rate)
    }

    // A legend names the fixed dot order, as visible text (not only in aria).
    const visible = await page.evaluate(() => document.documentElement.innerText)
    expect(visible).toMatch(
      /identity[\s\S]*freshness[\s\S]*specific-fact[\s\S]*listing[\s\S]*cross-reference/i,
    )
  })

  test('never overflows horizontally at 320 / 375 / 414 / 768 px', async ({ page }) => {
    for (const width of [320, 375, 414, 768]) {
      await page.setViewportSize({ width, height: 720 })
      await page.goto(PAGE_URL)
      await expect(resultsTable(page)).toBeVisible()
      // The Coverage column survives the narrow layout — it is the only place the
      // citation signal lives now that the 5×5 matrix is gone.
      await expect(resultsTable(page).locator('thead th').nth(6)).toContainText(/Coverage/i)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `page overflows at ${width}px`).toBeLessThanOrEqual(0)
      // Wide tables scroll inside their own container only — never the document.
      const pageLevelScrollers = await page.evaluate(() =>
        Array.from(document.querySelectorAll('html, body')).filter(
          (el) => el.scrollWidth - el.clientWidth > 1,
        ).length,
      )
      expect(pageLevelScrollers, `document scrolls sideways at ${width}px`).toBe(0)
    }
  })

  test('leads with the figure: the results come before "What it measures"', async ({ page }) => {
    await page.goto(PAGE_URL)
    const order = await page.evaluate(() => {
      const fig = Array.from(document.querySelectorAll('[role="img"]')).find((el) =>
        /tokens per query/i.test(el.getAttribute('aria-label') ?? ''),
      )
      const heading = Array.from(document.querySelectorAll('h2')).find((h) =>
        /What it measures/i.test(h.textContent ?? ''),
      )
      const firstTable = document.querySelector('table')
      return {
        found: Boolean(fig && heading),
        figureBeforeHeading: Boolean(
          fig && heading && fig.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        firstTableIsResults: /Per-level results/i.test(firstTable?.getAttribute('aria-label') ?? ''),
      }
    })
    expect(order.found).toBe(true)
    expect(order.figureBeforeHeading).toBe(true)
    expect(order.firstTableIsResults).toBe(true)

    // JOB §6 — the page's most important nuance must survive the rewrite.
    const prose = await page.evaluate(() => document.documentElement.innerText)
    expect(prose).toMatch(/scoped contract/i)
    expect(prose).toMatch(/by design/i)
    expect(prose).toMatch(/no content/i)
  })

  test('repaints the chart when the theme flips to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
    const fig = await drawnFigure(page)
    const canvas = fig.locator('canvas')
    const light = await settledPixels(canvas)

    await page.getByRole('switch', { name: /dark mode/i }).click()
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)

    const dark = await settledPixels(canvas)
    // The tokens are re-read on `.dark` change — the figure cannot be identical.
    expect(dark).not.toBe(light)
    await expect(fig).toHaveAttribute('data-state', 'drawn')
    await expect(fig).toHaveAttribute('data-chart-type', 'bar')
    await expect(resultsTable(page)).toBeVisible()
  })

  test('still draws a static figure under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
    const fig = await drawnFigure(page)
    await expect(fig).toHaveAttribute('data-chart-type', 'bar')
    const painted = await fig.locator('canvas').evaluate((el: Element) => {
      const c = el as HTMLCanvasElement
      const ctx = c.getContext('2d')
      if (!ctx || c.width === 0 || c.height === 0) return 0
      const { data } = ctx.getImageData(0, 0, c.width, c.height)
      let opaque = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) opaque++
      return opaque
    })
    expect(painted).toBeGreaterThan(1000)
  })

  test('server-renders the results table so a crawler reads the facts without JS', async ({ page }) => {
    const res = await page.request.get(PAGE_URL)
    expect(res.ok()).toBe(true)
    const html = await res.text()
    // The table is the accessible source of truth (ADR-001) — it must exist pre-hydration.
    expect(html).toContain('Per-level results')
    for (const lv of LEVELS) {
      expect(html).toContain(lv.mean)
      expect(html).toContain(lv.p90)
    }
    // The coverage dots ship their accessible name in the SSR output.
    expect(html).toMatch(/not cited/i)
    // The deleted V-006 band leaves no trace in the markup.
    expect(html).not.toContain('bmk-stats')
  })
})
