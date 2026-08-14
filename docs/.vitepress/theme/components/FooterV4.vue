<script setup lang="ts">
// V-009 footer — a specification foot, not a marketing band.
//
// Three separated jobs, stacked, never one `·`-glued ribbon:
//   1. identity   index-ai · 1.0-rc2 · Release candidate   (--vp-c-text-1 wordmark)
//   2. legal      Spec text CC-BY-4.0 / Code & examples MIT
//   3. meta       the Shokunin credit (left) and the four site links (right)
//
// Hierarchy is built from --vp-c-text-1 and --vp-c-text-2 ONLY. --vp-c-text-3 is
// 3.90:1 against this ground in dark and --vp-c-brand-1 is 2.69:1 in light: both
// fail WCAG AA at 12-16px (JOB §2bis(a)). Type is 12 / 14 / 16px, weight ≤ 600.
//
// Separation is done with layout (flex groups, distinct rows), not with `·`
// characters between elements — that is what orphaned "Changelog" onto its own
// line behind a dangling separator in v4. Below 40rem every link stacks, so a
// link is never left alone next to a row of its peers.
//
// z-index: the doc aside (TOC) is position:fixed height:100vh (VitePress native);
// without an elevated z-index the fixed aside paints OVER the footer at page end.
// The native VPFooter uses the same contract (position:relative + z-index-footer).
// withBase: every internal link must resolve under the Pages base ('/index-ai/').
import { withBase } from 'vitepress'

const links = [
  { label: 'Spec', href: '/spec/' },
  { label: 'Quickstart', href: '/quickstart' },
  { label: 'vs llms.txt', href: '/compare/llms-txt' },
  { label: 'Changelog', href: '/changelog' },
] as const
</script>

<template>
  <footer class="foot-v4" id="foot">
    <div class="wrap">
      <p class="ident">
        <b class="mark">index-ai</b>
        <span class="ver">1.0-rc2 · Release candidate</span>
      </p>
      <p class="legal">
        <span>Spec text <b>CC-BY-4.0</b></span>
        <span>Code &amp; examples <b>MIT</b></span>
      </p>
      <div class="meta">
        <a
          class="credit"
          href="https://jordach.dev/projects/shokunin-harness"
          target="_blank"
          rel="noopener noreferrer"
          >Built with <b>Shokunin Harness</b></a
        >
        <nav class="foot-nav" aria-label="Footer">
          <a v-for="l in links" :key="l.href" :href="withBase(l.href)">{{ l.label }}</a>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.foot-v4 {
  position: relative;
  z-index: var(--vp-z-index-footer);
  border-top: 1px solid var(--vp-c-border);
  padding: 2rem 0 2.5rem;
  background: var(--vp-c-bg);
}
/* The site column: 72rem with the site's 3rem gutter, no padding of its own —
   JOB §2bis(c). Padding here would move the ink off the measured column. */
.wrap {
  width: calc(100% - 3rem);
  max-width: 72rem;
  margin-inline: auto;
}

/* 1 — identity */
.ident {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  margin: 0;
}
.mark {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}
.ver {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

/* 2 — legal */
.legal {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.5rem;
  margin: 0.625rem 0 0;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.legal span {
  white-space: nowrap;
}
.legal b {
  font-weight: 600;
  color: var(--vp-c-text-2);
}

/* 3 — meta: credit and navigation, below a hairline */
.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--vp-c-border);
}
.foot-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.foot-nav a {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  text-decoration: none;
  white-space: nowrap;
}
.credit {
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  text-decoration: none;
}
.credit b {
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.foot-nav a:hover,
.credit:hover,
.credit:hover b {
  color: var(--vp-c-text-1);
  text-decoration: underline;
}

/* From 40rem the meta row opens out: credit left, navigation right. Below it,
   every link owns a line — a 3 + 1 wrap is the orphan the JOB forbids. */
@media (min-width: 40rem) {
  .meta {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem 2rem;
  }
  .foot-nav {
    flex-direction: row;
    gap: 1.5rem;
  }
}
</style>
