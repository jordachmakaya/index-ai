import { expect, test, type Page } from '@playwright/test'

// V-009 footer — RED phase.
//
// These tests describe the footer specified by .shokunin/jobs/ui/V-009-footer/JOB.md:
// a specification-document foot, not a marketing band. Three visually separated
// jobs (identity / legal / navigation), the Shokunin attribution demoted to a
// plain text link, type strictly on the 12-14-16 scale, and a layout that never
// leaves a `·` dangling at the end of a line.
//
// The component (docs/.vitepress/theme/components/FooterV4.vue) renders on all six
// pages via the theme's `layout-bottom` slot, so it is asserted once and thoroughly
// here, then confirmed identical on every page.
//
// Deliberately markup-agnostic: nothing below names a class the JOB does not name.
// The two hooks the JOB does lock are `.foot-v4` (the element carrying the
// position/z-index contract) and its inner `.wrap` (JOB §3, AC #8). Everything
// else is found by role, by accessible name, or by rendered text — the coder owns
// the DOM shape, this file owns the behaviour.

const HOME = '/index-ai/'

/** The six pages the footer renders on. */
const PAGES = [
  HOME,
  '/index-ai/spec/',
  '/index-ai/quickstart',
  '/index-ai/compare/llms-txt',
  '/index-ai/changelog',
  '/index-ai/benchmark',
] as const

/** JOB AC #5 / #6 — the widths the footer must survive. */
const WIDTHS = [320, 375, 414, 768, 1440] as const

const FOOTER = '.foot-v4'
const WRAP = '.foot-v4 .wrap'
const ATTRIBUTION_HREF = 'https://jordach.dev/projects/shokunin-harness'

/** JOB §3 — the locked type scale for this component. Nothing between. */
const TYPE_SCALE = [12, 14, 16] as const

/** Glue characters. A rendered line may never end on one (JOB §3, AC #5). */
const SEPARATOR = /^[·•|/–—-]+$/

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

type FooterNode = {
  tag: string
  cls: string
  /** The element's OWN text (direct text-node children only) — what it renders. */
  text: string
  href: string | null
  isLink: boolean
  isSeparator: boolean
  fontSize: number
  fontWeight: number
  color: string
  textTransform: string
  top: number
  left: number
  right: number
  bottom: number
}

type FooterModel = {
  nodes: FooterNode[]
  footer: { position: string; zIndex: string; background: string }
  /** Every `<linearGradient>` / `<radialGradient>` def inside the footer. */
  gradientDefs: number
  /** Every element inside the footer painting a CSS gradient. */
  gradientBackgrounds: number
  innerText: string
  /** `.wrap` border box AND content box (border box minus its own padding). */
  wrap: { left: number; right: number; contentLeft: number; contentRight: number }
  tokens: { text1: string; text2: string; text3: string }
}

/** One round trip: everything the assertions below need, measured in the page. */
async function readFooter(page: Page): Promise<FooterModel> {
  return page.evaluate(
    ({ footerSel, wrapSel, sepSource }) => {
      const sep = new RegExp(sepSource)
      const foot = document.querySelector(footerSel)
      if (!foot) throw new Error(`no ${footerSel} on the page`)

      const nodes: FooterNode[] = []
      const walk = (el: Element): void => {
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '')
          .map((n) => (n.textContent ?? '').trim())
          .join(' ')
          .replace(/\s+/g, ' ')
        const isLink = el.tagName === 'A'
        if (own !== '' || isLink) {
          const cs = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          nodes.push({
            tag: el.tagName,
            cls: el.getAttribute('class') ?? '',
            text: own,
            href: el.getAttribute('href'),
            isLink,
            isSeparator: own !== '' && sep.test(own),
            fontSize: parseFloat(cs.fontSize),
            fontWeight: Number(cs.fontWeight),
            color: cs.color,
            textTransform: cs.textTransform,
            top: Math.round(r.top),
            left: Math.round(r.left),
            right: Math.round(r.right),
            bottom: Math.round(r.bottom),
          })
        }
        for (const child of Array.from(el.children)) walk(child)
      }
      walk(foot)

      const probe = document.createElement('span')
      foot.appendChild(probe)
      const token = (name: string): string => {
        probe.style.color = `var(${name})`
        return getComputedStyle(probe).color
      }
      const tokens = { text1: token('--vp-c-text-1'), text2: token('--vp-c-text-2'), text3: token('--vp-c-text-3') }
      probe.remove()

      const wrapEl = foot.querySelector(wrapSel.replace(`${footerSel} `, ''))
      const wr = wrapEl?.getBoundingClientRect()
      const wcs = wrapEl ? getComputedStyle(wrapEl) : null

      const fcs = getComputedStyle(foot)
      return {
        nodes,
        footer: { position: fcs.position, zIndex: fcs.zIndex, background: fcs.backgroundColor },
        gradientDefs: foot.querySelectorAll('linearGradient, radialGradient').length,
        gradientBackgrounds: Array.from(foot.querySelectorAll('*')).filter((el) =>
          /gradient\(/.test(getComputedStyle(el).backgroundImage),
        ).length,
        innerText: (foot as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
        wrap: {
          left: wr ? Math.round(wr.left) : Number.NaN,
          right: wr ? Math.round(wr.right) : Number.NaN,
          contentLeft: wr && wcs ? Math.round(wr.left + parseFloat(wcs.paddingLeft) + parseFloat(wcs.borderLeftWidth)) : Number.NaN,
          contentRight: wr && wcs ? Math.round(wr.right - parseFloat(wcs.paddingRight) - parseFloat(wcs.borderRightWidth)) : Number.NaN,
        },
        tokens,
      }
    },
    { footerSel: FOOTER, wrapSel: WRAP, sepSource: SEPARATOR.source },
  )
}

/** The deepest element inside the footer that itself renders `needle`. */
function nodeRendering(model: FooterModel, needle: RegExp): FooterNode {
  const hits = model.nodes.filter((n) => needle.test(n.text))
  expect(hits.length, `nothing in the footer renders ${needle} — footer reads: ${model.innerText}`).toBeGreaterThan(0)
  return hits[0]!
}

/** Group rendered boxes into visual rows: same line ⇒ overlapping vertical bands. */
function rows<T extends { top: number; bottom: number; left: number }>(boxes: readonly T[]): T[][] {
  const out: T[][] = []
  for (const box of [...boxes].sort((a, b) => a.top - b.top || a.left - b.left)) {
    const row = out.find((r) => r.some((o) => box.top < o.bottom - 2 && o.top < box.bottom - 2))
    if (row) row.push(box)
    else out.push([box])
  }
  for (const row of out) row.sort((a, b) => a.left - b.left)
  return out
}

const internalLinks = (m: FooterModel): FooterNode[] => m.nodes.filter((n) => n.isLink && (n.href ?? '').startsWith('/'))
const externalLinks = (m: FooterModel): FooterNode[] => m.nodes.filter((n) => n.isLink && /^https?:/.test(n.href ?? ''))

// ---------------------------------------------------------------------------
// WCAG
// ---------------------------------------------------------------------------

function channels(css: string): [number, number, number] {
  const m = css.match(/rgba?\(([^)]+)\)/)
  expect(m, `unparseable colour: ${css}`).not.toBeNull()
  const [r, g, b] = m![1]!.split(/[,\s/]+/).filter(Boolean).map(Number)
  return [r!, g!, b!]
}

function luminance(css: string): number {
  const lin = (c: number): number => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = channels(css)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)]
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// ---------------------------------------------------------------------------

test.describe('V-009 · footer', () => {
  test('the Shokunin attribution is a plain text link — no pill, no gradient, no coloured shadow', async ({ page }) => {
    await page.goto(HOME)
    const footer = page.locator(FOOTER)
    await expect(footer).toBeVisible()

    // JOB §2 / AC #2 — the credit STAYS. It is demoted, never removed.
    const attribution = footer.getByRole('link', { name: /Shokunin Harness/i })
    await expect(attribution).toBeVisible()
    await expect(attribution).toHaveAttribute('href', ATTRIBUTION_HREF)
    await expect(attribution).toHaveAttribute('target', '_blank')
    expect(await attribution.getAttribute('rel')).toMatch(/noopener/)
    expect(await attribution.getAttribute('rel')).toMatch(/noreferrer/)

    // JOB §2 / AC #1 — it loses the pill, the chip and the border. Measured, not
    // read off the markup: a plain text link paints no box of its own.
    const box = await attribution.evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        radii: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat),
        borders: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat),
        background: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        shadow: cs.boxShadow,
        footerBackground: getComputedStyle(el.closest('.foot-v4')!).backgroundColor,
      }
    })
    for (const radius of box.radii) expect(radius, 'the attribution still wears a pill').toBeLessThan(4)
    for (const width of box.borders) expect(width, 'the attribution still wears a border').toBe(0)
    expect(box.shadow, 'the attribution still carries a shadow').toBe('none')
    expect(box.backgroundImage, 'the attribution still paints a gradient').toBe('none')
    // Transparent, or literally the footer's own ground — either way: no chip.
    expect(
      box.background === 'rgba(0, 0, 0, 0)' || box.background === box.footerBackground,
      `the attribution still sits on its own background (${box.background})`,
    ).toBe(true)

    // JOB §1 defect #1 — the gradient-filled diamond is gone from the footer.
    const model = await readFooter(page)
    expect(model.gradientDefs, 'a gradient def survives inside the footer').toBe(0)
    expect(model.gradientBackgrounds, 'an element in the footer still paints a CSS gradient').toBe(0)
  })

  test('the attribution does not lift, glow or move on hover', async ({ page }) => {
    await page.goto(HOME)
    const attribution = page.locator(FOOTER).getByRole('link', { name: /Shokunin Harness/i })
    await attribution.scrollIntoViewIfNeeded()

    const before = await attribution.boundingBox()
    expect(before).not.toBeNull()

    await attribution.hover()
    // The v4 badge animated over 200ms. Settle well past that, then read: polling
    // would pass on the first frame, before any lift had begun.
    await page.waitForTimeout(500)

    const after = await attribution.evaluate((el) => {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return { transform: cs.transform, shadow: cs.boxShadow, y: Math.round(r.y), x: Math.round(r.x) }
    })
    expect(
      after.transform === 'none' || after.transform === 'matrix(1, 0, 0, 1, 0, 0)',
      `the attribution transforms on hover (${after.transform})`,
    ).toBe(true)
    expect(after.shadow, 'the attribution glows on hover').toBe('none')
    // A translate would move it even if the computed transform were read late.
    expect(after.y, 'the attribution moves on hover').toBe(Math.round(before!.y))
    expect(after.x, 'the attribution moves on hover').toBe(Math.round(before!.x))
  })

  test('the wordmark carries the primary ink and outranks the legal line', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(HOME)
    const model = await readFooter(page)

    // JOB §1 defect #4 / §3 — the wordmark is the wordmark: real ink, not text-3.
    const wordmark = nodeRendering(model, /^index-ai$/)
    const legal = nodeRendering(model, /Spec text/i)

    expect(wordmark.color, 'the wordmark is not --vp-c-text-1').toBe(model.tokens.text1)
    expect(
      wordmark.color,
      'the wordmark wears the same ink as the legal line — no hierarchy (JOB §1 defect #2)',
    ).not.toBe(legal.color)
    expect(legal.color, 'the legal line should sit below the wordmark, not on --vp-c-text-1').not.toBe(model.tokens.text1)
    // Measured, not eyeballed (AC #3): the wordmark must win on ink, weight, or both.
    expect(
      wordmark.color !== legal.color || wordmark.fontWeight > legal.fontWeight,
      'the wordmark is indistinguishable from the legal text',
    ).toBe(true)

    // The third job — navigation — is separated by LAYOUT, not necessarily by ink:
    // see "legal and navigation are separated by layout" below. Colour is not
    // asserted on the links here, because the WCAG AA floor (see the contrast test)
    // leaves only text-1 and text-2 usable in dark mode, and text-1 belongs to the
    // wordmark alone. Position carries the distinction instead.
  })

  test('legal and navigation are separated by layout, not glued by separators', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(HOME)
    const model = await readFooter(page)

    const legal = nodeRendering(model, /Spec text/i)
    const nav = internalLinks(model)
    expect(nav.length, 'the footer lost its navigation links').toBe(4)

    const navLeft = Math.min(...nav.map((n) => n.left))
    const navTop = Math.min(...nav.map((n) => n.top))
    const navBottom = Math.max(...nav.map((n) => n.bottom))

    // JOB §3 — "opposite ends of a row, OR distinct rows". Either is accepted;
    // an interleaved single run is not.
    const sameRow = legal.top < navBottom - 2 && navTop < legal.bottom - 2
    const oppositeEnds = legal.right <= navLeft
    const distinctRows = !sameRow
    expect(
      distinctRows || oppositeEnds,
      'legal terms and navigation are interleaved in one run (JOB §3)',
    ).toBe(true)

    // And nothing glues them: no `·` may sit between the licences and the links.
    if (sameRow) {
      const glue = model.nodes.filter(
        (n) => n.isSeparator && n.left >= legal.right && n.right <= navLeft && n.top < navBottom && navTop < n.bottom,
      )
      expect(glue.map((g) => g.text), 'a separator still glues the legal run to the navigation').toEqual([])
    }
  })

  test('the version status reads in sentence case — (REQUEST FOR COMMENTS) is gone', async ({ page }) => {
    await page.goto(HOME)
    const model = await readFooter(page)

    // JOB §1 defect #3 — shouty and redundant with the rc tag.
    expect(model.innerText, 'the footer still shouts (REQUEST FOR COMMENTS)').not.toMatch(/REQUEST FOR COMMENTS/i)
    expect(model.innerText, 'the version is gone from the footer').toContain('1.0-rc2')
    expect(model.innerText, 'the status is not spelled in sentence case').toContain('Release candidate')

    // Sentence case for real: no CSS uppercasing the status behind the DOM's back,
    // and no shouted run anywhere (MIT and CC-BY-4.0 are 3 and 2 letters — safe).
    const status = nodeRendering(model, /Release candidate/)
    expect(status.textTransform, 'the status is uppercased by CSS').not.toBe('uppercase')
    const shouted = model.innerText.match(/\b[A-Z]{4,}\b/g) ?? []
    expect(shouted, 'the footer still contains a shouted run').toEqual([])
  })

  test('every type step is on the 12 / 14 / 16 scale and no weight exceeds 600', async ({ page }) => {
    await page.goto(HOME)
    const model = await readFooter(page)

    // JOB §1 defect #5 / AC #4 — 0.78125rem (12.5px), 0.6875rem (11px) and the
    // non-standard 650 weight all die here. Checked on everything that renders text.
    const offScale = model.nodes
      .filter((n) => n.text !== '')
      .filter((n) => !TYPE_SCALE.some((step) => Math.abs(n.fontSize - step) < 0.01))
      .map((n) => `${n.tag}.${n.cls} "${n.text}" @ ${n.fontSize}px`)
    expect(offScale, 'footer type is off the 12/14/16 scale').toEqual([])

    const overweight = model.nodes
      .filter((n) => n.text !== '' && n.fontWeight > 600)
      .map((n) => `${n.tag}.${n.cls} "${n.text}" @ ${n.fontWeight}`)
    expect(overweight, 'footer weight exceeds 600').toEqual([])
  })

  for (const width of WIDTHS) {
    test(`no line ends on a separator and no link is orphaned at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(HOME)
      const model = await readFooter(page)

      // JOB §1 defect #7 / AC #5. Rendered boxes grouped by the line they sit on.
      const painted = model.nodes.filter((n) => n.text !== '' && n.right > n.left)
      for (const row of rows(painted)) {
        const last = row[row.length - 1]!
        expect(
          last.isSeparator,
          `a line ends on "${last.text}" at ${width}px — row reads: ${row.map((n) => n.text).join(' ')}`,
        ).toBe(false)
        // Same defect, glue baked into a text run rather than its own element.
        expect(
          /[·•|]\s*$/.test(last.text),
          `a line trails a separator at ${width}px — row reads: ${row.map((n) => n.text).join(' ')}`,
        ).toBe(false)
        // A separator is only ever glue: it needs something on BOTH sides of it.
        for (const [i, node] of row.entries()) {
          if (!node.isSeparator) continue
          expect(i > 0, `a line starts on "${node.text}" at ${width}px`).toBe(true)
        }
      }

      // No orphan: a lone link on its own line is fine only if every link is
      // stacked that way. A 3 + 1 wrap — "Changelog" alone — is the defect.
      const linkRows = rows(model.nodes.filter((n) => n.isLink && n.right > n.left))
      const sizes = linkRows.map((r) => r.length)
      expect(
        !(sizes.includes(1) && sizes.some((s) => s > 1)),
        `a link is orphaned at ${width}px — link rows: ${JSON.stringify(linkRows.map((r) => r.map((n) => n.text)))}`,
      ).toBe(true)
    })
  }

  test('the inner wrap holds the 72rem site column', async ({ page }) => {
    // JOB §2bis(c) — CTO arbitration, 2026-08-14. The original spec said "the
    // content column" as if the site had one. It does not: /benchmark is 64rem,
    // /quickstart + /compare + /changelog + /spec are 72rem, / is 48rem. A single
    // static footer cannot share edges with all three, and pinning 64rem would make
    // the footer visibly NARROWER than the content on four of six pages, which
    // reads as broken. Ruling: pin 72rem — exact on four pages, wider (never
    // narrower) than the other two.
    //
    // Asserted from the viewport, not from any page's element, so this test cannot
    // silently re-inherit one page's column the way its first version did.
    const MAX = 72 * 16 // 72rem
    const GUTTER = 3 * 16 // the site's calc(100% - 3rem) gutter, 24px per side
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/index-ai/benchmark')
      const client = await page.evaluate(() => document.documentElement.clientWidth)
      const expectedWidth = Math.min(MAX, client - GUTTER)
      const expectedLeft = Math.round((client - expectedWidth) / 2)
      const model = await readFooter(page)
      expect(model.wrap.contentLeft, `footer left edge is off the 72rem column at ${width}px`).toBe(expectedLeft)
      expect(model.wrap.contentRight, `footer right edge is off the 72rem column at ${width}px`).toBe(
        expectedLeft + expectedWidth,
      )
    }
  })

  test('the footer never overflows horizontally, on any page, at any width', async ({ page }) => {
    // AC #6. The document-level check runs on EVERY page, /quickstart included.
    //
    // CTO amendment, 2026-08-14: the tester originally excluded /quickstart because
    // it already overflows by 557px at 320px through an unwrapped <code> block in
    // its own step bands — a pre-existing V-003 defect. The human asked for it to be
    // fixed (« regle le /quickstart qui déborde »), so the exclusion is removed and
    // this assertion becomes the RED test for that defect. 557px of horizontal
    // overflow on a published page is worse than anything V-007 corrected.
    const DOCUMENT_CLEAN = PAGES

    for (const url of PAGES) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(url)
        await expect(page.locator(FOOTER)).toBeVisible()
        const bleed = await page.evaluate((sel) => {
          const foot = document.querySelector(sel)!
          const viewport = document.documentElement.clientWidth
          const boxes = Array.from(foot.querySelectorAll('*')).map((el) => el.getBoundingClientRect())
          return {
            doc: document.documentElement.scrollWidth - viewport,
            past: Math.round(Math.max(0, ...boxes.map((b) => b.right - viewport))),
            before: Math.round(Math.min(0, ...boxes.map((b) => b.left))),
            footScroll: foot.scrollWidth - foot.clientWidth,
          }
        }, FOOTER)
        // The footer itself: nothing inside it reaches past either viewport edge.
        expect(bleed.past, `the footer bleeds past the right edge on ${url} at ${width}px`).toBeLessThanOrEqual(0)
        expect(bleed.before, `the footer bleeds past the left edge on ${url} at ${width}px`).toBeGreaterThanOrEqual(0)
        expect(bleed.footScroll, `the footer scrolls sideways on ${url} at ${width}px`).toBeLessThanOrEqual(1)
        if (DOCUMENT_CLEAN.includes(url as (typeof PAGES)[number])) {
          expect(bleed.doc, `${url} overflows the document at ${width}px`).toBeLessThanOrEqual(0)
        }
      }
    }
  })

  test('the footer is identical on all six pages', async ({ page }) => {
    // JOB §4 — one component, six pages. Assert the text AND the geometry.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(HOME)
    const reference = await readFooter(page)
    expect(reference.innerText.length, 'the reference footer rendered empty').toBeGreaterThan(20)

    for (const url of PAGES.slice(1)) {
      await page.goto(url)
      const model = await readFooter(page)
      expect(model.innerText, `the footer text differs on ${url}`).toBe(reference.innerText)
      expect(
        { left: model.wrap.contentLeft, right: model.wrap.contentRight },
        `the footer geometry differs on ${url}`,
      ).toEqual({ left: reference.wrap.contentLeft, right: reference.wrap.contentRight })
      expect(
        model.nodes.map((n) => `${n.text}|${n.fontSize}|${n.fontWeight}|${n.color}`),
        `the footer type differs on ${url}`,
      ).toEqual(reference.nodes.map((n) => `${n.text}|${n.fontSize}|${n.fontWeight}|${n.color}`))
    }
  })

  test('the preserved contracts survive: stacking context and the /index-ai/ base', async ({ page }) => {
    await page.goto(HOME)
    const model = await readFooter(page)

    // JOB §3 — without this pair the fixed VitePress aside paints over the footer.
    expect(model.footer.position, 'the footer lost position: relative').toBe('relative')
    expect(model.footer.zIndex, 'the footer lost its z-index — the fixed aside will paint over it').not.toBe('auto')
    expect(Number(model.footer.zIndex), 'the footer z-index is not a usable number').toBeGreaterThan(0)

    // JOB §3 — withBase() on every internal link.
    const links = model.nodes.filter((n) => n.isLink)
    expect(links.length, 'the footer has no links at all').toBeGreaterThan(4)
    for (const link of links) {
      expect(link.href, `a footer link has no href ("${link.text}")`).not.toBeNull()
      expect(
        /^https?:/.test(link.href!) || link.href!.startsWith('/index-ai/'),
        `"${link.text}" → ${link.href} does not resolve under the Pages base`,
      ).toBe(true)
    }
    expect(internalLinks(model).map((l) => l.href)).toEqual([
      '/index-ai/spec/',
      '/index-ai/quickstart',
      '/index-ai/compare/llms-txt',
      '/index-ai/changelog',
    ])
    expect(externalLinks(model).map((l) => l.href), 'the attribution is the only external link').toEqual([ATTRIBUTION_HREF])
  })

  test('every footer text pair clears WCAG AA, in both themes', async ({ page }) => {
    // AC #7. Text is 12-16px and never above 600 (see the type test), so the
    // large-text exemption never applies here: 4.5:1 on everything.
    //
    // CODER, READ THIS: measured on this site's tokens, against the footer ground —
    //   --vp-c-text-1  19.80:1 light · 18.97:1 dark   ok
    //   --vp-c-text-2   6.88:1 light ·  5.78:1 dark   ok
    //   --vp-c-text-3   5.07:1 light ·  3.90:1 dark   FAILS AA in dark
    //   --vp-c-brand-1  2.69:1 light · 10.33:1 dark   FAILS AA in light
    // So the footer's hierarchy must be built from text-1 and text-2. The v4
    // footer painted everything --vp-c-text-3; that is not available here.
    await page.goto(HOME)
    const toggle = page.getByRole('switch', { name: 'Toggle dark mode' })

    for (const theme of ['light', 'dark'] as const) {
      const isDark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false
      if (isDark !== (theme === 'dark')) {
        await toggle.click()
        await expect.poll(() => page.locator('html').getAttribute('class')).toContain(theme)
      }
      const model = await readFooter(page)
      expect(model.footer.background, `the ${theme} footer has no opaque ground to measure against`).not.toBe('rgba(0, 0, 0, 0)')
      for (const node of model.nodes.filter((n) => n.text !== '')) {
        const ratio = contrast(node.color, model.footer.background)
        expect(
          Math.round(ratio * 100) / 100,
          `"${node.text}" is ${ratio.toFixed(2)}:1 on the ${theme} footer`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})
