<script setup lang="ts">
// Validated v4 footer (dir_3_v4.html): ONE foot-line with · separators —
//   index-ai · Version 1.0-rc1 (REQUEST FOR COMMENTS) · Spec text: CC-BY-4.0
//   · Code & examples: MIT · [Spec] · [Quickstart] · [vs llms.txt] · [Changelog]
// and the Shokunin badge centered BELOW the line, INSIDE the footer.
// The four links map to the real site pages (the validated file used page anchors).
// withBase: every link must resolve under the Pages base ('/index-ai/').
// z-index: the doc aside (TOC) is position:fixed height:100vh (VitePress native);
// without an elevated z-index the fixed aside paints OVER the footer at page end.
// The native VPFooter uses the same contract (position:relative + z-index-footer).
import { withBase } from 'vitepress'
const links = [
  { label: 'Spec', href: '/spec/' },
  { label: 'Quickstart', href: '/quickstart' },
  { label: 'vs llms.txt', href: '/compare/llms-txt' },
  { label: 'Changelog', href: '/changelog' },
]
</script>

<template>
  <footer class="foot-v4" id="foot">
    <div class="wrap">
      <div class="foot-line">
        <span><b>index-ai</b> · Version 1.0-rc1 (REQUEST FOR COMMENTS)</span>
        <span class="foot-sep" aria-hidden="true">·</span>
        <span>Spec text: <b>CC-BY-4.0</b></span>
        <span class="foot-sep" aria-hidden="true">·</span>
        <span>Code &amp; examples: <b>MIT</b></span>
        <span class="foot-sep" aria-hidden="true">·</span>
        <template v-for="(l, i) in links" :key="l.href">
          <a :href="withBase(l.href)">{{ l.label }}</a>
          <span v-if="i < links.length - 1" class="foot-sep" aria-hidden="true">·</span>
        </template>
      </div>
      <div class="foot-badge">
        <a
          class="shokunin-badge"
          href="https://jordach.dev/projects/shokunin-harness"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Built with Shokunin Harness — open the project page"
        >
          <svg class="sb-mark" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id="sb-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="var(--vp-c-brand-1)" />
                <stop offset="1" stop-color="var(--vp-c-brand-2)" />
              </linearGradient>
            </defs>
            <path d="M12 1.8 19.5 9.8 12 22.2 4.5 9.8Z" fill="url(#sb-grad)" />
            <path
              d="M4.5 9.8h15M12 1.8v20.4"
              stroke="var(--vp-c-bg)"
              stroke-opacity=".35"
              stroke-width="1"
              fill="none"
            />
          </svg>
          <span>Built with <b>Shokunin Harness</b></span>
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.foot-v4 {
  position: relative;
  z-index: var(--vp-z-index-footer);
  border-top: 1px solid var(--vp-c-border);
  padding: 1.5rem 0 2.5rem;
  background: var(--vp-c-bg);
}
.wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 1.75rem;
}
.foot-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1rem;
  font-size: 0.78125rem;
  color: var(--vp-c-text-3);
}
.foot-line b {
  color: var(--vp-c-text-3);
  font-weight: 600;
}
.foot-line a {
  color: var(--vp-c-text-2);
  white-space: nowrap;
  text-decoration: none;
}
.foot-line a:hover {
  color: var(--vp-c-brand-3);
  text-decoration: none;
}
.foot-sep {
  opacity: 0.5;
}
.foot-badge {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
.shokunin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 1rem 0.5rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.03em;
  color: var(--vp-c-text-3);
  text-decoration: none;
  white-space: nowrap;
  transition: border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.shokunin-badge:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-1px);
  text-decoration: none;
  box-shadow: 0 6px 20px -8px color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
}
.sb-mark {
  width: 16px;
  height: 16px;
  flex: none;
}
.shokunin-badge b {
  color: var(--vp-c-brand-1);
  font-weight: 650;
}
</style>
