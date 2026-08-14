<script setup lang="ts">
// v4 TokenBars (V-006 · hallmark Stat-Led): the token-cost story of the
// published §13.4 run, drawn by hand — no chart library (package.json has
// `dependencies: {}` by design; LIBS_REGISTRY allows only vitepress, and the
// tsparticles precedent was replaced by hand-rolled canvas). Horizontal bars
// scale the mean tokens per query by level; color means something: L0 is the
// neutral reference, L1 amber (partial citation), L2a/L2b/L3 verification
// green (100 % citation). Grow-in reveal on scroll (CoexistMap pattern),
// collapsed to static full bars under prefers-reduced-motion.
// Facts from benchmark/results/2026-08-12-seed20260813.json.
import { ref, onMounted, onBeforeUnmount } from 'vue'

type BarRow = { level: string; name: string; tokens: number; tone: 'ref' | 'partial' | 'ok' }

const rows: BarRow[] = [
  { level: 'L0', name: 'HTML', tokens: 955, tone: 'ref' },
  { level: 'L1', name: 'Manifest', tokens: 145, tone: 'partial' },
  { level: 'L2a', name: 'Index', tokens: 147, tone: 'ok' },
  { level: 'L2b', name: 'Graph', tokens: 147, tone: 'ok' },
  { level: 'L3', name: 'Query', tokens: 210, tone: 'ok' },
]

const max = rows[0].tokens
const pct = (t: number) => Math.round((t / max) * 1000) / 10

const root = ref<HTMLElement | null>(null)
const inView = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    inView.value = true // static full bars — no hidden content, no animation
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        inView.value = true
        io?.disconnect()
      }
    },
    { threshold: 0.25 },
  )
  if (root.value) io.observe(root.value)
})

onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div class="tok" ref="root" :class="{ in: inView }">
    <div
      class="tok-chart"
      role="img"
      aria-label="Token consumption per query by conformance level — L0 HTML 955, L1 manifest 145, L2a index 147, L2b graph 147, L3 query 210 mean tokens (SPEC §9.3 heuristic). Lower is cheaper."
    >
      <div v-for="(r, i) in rows" :key="r.level" class="tok-row">
        <span class="tok-level">{{ r.level }}<span class="tok-name">{{ r.name }}</span></span>
        <div class="tok-track">
          <div
            class="tok-bar"
            :class="r.tone"
            :style="{ width: pct(r.tokens) + '%', '--bar-delay': `${i * 90}ms` }"
          ></div>
        </div>
        <span class="tok-val" :class="{ dim: r.tone === 'ref' }">{{ r.tokens }}</span>
      </div>
    </div>
    <p class="tok-axis">mean tokens per query · SPEC §9.3 heuristic · lower is cheaper</p>
  </div>
</template>

<style scoped>
.tok {
  margin: 1.5rem 0 0;
}
.tok-row {
  display: grid;
  grid-template-columns: 9rem 1fr 3.5rem;
  gap: 1rem;
  align-items: center;
  padding: 0.875rem 0;
  border-top: 1px solid var(--vp-c-border);
}
.tok-row:first-child {
  border-top: none;
  padding-top: 0;
}
.tok-level {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}
.tok-level .tok-name {
  font-weight: 400;
  color: var(--vp-c-text-3);
  margin-left: 0.5rem;
}
.tok-track {
  height: 0.625rem;
  border-radius: 9999px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border-soft);
  overflow: hidden;
}
.tok-bar {
  height: 100%;
  border-radius: 9999px;
  transform: scaleX(0);
  transform-origin: left;
  will-change: transform;
}
.tok.in .tok-bar {
  transform: scaleX(1);
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--bar-delay, 0ms);
}
/* color means something: neutral reference / amber partial / green full citation */
.tok-bar.ref {
  background: color-mix(in srgb, var(--vp-c-text-3) 32%, transparent);
}
.tok-bar.partial {
  background: color-mix(in srgb, var(--vp-c-warning-3) 55%, transparent);
}
.tok-bar.ok {
  background: color-mix(in srgb, var(--vp-c-brand-1) 55%, transparent);
}
.tok-val {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.tok-val.dim {
  color: var(--vp-c-text-3);
}
.tok-axis {
  margin: 0.75rem 0 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  color: var(--vp-c-text-3);
}
@media (max-width: 640px) {
  .tok-row {
    grid-template-columns: 6.5rem 1fr 3rem;
    gap: 0.625rem;
  }
}
</style>
