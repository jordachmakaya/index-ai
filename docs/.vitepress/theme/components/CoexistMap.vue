<script setup lang="ts">
// v4 CoexistMap (V-004 · hallmark Map/Diagram): the spatial answer to
// "Do they coexist?" — a hub-and-spoke diagram: your site as the trunk,
// the four conventions hanging from it (robots.txt / sitemap.xml / llms.txt
// / index-ai), one job each. The index-ai node carries the verification
// accent (brand green), echoing the home panels. Node-by-node ink-on reveal
// (cap 5 nodes = trunk + 4), disabled under prefers-reduced-motion.
// Facts preserved verbatim from the bullets they replace (2026-08-12).
import { ref, onMounted, onBeforeUnmount } from 'vue'

const root = ref<HTMLElement | null>(null)
const inView = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        inView.value = true
        io?.disconnect()
      }
    },
    { threshold: 0.15 },
  )
  if (root.value) io.observe(root.value)
})

onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div class="co-map" :class="{ in: inView }" ref="root">
    <p class="co-orient">Same origin — four conventions, one job each.</p>

    <div class="co-trunk">
      <span class="co-trunk-mark" aria-hidden="true"></span>
      <b>Your site</b>
      <span class="co-trunk-sub">one origin · one server</span>
    </div>

    <div class="co-row">
      <span class="co-spoke" aria-hidden="true"></span>
      <div class="co-node">
        <span class="co-dot" aria-hidden="true"></span>
        <b>robots.txt</b>
        <span class="co-cap">says what agents <em>cannot</em> access</span>
      </div>
      <div class="co-node">
        <span class="co-dot" aria-hidden="true"></span>
        <b>sitemap.xml</b>
        <span class="co-cap">lists URLs</span>
      </div>
      <div class="co-node">
        <span class="co-dot" aria-hidden="true"></span>
        <b>llms.txt</b>
        <span class="co-cap">gives human-readable context</span>
      </div>
      <div class="co-node n-ia">
        <span class="co-dot" aria-hidden="true"></span>
        <b>index-ai</b>
        <span class="co-cap">gives structured, measured, queryable content</span>
      </div>
    </div>

    <p class="co-legend">
      All four sit on the same origin, side by side. <b>index-ai is the only one that is measured and machine-queryable.</b>
    </p>
  </div>
</template>

<style scoped>
.co-map {
  margin: 1.75rem 0 0;
}
.co-orient {
  font-family: var(--vp-font-family-mono);
  font-size: 0.78125rem;
  color: var(--vp-c-text-3);
  margin: 0 0 1.25rem;
  text-align: center;
}
.co-trunk {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: max-content;
  max-width: 100%;
  margin-inline: auto;
  padding: 0.6875rem 1.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 9999px;
  background: var(--vp-c-bg-soft);
}
.co-trunk-mark {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 2px;
  background: var(--vp-c-brand-1);
  flex: none;
}
.co-trunk b {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.co-trunk-sub {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}
.co-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.875rem;
  padding-top: 2rem;
  margin-top: 1.75rem;
}
.co-spoke {
  position: absolute;
  top: 0;
  left: 8%;
  right: 8%;
  height: 1px;
  background: var(--vp-c-border);
}
.co-node {
  position: relative;
  min-width: 0;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1rem 1.125rem;
}
.co-node::before {
  content: '';
  position: absolute;
  top: -2rem;
  left: 50%;
  width: 1px;
  height: 2rem;
  background: var(--vp-c-border);
}
.co-node b {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}
.co-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 2px;
  background: var(--vp-c-text-3);
  flex: none;
}
.co-cap {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin-top: 0.375rem;
  overflow-wrap: anywhere;
}
.co-cap em {
  color: var(--vp-c-text-1);
}
/* index-ai — the verification accent (echo of the home agent panel) */
.co-node.n-ia {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-tint);
}
.co-node.n-ia .co-dot {
  background: var(--vp-c-brand-1);
}
.co-node.n-ia b {
  color: var(--vp-c-brand-3);
}
.co-legend {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--vp-c-text-3);
  margin: 1.5rem auto 0;
  max-width: 42rem;
  text-align: center;
}
.co-legend b {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

/* Node-by-node ink-on (cap 5 nodes: trunk + 4), motion-safe only */
@media (prefers-reduced-motion: no-preference) {
  .co-map .co-trunk,
  .co-map .co-node,
  .co-map .co-spoke {
    opacity: 0;
    transform: translateY(10px);
  }
  .co-map.in .co-trunk,
  .co-map.in .co-node,
  .co-map.in .co-spoke {
    opacity: 1;
    transform: none;
    transition: opacity 450ms cubic-bezier(0.16, 1, 0.3, 1), transform 450ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .co-map.in .co-trunk {
    transition-delay: 40ms;
  }
  .co-map.in .co-node:nth-child(2) {
    transition-delay: 80ms;
  }
  .co-map.in .co-node:nth-child(3) {
    transition-delay: 160ms;
  }
  .co-map.in .co-node:nth-child(4) {
    transition-delay: 240ms;
  }
  .co-map.in .co-node:nth-child(5) {
    transition-delay: 320ms;
  }
}

@media (max-width: 860px) {
  .co-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-top: 0;
  }
  /* Multi-row layouts: the single top spoke can't reach row 2+ — drop the
     connector apparatus, keep the flat grid (same collapse as .two-grid). */
  .co-spoke,
  .co-node::before {
    display: none;
  }
}
@media (max-width: 480px) {
  .co-row {
    grid-template-columns: 1fr;
  }
}
</style>
