<script setup lang="ts">
// v4 BenchmarkResults (V-006): the published §13.4 numbers, hardcoded from
// `benchmark/results/2026-08-12-seed20260813.json` (regenerated deterministically
// and locked by tests/benchmark-full.spec.ts — see benchmark/README.md for the
// methodology). Same hairline table voice as ComparisonTable (V-004): mono row
// labels, tabular numbers, and the verification accent on full citation.
// Every number here is a fact from the published run, not an estimate.

type LevelRow = { level: string; label: string; mean: number; median: number; min: number; max: number; p90: number; cite: number }
type CiteRow = { level: string; rate: [number, number, number, number, number] }

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

// Efficiency ratios vs the L0 reference (mean tokens).
const ratios = [
  { a: 'L0 / L1', b: '6.6×', c: 'the manifest costs 15% of the raw HTML' },
  { a: 'L0 / L2a', b: '6.5×', c: 'the index costs 15% of the raw HTML' },
  { a: 'L0 / L3', b: '4.6×', c: 'the query interface costs 22% of the raw HTML' },
]
</script>

<template>
  <div class="bmk-tables">
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

    <ul class="bmk-ratios">
      <li v-for="r in ratios" :key="r.a">
        <span class="rat-a">{{ r.a }}</span>
        <span class="rat-b">{{ r.b }}</span>
        <span class="rat-c">{{ r.c }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bmk-tables {
  margin: 1.5rem 0 0;
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
/* Partial citation (L1's scoped contract) — warn-text = amber-800 per
   tokens.json (VitePress warning-3 is the same value); warning-2 is amber-700
   at ~4:1 on the tint, below AA for 0.75rem text (review lesson V-005). */
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
.bmk-ratios {
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
}
.bmk-ratios li {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-border);
}
.bmk-ratios li:last-child {
  border-bottom: none;
}
.rat-a {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  width: 6.5rem;
  flex-shrink: 0;
}
.rat-b {
  font-family: var(--vp-font-family-mono);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  font-variant-numeric: tabular-nums;
  width: 4rem;
  flex-shrink: 0;
}
.rat-c {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
@media (max-width: 640px) {
  .bmk-ratios li {
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
  }
  .rat-c {
    flex-basis: 100%;
  }
}
</style>
