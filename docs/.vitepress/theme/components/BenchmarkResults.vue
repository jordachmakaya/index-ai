<script setup lang="ts">
// v4 BenchmarkResults (V-006, hallmark Stat-Led): the published §13.4 numbers,
// hardcoded from `benchmark/results/2026-08-12-seed20260813.json` (regenerated
// deterministically and locked by tests/benchmark-full.spec.ts — see
// benchmark/README.md for the methodology). Stat-Led: the hero IS the data — a
// band of the four headline facts leads (counted up on scroll), the token-cost
// chart (TokenBars) and the two tables support them. One data voice across the
// page: mono labels, tabular numerals, hairline rules. Every number here is a
// fact from the published run, not an estimate.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TokenBars from './TokenBars.vue'

type LevelRow = { level: string; label: string; mean: number; median: number; min: number; max: number; p90: number; cite: number }
type CiteRow = { level: string; rate: [number, number, number, number, number] }

// Stat-Led hero band — each figure carries its words (never a bare number).
const stats = [
  { value: 6.6, suffix: '×', label: 'Token cut vs raw HTML', sub: 'the L1 manifest answers identity & freshness at 100 % citation' },
  { value: 6.5, suffix: '×', label: 'Full retrieval at ~15 % of the cost', sub: 'L2a/L2b cite all five query types at 100 %' },
  { value: 4.6, suffix: '×', label: 'Query interface at ~22 % of the cost', sub: 'L3 keeps 100 % citation on every type' },
  { value: 250, suffix: '', label: 'Synthetic sites, 50 per level', sub: '1,250 queries · deterministic, seed-locked' },
]

// Count-up on scroll (number landing = data feedback, 700 ms ease-out cubic;
// reduced-motion: final value shown statically). Values stay facts: they land
// on exactly the published figures.
const displays = stats.map((s) => ref(s.value.toFixed(s.value % 1 ? 1 : 0)))
const band = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let raf = 0

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io?.disconnect()
        const t0 = performance.now()
        const dur = 700
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / dur)
          const eased = 1 - Math.pow(1 - t, 3)
          stats.forEach((s, i) => {
            displays[i].value = (s.value * eased).toFixed(s.value % 1 ? 1 : 0)
          })
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      }
    },
    { threshold: 0.3 },
  )
  if (band.value) io.observe(band.value)
})

onBeforeUnmount(() => {
  io?.disconnect()
  cancelAnimationFrame(raf)
})

const levels: LevelRow[] = [
  { level: 'L0', label: 'HTML', mean: 955, median: 952, min: 908, max: 1021, p90: 989, cite: 100 },
  { level: 'L1', label: 'Manifest', mean: 145, median: 147, min: 137, max: 153, p90: 150, cite: 40 },
  { level: 'L2a', label: 'Index', mean: 147, median: 162, min: 92, max: 202, p90: 188, cite: 100 },
  { level: 'L2b', label: 'Graph', mean: 147, median: 162, min: 92, max: 207, p90: 187, cite: 100 },
  { level: 'L3', label: 'Query', mean: 210, median: 190, min: 137, max: 302, p90: 292, cite: 100 },
]

const citeRows: CiteRow[] = [
  { level: 'L0', rate: [100, 100, 100, 100, 100] },
  { level: 'L1', rate: [100, 100, 0, 0, 0] },
  { level: 'L2a', rate: [100, 100, 100, 100, 100] },
  { level: 'L2b', rate: [100, 100, 100, 100, 100] },
  { level: 'L3', rate: [100, 100, 100, 100, 100] },
]

const types = ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference']
</script>

<template>
  <div class="bmk-tables">
    <ul class="bmk-stats" ref="band" aria-label="Headline results from the published run">
      <li v-for="(s, i) in stats" :key="s.label" class="bmk-stat">
        <div class="bmk-stat-value">{{ displays[i].value }}{{ s.suffix }}</div>
        <div class="bmk-stat-label">{{ s.label }}</div>
        <p class="bmk-stat-sub">{{ s.sub }}</p>
      </li>
    </ul>

    <TokenBars />

    <div class="bmk-t-wrap">
      <table class="bmk-t" aria-label="Per-level results — tokens and citation rate">
        <thead>
          <tr>
            <th class="dim" scope="col" aria-label="Level"></th>
            <th class="num" scope="col">Mean tokens</th>
            <th class="num" scope="col">Median</th>
            <th class="num" scope="col">Min</th>
            <th class="num" scope="col">Max</th>
            <th class="num" scope="col">p90</th>
            <th class="num" scope="col">Citation</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in levels" :key="r.level" :class="{ ref: r.level === 'L0' }">
            <th class="row-label" scope="row">
              <span class="lvl">{{ r.level }}</span>
              <span class="lvl-sub">{{ r.label }}</span>
            </th>
            <td class="num strong">{{ r.mean }}</td>
            <td class="num">{{ r.median }}</td>
            <td class="num dim-num">{{ r.min }}</td>
            <td class="num dim-num">{{ r.max }}</td>
            <td class="num dim-num">{{ r.p90 }}</td>
            <td class="num">
              <span class="cite" :class="{ ok: r.cite === 100, partial: r.cite < 100 }">{{ r.cite }}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bmk-t-wrap">
      <table class="bmk-t cite-t" aria-label="Citation rate by query type and level">
        <thead>
          <tr>
            <th class="dim" scope="col" aria-label="Level"></th>
            <th v-for="t in types" :key="t" class="num" scope="col">{{ t }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in citeRows" :key="r.level">
            <th class="row-label" scope="row">{{ r.level }}</th>
            <td v-for="(rate, i) in r.rate" :key="i" class="num">
              <span class="cite" :class="{ ok: rate === 100, partial: rate < 100 }">{{ rate }}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.bmk-tables {
  margin: 1.5rem 0 0;
}
/* ---- Stat-Led hero band (hallmark) — panel voice, XL tabular figures ---- */
.bmk-stats {
  list-style: none;
  margin: 0 0 2.5rem;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.bmk-stat {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--vp-c-text-1) 3%, transparent);
}
.bmk-stat-value {
  font-family: var(--vp-font-family-mono);
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}
.bmk-stat-label {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}
.bmk-stat-sub {
  margin: 0.375rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
/* The 40rem tables must never overflow the page (v4 320px lesson — same
   scroll-container treatment as the comparison table V-004). */
.bmk-t-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.bmk-t {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  margin: 1rem 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  min-width: 40rem;
}
.bmk-t th,
.bmk-t td {
  text-align: left;
  vertical-align: middle;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-border);
}
.bmk-t tr:last-child th,
.bmk-t tr:last-child td {
  border-bottom: none;
}
.bmk-t thead th {
  font-family: var(--vp-font-family-mono);
  font-size: 0.71875rem;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.bmk-t .dim {
  width: 9rem;
}
.bmk-t .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.bmk-t thead .num {
  text-align: right;
}
.row-label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}
.row-label .lvl {
  margin-right: 0.5rem;
}
.row-label .lvl-sub {
  font-weight: 400;
  color: var(--vp-c-text-3);
}
.bmk-t .strong {
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.bmk-t .dim-num {
  color: var(--vp-c-text-3);
}
.cite {
  display: inline-block;
  min-width: 2.75rem;
  text-align: center;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  padding: 0.1875rem 0.5rem;
}
.cite.ok {
  color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-tint);
}
/* Partial citation (L1's scoped contract) — warn-text per tokens.json
   (amber-800 light / amber-600 dark, declared in custom.css :root/.dark),
   both ≥ 5.2:1 on the warning-soft tint (AA verified 2026-08-14). */
.cite.partial {
  color: var(--vp-c-warning-3);
  background: var(--vp-c-warning-soft);
}
/* reference row (raw HTML) stays readable but recedes */
.bmk-t tr.ref .row-label {
  color: var(--vp-c-text-3);
}
.cite-t {
  margin-top: 0.5rem;
}
@media (max-width: 1100px) {
  .bmk-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .bmk-stats {
    grid-template-columns: 1fr;
  }
}
</style>
