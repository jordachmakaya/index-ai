import { expect, test, type Page } from '@playwright/test'

// V-008 type scale — RED phase.
//
// These tests describe the type-scale conformance specified by
// .shokunin/jobs/ui/V-008-type-scale/JOB.md: every computed font-size on every
// page collapses onto the five-step scale (12/14/16/24/36px — tokens.json
// global.font.size-100/300/400/600/800), `h2` becomes 24px everywhere, the
// content column is unified to 72rem across all five inner pages (benchmark
// currently 64rem and must widen), mono stays reserved for data and never
// touches prose/ledes/legend sentences/headings, and the theme-toggle knob
// physically moves + swaps its icon on click (JOB §1ter — a real behavioural
// bug, not a markup one).
//
// All numbers below were MEASURED against the live built site 2026-08-15
// (`pnpm docs:build && pnpm docs:preview`, 1440x900 viewport — every clamp()
// on this site saturates to its max bound above ~914px, so 1440 is
// deterministic), not guessed from the JOB doc. Where a measurement disagrees
// with the JOB text, it is called out inline.
//
// Deliberately markup-agnostic where the JOB gives no hook to test against:
// the scale scanner and the mono-on-headings guard walk the DOM by computed
// style, not by class name. The column test is the one exception — the JOB
// itself has no page-content hook other than the five pages' own existing
// column classes (`.bmk-page`, `.qs-page`, `.cmp-page`, `.clog-page`,
// `.spec-layout`), the same precedent e2e/benchmark.spec.ts already set by
// asserting directly against `.bmk-page`.

const HOME = '/index-ai/'

/** The six pages the site renders (same convention as e2e/footer.spec.ts). */
const PAGES = [
  HOME,
  '/index-ai/spec/',
  '/index-ai/quickstart',
  '/index-ai/compare/llms-txt',
  '/index-ai/changelog',
  '/index-ai/benchmark',
] as const

/** JOB §3 — tokens.json global.font.size-100/300/400/600/800. Nothing between. */
const SCALE = [12, 14, 16, 24, 36] as const

type TypeNode = {
  tag: string
  cls: string
  text: string
  fontSize: number
  fontFamily: string
}

/** Walk the live DOM: one entry per element that renders its OWN text directly
 *  (mirrors e2e/footer.spec.ts's `readFooter` walker), with computed font-size
 *  and font-family. This is the scanner JOB §5 asks for. */
async function scanTypography(page: Page): Promise<TypeNode[]> {
  return page.evaluate(() => {
    const nodes: TypeNode[] = []
    const walk = (el: Element): void => {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '')
        .map((n) => (n.textContent ?? '').trim())
        .join(' ')
        .replace(/\s+/g, ' ')
      if (own !== '') {
        const cs = getComputedStyle(el)
        nodes.push({
          tag: el.tagName,
          cls: el.getAttribute('class') ?? '',
          text: own,
          fontSize: parseFloat(cs.fontSize),
          fontFamily: cs.fontFamily,
        })
      }
      for (const child of Array.from(el.children)) walk(child)
    }
    walk(document.body)
    return nodes
  })
}

async function monoFamily(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--vp-font-family-mono').trim())
}

// ---------------------------------------------------------------------------

test.describe('V-008 · type scale', () => {
  // -------------------------------------------------------------------------
  // 1. Scale conformance — JOB §5 / AC #1. The natural RED test: every
  //    computed font-size, on every page, must be one of 12/14/16/24/36px.
  //    One test per page so a failure reads as a per-page punch list, not one
  //    unreadable 300-line diff. Measured 2026-08-15: 37 offenders on `/`, 44
  //    on `/spec/`, and similar counts on the rest — this fails loudly today,
  //    exactly as JOB §5 predicts.
  // -------------------------------------------------------------------------
  for (const url of PAGES) {
    test(`${url} — every rendered font-size is on the 12/14/16/24/36 scale`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(url)
      const nodes = await scanTypography(page)
      expect(nodes.length, `${url}: the scanner found no text on the page — selector or route is wrong`).toBeGreaterThan(0)
      const offScale = nodes
        .filter((n) => !SCALE.some((s) => Math.abs(n.fontSize - s) < 0.01))
        .map((n) => `<${n.tag.toLowerCase()} class="${n.cls}"> "${n.text.slice(0, 40)}" @ ${n.fontSize}px`)
      expect(offScale, `${url} carries off-scale font-size declarations (JOB §5 / AC #1)`).toEqual([])
    })
  }

  // -------------------------------------------------------------------------
  // 2. h2 = 24px — JOB §1bis / §3. Folded out of the scanner above and
  //    exercised explicitly because JOB §1bis names this as the worst single
  //    defect (h2 == body text at 16px on /spec/). Measured 2026-08-15,
  //    matches the JOB table exactly: spec 16px, quickstart/compare/changelog
  //    20px, benchmark already 24px (V-007 fixed it there).
  //    Scoped to the five pages JOB §1bis's own table names — home's h2s
  //    (26px / 16px, HeroSection.vue) are still caught by the scanner above,
  //    but home is a different macrostructure (V-001 Narrative Workflow) with
  //    no h2 role claim in this table, so it is not asserted against 24px here.
  // -------------------------------------------------------------------------
  test('h2 is 24px on all five inner pages (JOB §1bis — currently anarchic: 16/20/20/20/24)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const innerPages = ['/index-ai/spec/', '/index-ai/quickstart', '/index-ai/compare/llms-txt', '/index-ai/changelog', '/index-ai/benchmark'] as const

    for (const url of innerPages) {
      await page.goto(url)
      const h2s = await page.locator('h2').evaluateAll((els) =>
        els.map((el) => ({ text: (el.textContent ?? '').trim().slice(0, 40), fontSize: parseFloat(getComputedStyle(el).fontSize) })),
      )
      expect(h2s.length, `${url} has no <h2> at all`).toBeGreaterThan(0)
      for (const h2 of h2s) {
        expect(h2.fontSize, `${url}: <h2>"${h2.text}" is ${h2.fontSize}px, not the locked 24px (JOB §3 role map)`).toBe(24)
      }
    }
  })

  // -------------------------------------------------------------------------
  // 3. Column unification to 72rem — JOB §1bis, CTO ruling "ok pour 72rem,
  //    garde cet ordre" (2026-08-14). Asserted from the viewport formula
  //    (same pattern as e2e/footer.spec.ts's "72rem site column" test), not
  //    hardcoded pixels, so it stays correct at any viewport width. At 1440px
  //    it resolves to width 1152 / left 144 / right 1296 — the exact numbers
  //    in JOB §1bis's table.
  //    Scoped to the five pages the JOB's own column table names (spec,
  //    quickstart, compare, changelog, benchmark). Home is intentionally
  //    excluded: it carries its own 48rem `.home-section` column, a different
  //    macrostructure (V-001) untouched by this job (JOB §4 non-negotiable —
  //    "layout... stays exactly as it is"; e2e/footer.spec.ts treats home's
  //    column the same way).
  //    Measured 2026-08-15: spec/quickstart/compare/changelog are ALREADY
  //    1152/144/1296 — only `.bmk-page` (1024/208/1232, still 64rem) fails.
  // -------------------------------------------------------------------------
  const INNER_COLUMNS = [
    { url: '/index-ai/spec/', selector: '.spec-layout' },
    { url: '/index-ai/quickstart', selector: '.qs-page' },
    { url: '/index-ai/compare/llms-txt', selector: '.cmp-page' },
    { url: '/index-ai/changelog', selector: '.clog-page' },
    { url: '/index-ai/benchmark', selector: '.bmk-page' },
  ] as const

  test('the content column is unified to 72rem on all five inner pages, benchmark included (JOB §1bis)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const MAX = 72 * 16 // 72rem
    const GUTTER = 3 * 16 // the shared `calc(100% - 3rem)` / `width:100%` + margin-inline:auto gutter

    for (const { url, selector } of INNER_COLUMNS) {
      await page.goto(url)
      const client = await page.evaluate(() => document.documentElement.clientWidth)
      const expectedWidth = Math.min(MAX, client - GUTTER)
      const expectedLeft = Math.round((client - expectedWidth) / 2)
      const box = await page.locator(selector).boundingBox()
      expect(box, `${url}: ${selector} not found on the page`).not.toBeNull()
      expect(Math.round(box!.width), `${url}: column width is not on the 72rem column (JOB §1bis)`).toBe(expectedWidth)
      expect(Math.round(box!.x), `${url}: column left edge is not on the 72rem column (JOB §1bis)`).toBe(expectedLeft)
      expect(Math.round(box!.x + box!.width), `${url}: column right edge is not on the 72rem column (JOB §1bis)`).toBe(
        expectedLeft + expectedWidth,
      )
    }
  })

  // -------------------------------------------------------------------------
  // 4. Mono is for data, not prose — JOB §3 / AC #2. Two parts:
  //    (a) a site-wide guard: no heading (h1..h6), on any page, may render in
  //        the mono family. Measured 2026-08-15: this currently PASSES
  //        everywhere (no heading is mono today) — it is the permanent
  //        regression guard JOB §5 asks for, not the RED evidence itself.
  //    (b) the RED evidence: two real, currently-shipping violations on
  //        /compare/llms-txt (CoexistMap.vue's `.co-legend` and `.co-orient`),
  //        found by their RENDERED TEXT (not by class name, per house style —
  //        the JOB does not lock these as hooks). Both are full sentences —
  //        "Same origin — four conventions, one job each." and "All four sit
  //        on the same origin, side by side. index-ai is the only one that is
  //        measured and machine-queryable." — set in Geist Mono today. That is
  //        exactly the "legend sentence" case JOB §3 bans.
  // -------------------------------------------------------------------------
  test('no heading anywhere renders in the mono family (JOB §3)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    for (const url of PAGES) {
      await page.goto(url)
      const mono = await monoFamily(page)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((els) =>
        els.map((el) => ({ tag: el.tagName, text: (el.textContent ?? '').trim().slice(0, 40), family: getComputedStyle(el).fontFamily })),
      )
      for (const h of headings) {
        expect(h.family, `${url}: <${h.tag.toLowerCase()}> "${h.text}" is set in the mono family — headings stay sans (JOB §3)`).not.toBe(
          mono,
        )
      }
    }
  })

  test('the coexistence legend and orientation sentences are not set in the mono family (JOB §3)', async ({ page }) => {
    await page.goto('/index-ai/compare/llms-txt')
    const mono = await monoFamily(page)

    const legend = page.getByText(/All four sit on the same origin, side by side/)
    const orient = page.getByText(/Same origin — four conventions, one job each/)
    await expect(legend).toBeVisible()
    await expect(orient).toBeVisible()

    const legendFamily = await legend.evaluate((el) => getComputedStyle(el).fontFamily)
    const orientFamily = await orient.evaluate((el) => getComputedStyle(el).fontFamily)
    expect(legendFamily, 'the coexistence legend sentence is set in the mono family — mono is for data, not prose (JOB §3)').not.toBe(mono)
    expect(orientFamily, 'the orientation sentence is set in the mono family — mono is for data, not prose (JOB §3)').not.toBe(mono)
  })

  // -------------------------------------------------------------------------
  // 5. Theme toggle — JOB §1ter, a behavioural bug, not a markup one. Tested
  //    as behaviour per the JOB's explicit instruction: asserting `.dark` /
  //    `aria-checked` alone would pass on a knob that still does not move
  //    (homepage.spec.ts already asserts the class flip — this file adds the
  //    physical-movement + icon-swap assertions the JOB says are missing).
  //    Measured 2026-08-15, reproduces JOB §1ter's repro exactly:
  //      before click: knob.left=1222  sun=hidden  moon=visible  btnClass="theme-toggle"
  //      after  click: knob.left=1222  sun=hidden  moon=visible  htmlDark=true
  //    The class flips, the knob does not move, and the moon never swaps to
  //    the sun — even though the page is now in dark mode.
  // -------------------------------------------------------------------------
  test('clicking the theme toggle physically moves the knob and swaps sun/moon (JOB §1ter)', async ({ page }) => {
    await page.goto(HOME)
    const toggle = page.getByRole('switch', { name: 'Toggle dark mode' })
    const knob = page.locator('.knob')

    const read = () =>
      knob.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const sun = el.querySelector('.sun')
        const moon = el.querySelector('.moon')
        return {
          left: r.left,
          sunVisible: sun ? getComputedStyle(sun).display !== 'none' : false,
          moonVisible: moon ? getComputedStyle(moon).display !== 'none' : false,
        }
      })

    const before = await read()
    await toggle.click()
    // the class flip is instant; wait for it before reading geometry so we
    // are not racing the click itself.
    await expect.poll(() => page.locator('html').getAttribute('class')).toContain('dark')
    // the (currently broken) transform is a 200ms CSS transition — settle
    // well past that before measuring the final position.
    await page.waitForTimeout(300)
    const after = await read()

    const delta = after.left - before.left
    expect(
      Math.abs(delta),
      `the knob moved ${delta}px on click (before=${before.left} after=${after.left}) — JOB §1ter expects ~18px; ` +
        `it stays at 0 because ".theme-toggle.dark .knob" never matches (the button never gets the "dark" class, only <html> does)`,
    ).toBeGreaterThan(14)
    expect(after.sunVisible, 'the sun icon never appears after switching to dark mode — the icon swap never fires (JOB §1ter)').toBe(true)
    expect(after.moonVisible, 'the moon icon is still visible in dark mode (JOB §1ter)').toBe(false)
  })

  // -------------------------------------------------------------------------
  // 5. Zero horizontal overflow at 320/375/414/768px, every page — JOB §4 /
  //    AC #4. NOT duplicated here: e2e/footer.spec.ts's "the footer never
  //    overflows horizontally, on any page, at any width" test already runs
  //    `document.documentElement.scrollWidth - clientWidth <= 0` on every one
  //    of these six PAGES at 320/375/414/768/1440px (footer.spec.ts's own
  //    WIDTHS array). That is a document-level check, so it already covers
  //    the whole page, not just the footer — home, spec, quickstart, compare,
  //    changelog and benchmark are all exercised there today. No gap to fill.
  // -------------------------------------------------------------------------
})
