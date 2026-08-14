<script setup lang="ts">
// v4 BenchmarkResults (V-007, hallmark Catalogue): the published §13.4 numbers,
// hardcoded from `benchmark/results/2026-08-12-seed20260813.json` (regenerated
// deterministically and locked by tests/benchmark-full.spec.ts — see
// benchmark/README.md for the methodology). Catalogue: five equal items given
// one uniform treatment — the figure leads, then ONE seven-column inventory of
// hairline rows. The Coverage column replaces the V-006 5×5 citation matrix
// (25 cells for one signal); the V-006 Stat-Led hero band is gone. Every number
// here is a fact from the published run, not an estimate.
import TokenBars from './TokenBars.vue'

const TYPES = ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference'] as const
type QueryType = (typeof TYPES)[number]
type Tone = 'ref' | 'partial' | 'ok'

type LevelRow = {
  level: string
  label: string
  mean: number
  median: number
  min: number
  max: number
  p90: number
  rate: number
  tone: Tone
  cited: readonly QueryType[]
}

/** JOB §4 — verbatim, in ladder order. */
const LEVELS: readonly LevelRow[] = [
  { level: 'L0', label: 'HTML', mean: 955, median: 952, min: 908, max: 1021, p90: 989, rate: 100, tone: 'ref', cited: TYPES },
  { level: 'L1', label: 'Manifest', mean: 145, median: 147, min: 137, max: 153, p90: 150, rate: 40, tone: 'partial', cited: ['identity', 'freshness'] },
  { level: 'L2a', label: 'Index', mean: 147, median: 162, min: 92, max: 202, p90: 188, rate: 100, tone: 'ok', cited: TYPES },
  { level: 'L2b', label: 'Graph', mean: 147, median: 162, min: 92, max: 207, p90: 187, rate: 100, tone: 'ok', cited: TYPES },
  { level: 'L3', label: 'Query', mean: 210, median: 190, min: 137, max: 302, p90: 292, rate: 100, tone: 'ok', cited: TYPES },
]

const isCited = (row: LevelRow, type: QueryType): boolean =>
  (row.cited as readonly string[]).includes(type)

function enumerate(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** The dots are an image; this is the only way a screen reader gets the signal. */
function coverageLabel(row: LevelRow): string {
  const missing = TYPES.filter((t) => !isCited(row, t))
  const cites = `cites ${enumerate(row.cited)}`
  const rate = `${row.rate} % citation rate`
  return missing.length === 0
    ? `${cites} — ${rate}`
    : `${cites}; ${enumerate(missing)} not cited — ${rate}`
}
</script>

<template>
  <div class="bmk-results">
    <TokenBars />

    <div class="bmk-t-wrap">
      <table class="bmk-t" aria-label="Per-level results — tokens per query and citation coverage">
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th class="num" scope="col">Mean</th>
            <th class="num" scope="col">Median</th>
            <th class="num" scope="col">Min</th>
            <th class="num" scope="col">Max</th>
            <th class="num" scope="col">p90</th>
            <th scope="col">Coverage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in LEVELS" :key="r.level">
            <th class="row-label" scope="row">
              <span class="tone" :class="r.tone" aria-hidden="true"></span>
              <span class="bmk-lvl">{{ r.level }}</span>
              <span class="bmk-lvl-sub">{{ r.label }}</span>
            </th>
            <td class="num strong">{{ r.mean }}</td>
            <td class="num">{{ r.median }}</td>
            <td class="num soft">{{ r.min }}</td>
            <td class="num soft">{{ r.max }}</td>
            <td class="num soft">{{ r.p90 }}</td>
            <td class="cov">
              <span class="dots" role="img" :aria-label="coverageLabel(r)">
                <i v-for="t in TYPES" :key="t" class="dot" :class="{ on: isCited(r, t) }"></i>
              </span>
              <span class="rate" :class="r.rate === 100 ? 'ok' : 'partial'">{{ r.rate }} %</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="bmk-legend">
      Coverage dots, in order: identity · freshness · specific-fact · listing · cross-reference —
      filled when the payload that level serves contains the correct citation.
    </p>
  </div>
</template>

<style scoped>
.bmk-results {
  margin: 0 0 1.5rem;
}
/* One table at every width: it fills the column and scrolls inside its own
   container below ~40rem — the document never scrolls sideways. */
.bmk-t-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-top: 1.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
}
.bmk-t {
  width: 100%;
  min-width: 40rem;
  border-collapse: collapse;
  font-size: 0.875rem;
  line-height: 1.5;
}
.bmk-t th,
.bmk-t td {
  text-align: left;
  vertical-align: baseline;
  padding: 0.6875rem 1rem;
  border-bottom: 1px solid var(--vp-c-border);
  font-weight: 400;
}
.bmk-t tbody tr:last-child th,
.bmk-t tbody tr:last-child td {
  border-bottom: none;
}
.bmk-t thead th {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 500;
  /* text-2, not text-3: on the bg-soft header band text-3 measures 3.34:1 in
     dark mode (5.78:1 only on the canvas). text-2 is 6.45:1 light / 4.94:1
     dark — AA on both, and a clearer step down from the cell ink. */
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  white-space: nowrap;
}
.bmk-t .num {
  text-align: right;
  font-family: var(--vp-font-family-mono);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bmk-t .strong {
  font-weight: 500;
  color: var(--vp-c-text-1);
}
.bmk-t .soft {
  color: var(--vp-c-text-2);
}
/* Level cell: the tone swatch ties the row to its bar in the figure above. */
.row-label {
  white-space: nowrap;
  color: var(--vp-c-text-1);
}
.tone {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 2px;
  margin-right: 0.625rem;
}
.tone.ref {
  background: color-mix(in srgb, var(--vp-c-text-3) 34%, var(--vp-c-bg));
}
.tone.partial {
  background: color-mix(in srgb, var(--vp-c-term-warn) 62%, var(--vp-c-bg));
}
.tone.ok {
  background: color-mix(in srgb, var(--vp-c-brand-1) 62%, var(--vp-c-bg));
}
.bmk-lvl {
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
  margin-right: 0.5rem;
}
.bmk-lvl-sub {
  color: var(--vp-c-text-2);
}
/* Coverage: five dots in the fixed TYPES order + the published rate as text. */
.cov {
  white-space: nowrap;
}
.dots {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.75rem;
  vertical-align: middle;
}
.dot {
  display: block;
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 50%;
  border: 1px solid var(--vp-c-text-3);
}
.dot.on {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}
.rate {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  vertical-align: middle;
}
.rate.ok {
  color: var(--vp-c-brand-3);
  background: var(--vp-c-brand-tint);
}
/* L1's scoped contract — warn pair per tokens.json (amber-800 light /
   amber-600 dark), both ≥ 5.2:1 on the warning-soft tint. */
.rate.partial {
  color: var(--vp-c-warning-3);
  background: var(--vp-c-warning-soft);
}
.bmk-legend {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}
</style>
