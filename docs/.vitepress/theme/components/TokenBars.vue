<script setup lang="ts">
// v4 TokenFunnel (V-006 · chart.js funnel, Frappe "Stages" style): the
// token-cost story of the published §13.4 run drawn as a funnel — one stage
// per conformance level, drawn in order, width ∝ mean tokens per query, each
// stage labelled with its share of the first (L0 = 100 %, i.e. "what a funnel
// is read for"). chart.js + chartjs-chart-funnel (ADR-001, 2026-08-14):
// chart.js has no native funnel, the plugin admits the type; the tables below
// remain the accessible source of truth, the canvas carries a rich aria-label.
// Color means something (as in the hand-built predecessor): L0 neutral
// reference, L1 amber (partial citation), L2a/L2b/L3 verification green.
// Bars use the same token tints as the badges (blended on the page bg), so the
// ink labels keep AA in both themes; a MutationObserver on the .dark class
// re-reads the tokens on theme toggle (ParticlesBg pattern).
// Facts from benchmark/results/2026-08-12-seed20260813.json.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Chart, LinearScale, CategoryScale } from 'chart.js'
import { FunnelController, TrapezoidElement } from 'chartjs-chart-funnel'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// ESM builds have no side effects — register manually (plugin README Variant A).
Chart.register(FunnelController, TrapezoidElement, LinearScale, CategoryScale, ChartDataLabels)

type Stage = { level: string; name: string; tokens: number; tone: 'ref' | 'partial' | 'ok' }

const stages: Stage[] = [
  { level: 'L0', name: 'HTML', tokens: 955, tone: 'ref' },
  { level: 'L1', name: 'Manifest', tokens: 145, tone: 'partial' },
  { level: 'L2a', name: 'Index', tokens: 147, tone: 'ok' },
  { level: 'L2b', name: 'Graph', tokens: 147, tone: 'ok' },
  { level: 'L3', name: 'Query', tokens: 210, tone: 'ok' },
]
const base = stages[0].tokens
const share = (t: number) => (t / base) * 100

const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'funnel'> | null = null
let io: IntersectionObserver | null = null
let mo: MutationObserver | null = null
let drawn = false

// Expose the draw state for the E2E (deterministic: the canvas paint itself is
// async, but the chart instance existing is not).
const state = ref<'idle' | 'drawn'>('idle')

// ---- token plumbing (canvas can't read CSS var()) ----
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
/** Blend a token color at `alpha` over the page background (the badge-tint
    pattern: light fill + ink text keeps AA in both themes). */
function tint(name: string, alpha: number): string {
  const [fr, fg, fb] = hexToRgb(token(name))
  const [br, bg, bb] = hexToRgb(token('--vp-c-bg'))
  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha))
  return `rgb(${mix(fr, br)}, ${mix(fg, bg)}, ${mix(fb, bb)})`
}
// Computed lazily inside buildChart (client-only): reading tokens at module
// scope would call getComputedStyle during the SSR build and crash.
function toneColors(): Record<Stage['tone'], string> {
  return {
    ref: tint('--vp-c-text-3', 0.32),
    partial: tint('--vp-c-warning-3', 0.55),
    ok: tint('--vp-c-brand-1', 0.55),
  }
}

function buildChart(): void {
  if (drawn || !canvas.value) return
  drawn = true
  state.value = 'drawn'
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mono = token('--vp-font-family-mono') || 'monospace'
  const colors = toneColors()
  chart = new Chart<'funnel'>(canvas.value, {
    type: 'funnel',
    data: {
      labels: stages.map((s) => `${s.level} ${s.name}`),
      datasets: [
        {
          data: stages.map((s) => s.tokens),
          backgroundColor: stages.map((s) => colors[s.tone]),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // vertical funnel: one row per stage, drawn in order, width ∝ value
      indexAxis: 'y',
      animation: reduce ? false : { duration: 900, easing: 'easeOutCubic' },
      layout: { padding: { top: 4, bottom: 4, right: 8 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.label}: ${(ctx.raw as number).toLocaleString()} tokens · ${share(ctx.raw as number).toFixed(1)} % of L0`,
          },
        },
        datalabels: {
          anchor: 'start',
          align: 'start',
          clamp: true,
          font: { family: mono, size: 11, weight: '600' },
          color: token('--vp-c-text-1'),
          formatter: (value: number, ctx: { label?: string; dataIndex: number }) =>
            `${ctx.label}\n${value.toLocaleString()} · ${share(value).toFixed(1)} %`,
          textAlign: 'left',
        },
      },
      scales: {
        // index = the stage rows (labels hidden — the datalabels carry the
        // stage name + value + share of L0, like Frappe's Stages mode)
        x: { display: false, grid: { display: false } },
        y: { display: false, grid: { display: false } },
      },
    },
  })
}

onMounted(() => {
  if (!root.value) return
  // Scroll-reveal (CoexistMap pattern): draw once when the funnel enters view.
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        buildChart()
        io?.disconnect()
      }
    },
    { threshold: 0.2 },
  )
  io.observe(root.value)
  // Theme toggle: re-read the tokens and repaint (ParticlesBg pattern).
  mo = new MutationObserver(() => {
    if (!drawn || !chart) return
    const colors = toneColors()
    chart.data.datasets[0].backgroundColor = stages.map((s) => colors[s.tone])
    chart.options.plugins!.datalabels!.color = token('--vp-c-text-1')
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
  <div
    class="funnel"
    ref="root"
    :data-state="state"
    role="img"
    aria-label="Token consumption per query by conformance level as a funnel — L0 HTML 955 tokens (100%), L1 manifest 145 (15.2%), L2a index 147 (15.4%), L2b graph 147 (15.4%), L3 query 210 (22%). Each stage is a share of L0. Lower is cheaper (SPEC §9.3 heuristic)."
  >
    <div class="funnel-frame">
      <canvas ref="canvas"></canvas>
    </div>
    <p class="funnel-axis">mean tokens per query · share of L0 · SPEC §9.3 heuristic · lower is cheaper</p>
  </div>
</template>

<style scoped>
.funnel {
  margin: 1.5rem 0 0;
}
.funnel-frame {
  height: 16rem;
  width: 100%;
}
@media (max-width: 640px) {
  .funnel-frame {
    height: 14rem;
  }
}
.funnel-axis {
  margin: 0.75rem 0 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  color: var(--vp-c-text-3);
}
</style>
