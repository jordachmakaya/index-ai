<script setup lang="ts">
// v4 VersionEntry (V-005 · hallmark Index-First): one immutable version as an
// index row — leading mono version number (echo of the spec ladder), title,
// status tag, dated meta, typed change list (Added/Fixed). Facts preserved
// verbatim from the markdown they replace (2026-08-12). Inline backticks are
// stripped by design (same precedent as ComparisonTable — plain text reads
// fine); no v-html, zero user input (z6 audit clean).
// withBase: the meta link (SPEC section) must resolve under the Pages base.
import { withBase } from 'vitepress'
type Meta = { pre: string; href?: string; link?: string; post?: string }
type Change = { tag: 'Added' | 'Fixed'; text: string }

defineProps<{
  version: string
  title: string
  status: string
  tone?: 'accent' | 'dim'
  meta: Meta
  changes: Change[]
}>()
</script>

<template>
  <section class="ventry">
    <h2 class="ventry-h">
      <span class="ventry-ver" :class="tone">{{ version }}</span><span class="ventry-dash"> — </span><span class="ventry-title">{{ title }}</span>
      <span class="ventry-status" :class="tone">{{ status }}</span>
    </h2>
    <p class="ventry-meta">
      {{ meta.pre }}<a v-if="meta.href" :href="meta.href ? withBase(meta.href) : undefined">{{ meta.link }}</a>{{ meta.post }}
    </p>
    <ul class="ventry-changes">
      <li v-for="c in changes" :key="c.tag + c.text">
        <span class="vtag" :class="c.tag === 'Added' ? 'add' : 'fix'">{{ c.tag }}</span>
        <span class="vtext">{{ c.text }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.ventry {
  border-top: 1px solid var(--vp-c-border);
  padding: 2rem 0;
}
.ventry:last-of-type {
  border-bottom: 1px solid var(--vp-c-border);
}
.ventry-h {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}
.ventry-ver {
  font-family: var(--vp-font-family-mono);
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--vp-c-brand-1);
}
.ventry-ver.dim {
  color: var(--vp-c-text-3);
}
.ventry-dash {
  color: var(--vp-c-text-3);
}
.ventry-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.ventry-status {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.1875rem 0.5625rem;
  border-radius: 100px;
  margin-left: 0.375rem;
}
.ventry-status.accent {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.ventry-status.dim {
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
}
.ventry-meta {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--vp-c-text-3);
  margin: 0.625rem 0 0;
}
.ventry-meta a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
.ventry-changes {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}
.ventry-changes li {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--vp-c-border-soft);
}
.ventry-changes li:last-child {
  border-bottom: none;
}
.vtag {
  flex: none;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  min-width: 3.25rem;
  text-align: center;
}
.vtag.add {
  color: var(--vp-c-brand-3);
  background: var(--vp-c-brand-tint);
}
.vtag.fix {
  color: var(--vp-c-brand-2);
  background: color-mix(in srgb, var(--vp-c-brand-2) 12%, transparent);
}
.vtext {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
  min-width: 0;
}
</style>
