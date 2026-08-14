<script setup lang="ts">
// v4 TokenBars (V-007 · chart.js horizontal bar): the token cost of the
// published §13.4 run drawn as five bars on ONE shared x axis (0 → 1021, the
// most expensive single query of the run). Five conformance levels are five
// independent options compared on one scale — a bar chart, never a funnel
// (V-006 defect #2).
//
// Two datasets per row, in two lanes of the same category: the mean bar on top,
// a thin floating [min, max] bar underneath it as the range shaft. The mean is
// the primary statistic, so it owns the row's colour, its mass and its label;
// the range is an annotation hugging the bar's lower edge, drawn in neutral ink
// at a fraction of the bar's weight. `whiskerCaps` (inline plugin, no
// dependency) strokes the terminal ticks at min and max — the `⊢──┤` convention
// that makes a range legible as a range without a legend, and that keeps L1's
// 16-token spread readable as "consistent" instead of as a blob. p90 is not in
// the figure — it lives in the table below, which stays the accessible source
// of truth (ADR-001). Colour encodes coverage status: neutral = the L0
// reference, amber = L1's scoped contract, verification green = full coverage;
// tokens are read from the CSS custom properties at draw time and repainted on
// `.dark` change.
// Facts from benchmark/results/2026-08-12-seed20260813.json — verbatim.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
  type Plugin,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// ESM builds have no side effects — register manually.
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, ChartDataLabels)

type Tone = 'ref' | 'partial' | 'ok'
type Row = { level: string; name: string; mean: number; min: number; max: number; tone: Tone }

/** JOB §4 — published facts, never recomputed, never rounded. */
const ROWS: readonly Row[] = [
  { level: 'L0', name: 'HTML', mean: 955, min: 908, max: 1021, tone: 'ref' },
  { level: 'L1', name: 'Manifest', mean: 145, min: 137, max: 153, tone: 'partial' },
  { level: 'L2a', name: 'Index', mean: 147, min: 92, max: 202, tone: 'ok' },
  { level: 'L2b', name: 'Graph', mean: 147, min: 92, max: 207, tone: 'ok' },
  { level: 'L3', name: 'Query', mean: 210, min: 137, max: 302, tone: 'ok' },
]
/** The most expensive single query of the run — the axis ends where the data does. */
const AXIS_MAX = 1021
const AXIS_TICKS = [0, 200, 400, 600, 800, 1000]
const BASE = ROWS[0].mean
/** Grouped datasets share the category: index 0 takes the upper lane. */
const MEAN = 0
const WHISKER = 1
/** Category geometry, tuned on the rendered figure. The two lanes are kept
    narrow (`categoryPercentage`) and the mean bar overflows its own lane
    (`barPercentage` > 1) so it keeps the mass of a real bar while the shaft
    lands ~4 px under its lower edge — three times closer to its own bar than to
    the next row's, which is what makes L0's cap at 1021 read as L0's. */
const CATEGORY_PCT = 0.75
const MEAN_PCT = 1.47
const SHAFT_PCT = 0.2
/** Cap half-height, as a share of the row pitch: the terminals reach up to the
    bar's lower edge — enough to read as a bracket, never enough to out-weigh
    the fill (≈ 40 % of the bar's thickness, against a 3 px shaft). */
const CAP_HALF = 0.11
const CAP_WIDTH = 2
/** Gap between a bar's end and its value label, and the mono advance width at
    12 px — used to decide whether the label still fits to the right of the bar. */
const LABEL_GAP = 8
const CHAR_W = 7.4

function sharePct(n: number): string {
  const pct = (n / BASE) * 100
  return pct >= 99.95 ? '100' : pct.toFixed(1)
}

/** Built at module scope from plain data: it can never render `undefined`. */
const ARIA = [
  `Tokens per query by conformance level — five horizontal bars on one axis from 0 to ${AXIS_MAX} tokens,`,
  'each bar the mean with a min–max whisker.',
  ...ROWS.map(
    (r) =>
      `${r.level} ${r.name}: mean ${r.mean} tokens, min ${r.min}, max ${r.max}, ${sharePct(r.mean)} % of the L0 baseline.`,
  ),
  'Lower is cheaper (SPEC §9.3 heuristic). The results table below carries every figure as text.',
].join(' ')

const plot = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null
let io: IntersectionObserver | null = null
let mo: MutationObserver | null = null
let drawn = false

/** Deterministic ready signal for the E2E — a canvas paint is async. */
const state = ref<'idle' | 'drawn'>('idle')

// ---- token plumbing (a canvas cannot read `var()`) ----
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
/** Blend a token colour at `alpha` over the page background (the badge-tint
    pattern: light fill + ink label keeps AA in both themes). */
function tint(name: string, alpha: number): string {
  const [fr, fg, fb] = hexToRgb(token(name))
  const [br, bg, bb] = hexToRgb(token('--vp-c-bg'))
  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha))
  return `rgb(${mix(fr, br)}, ${mix(fg, bg)}, ${mix(fb, bb)})`
}

const FILL: Record<Tone, [string, number]> = {
  ref: ['--vp-c-text-3', 0.34],
  partial: ['--vp-c-term-warn', 0.62],
  ok: ['--vp-c-brand-1', 0.62],
}
/** The bar's own edge, at full strength: a ≥3:1 outline (WCAG 1.4.11) around a
    deliberately light fill, and the darkest ink on the row — the mean wins. */
const EDGE: Record<Tone, string> = {
  ref: '--vp-c-text-2',
  partial: '--vp-c-warning-3',
  ok: '--vp-c-brand-3',
}
// Read lazily, client-only: touching getComputedStyle at module scope crashes
// the SSR build.
const fills = (): string[] => ROWS.map((r) => tint(...FILL[r.tone]))
const edges = (): string[] => ROWS.map((r) => token(EDGE[r.tone]))
/** The range is a measurement, not a category: neutral ink, tinted down to just
    what a 3:1 edge against the canvas needs, so colour stays the bar's alone.
    Resolved at paint time and shared by the shaft and its caps, so the two can
    never drift apart. It is applied per index (an array, like the fills): a
    plain string is a *shared* element option, and `update('none')` does not
    re-resolve those — the shaft would keep chart.js's default translucent
    black, which is invisible on the dark canvas. */
let rangeStroke = ''
const rangeInk = (): string => tint('--vp-c-text-2', 0.8)

type LabelCtx = { dataIndex: number; chart: Chart }

/** CTO rule: read the value from the dataset and the category from the labels —
    never from `ctx.label`, which is what shipped `undefined` in V-006. */
function labelText(ctx: LabelCtx): string {
  const i = ctx.dataIndex
  const raw = ctx.chart.data.datasets[MEAN]?.data[i]
  const category = ctx.chart.data.labels?.[i]
  if (typeof raw !== 'number' || !Number.isFinite(raw) || typeof category !== 'string') return ''
  return `${raw} · ${sharePct(raw)} %`
}

/** The label belongs to the bar, so it is anchored to the bar's END — never
    pushed past the range, which would make it annotate the wrong mark. It sits
    just outside when the plot still has room for it, inside otherwise. The
    range lives one lane below, so neither placement can collide with it. */
function labelFitsRight(ctx: LabelCtx): boolean {
  const row = ROWS[ctx.dataIndex]
  const scale = ctx.chart.scales['x']
  if (!row || !scale) return false
  const width = labelText(ctx).length * CHAR_W
  return scale.getPixelForValue(row.mean) + LABEL_GAP + width <= scale.right
}

/** Terminal caps at min and max — chart.js has no error bars and this figure
    adds no dependency to get them. Fifteen lines of canvas: the x scale gives
    the two values their pixels, the shaft element gives the lane's centre. */
const whiskerCaps: Plugin<'bar'> = {
  id: 'whiskerCaps',
  afterDatasetsDraw(chart) {
    const x = chart.scales['x']
    const y = chart.scales['y']
    if (!x || !y || !rangeStroke) return
    const shafts = chart.getDatasetMeta(WHISKER).data
    const half = (y.height / ROWS.length) * CAP_HALF
    const { ctx } = chart
    ctx.save()
    ctx.lineWidth = CAP_WIDTH
    ctx.strokeStyle = rangeStroke
    ROWS.forEach((row, i) => {
      const shaft = shafts[i]
      if (!shaft) return
      for (const value of [row.min, row.max]) {
        // Clamp inside the plot: L0's max IS the axis maximum, and half a stroke
        // would otherwise fall outside the canvas.
        const px = Math.round(
          Math.min(Math.max(x.getPixelForValue(value), x.left + 1), x.right - 1),
        )
        ctx.beginPath()
        ctx.moveTo(px, shaft.y - half)
        ctx.lineTo(px, shaft.y + half)
        ctx.stroke()
      }
    })
    ctx.restore()
  },
}

/** Every glyph the canvas draws, at the page's mono micro step. The y tick
    labels are laid out with it, and the width they measure IS the plot's left
    edge — so the chart must be BORN with this font. Handing it over after
    construction moves the plot area under elements that have already been
    positioned, and the range shaft ends up drawn on the previous layout. */
const monoFont = (): { family: string; size: number; weight: 500 } => ({
  family: token('--vp-font-family-mono') || 'monospace',
  size: 12,
  weight: 500,
})

function paint(): void {
  if (!chart) return
  const ink = token('--vp-c-text-1')
  const muted = token('--vp-c-text-2')
  const grid = token('--vp-c-border')
  const font = monoFont()

  const whiskerSet = chart.data.datasets[WHISKER]
  const meanSet = chart.data.datasets[MEAN]
  rangeStroke = rangeInk()
  if (whiskerSet) whiskerSet.backgroundColor = ROWS.map(() => rangeStroke)
  if (meanSet) {
    meanSet.backgroundColor = fills()
    meanSet.borderColor = edges()
  }

  const dl = meanSet?.datalabels
  if (dl) {
    dl.color = ink
    dl.font = font
  }
  const x = chart.options.scales?.['x']
  const y = chart.options.scales?.['y']
  if (x?.ticks) {
    x.ticks.color = muted
    x.ticks.font = font
  }
  if (x?.grid) x.grid.color = grid
  if (y?.ticks) {
    y.ticks.color = ink
    y.ticks.font = font
  }
  const tip = chart.options.plugins?.tooltip
  if (tip) {
    tip.backgroundColor = token('--vp-c-text-1')
    tip.titleColor = token('--vp-c-bg')
    tip.bodyColor = token('--vp-c-bg')
    // chart.js defaults to 12px Helvetica, which matches nothing on this page:
    // every glyph the canvas draws is set explicitly to the mono micro step.
    tip.bodyFont = font
    tip.titleFont = font
    tip.footerFont = font
  }
}

function buildChart(): void {
  const el = canvas.value
  if (drawn || !el) return
  drawn = true
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  chart = new Chart(el, {
    type: 'bar',
    plugins: [whiskerCaps],
    data: {
      labels: ROWS.map((r) => `${r.level}  ${r.name}`),
      datasets: [
        {
          label: 'mean',
          data: ROWS.map((r) => r.mean),
          barPercentage: MEAN_PCT,
          categoryPercentage: CATEGORY_PCT,
          borderWidth: 1,
          borderSkipped: false,
          borderRadius: 3,
          datalabels: {
            display: true,
            anchor: 'end',
            align: (ctx: LabelCtx) => (labelFitsRight(ctx) ? 'right' : 'left'),
            offset: LABEL_GAP,
            clamp: true,
            formatter: (_value: unknown, ctx: LabelCtx) => labelText(ctx),
            textAlign: 'left',
          },
        },
        {
          // Floating bar [min, max] — the range shaft, in the lane under the
          // bar so the value label keeps the bar's own centre line clear.
          label: 'min–max',
          data: ROWS.map((r) => [r.min, r.max]),
          barPercentage: SHAFT_PCT,
          categoryPercentage: CATEGORY_PCT,
          borderWidth: 0,
          borderSkipped: false,
          borderRadius: 0,
          datalabels: { display: false },
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: reduce ? false : { duration: 800, easing: 'easeOutCubic' },
      layout: { padding: { top: 2, right: 10, bottom: 0, left: 0 } },
      interaction: { mode: 'index', axis: 'y', intersect: false },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          displayColors: false,
          padding: 8,
          filter: (item: { datasetIndex: number }) => item.datasetIndex === MEAN,
          callbacks: {
            title: () => '',
            label: (item: { dataIndex: number }) => {
              const r = ROWS[item.dataIndex]
              return r ? `${r.level} ${r.name} · ${r.mean} tokens · ${sharePct(r.mean)} % of L0` : ''
            },
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: AXIS_MAX,
          border: { display: false },
          grid: { drawTicks: false },
          afterBuildTicks: (axis: { ticks: { value: number }[] }) => {
            axis.ticks = AXIS_TICKS.map((value) => ({ value }))
          },
          ticks: { padding: 6, autoSkip: false, font: monoFont() },
        },
        y: {
          border: { display: false },
          grid: { display: false },
          ticks: { padding: 10, autoSkip: false, crossAlign: 'far', font: monoFont() },
        },
      },
    },
  })
  paint()
  chart.update('none')
  state.value = 'drawn'
}

onMounted(() => {
  if (!plot.value) return
  // Scroll-reveal (ADR-001 pattern): draw once, when the figure enters view.
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        buildChart()
        io?.disconnect()
      }
    },
    { threshold: 0.15 },
  )
  io.observe(plot.value)
  // Theme toggle: re-read the tokens and repaint.
  mo = new MutationObserver(() => {
    if (!drawn || !chart) return
    paint()
    chart.update('none')
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  io?.disconnect()
  mo?.disconnect()
  chart?.destroy()
  chart = null
})
</script>

<template>
  <figure class="bmk-fig">
    <figcaption class="bmk-fig-title">Tokens per query · mean with min–max whisker</figcaption>
    <div
      class="bmk-fig-plot"
      ref="plot"
      role="img"
      data-chart-type="bar"
      :data-state="state"
      :aria-label="ARIA"
    >
      <canvas ref="canvas"></canvas>
    </div>
    <p class="bmk-fig-note">
      <span class="key ref"></span>L0 reference
      <span class="key partial"></span>L1 scoped contract
      <span class="key ok"></span>full coverage
      <span class="sep">·</span>SPEC §9.3 heuristic, lower is cheaper
    </p>
  </figure>
</template>

<style scoped>
.bmk-fig {
  margin: 0;
}
.bmk-fig-title {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin: 0 0 0.75rem;
}
/* Height is sized to five rows (≈42px each) plus the axis band — not to a round
   number: a taller box would letterbox the bars. */
.bmk-fig-plot {
  width: 100%;
  height: 15.5rem;
}
/* A <canvas> with no width/height attributes has an INTRINSIC size of 300×150.
   Between first paint and the scroll-reveal draw, that 300px overflows a 320px
   viewport by 4px and the document scrolls sideways for ~120ms. chart.js later
   sets an inline width and the symptom disappears — so the canvas must be
   incapable of exceeding its container before chart.js ever touches it. */
.bmk-fig-plot canvas {
  display: block;
  width: 100%;
  max-width: 100%;
}
.bmk-fig-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.75rem;
  margin: 0.75rem 0 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--vp-c-text-3);
}
/* A legend chip is a SAMPLE of the mark, so it carries the mark's whole
   construction: the light fill AND the 1px full-strength edge (`EDGE`, drawn at
   `borderWidth: 1` on every bar). Without the edge the chip is both unfaithful
   and imperceptible — the fills alone measure 1.4–1.9:1 on the light page,
   under the 3:1 WCAG 1.4.11 floor for a graphical object; the edge is what
   carries them, exactly as it carries the bars. */
.key {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 3px;
  margin-right: -0.375rem;
  border: 1px solid;
}
.key.ref {
  background: color-mix(in srgb, var(--vp-c-text-3) 34%, var(--vp-c-bg));
  border-color: var(--vp-c-text-2);
}
.key.partial {
  background: color-mix(in srgb, var(--vp-c-term-warn) 62%, var(--vp-c-bg));
  border-color: var(--vp-c-warning-3);
}
.key.ok {
  background: color-mix(in srgb, var(--vp-c-brand-1) 62%, var(--vp-c-bg));
  border-color: var(--vp-c-brand-3);
}
.sep {
  color: var(--vp-c-border);
}
@media (max-width: 640px) {
  .bmk-fig-plot {
    height: 13.5rem;
  }
}
</style>
