<script setup lang="ts">
// v4 SpecToc (V-002): sticky table of contents linking INTO the canonical
// spec file (docs/spec/SPEC-v1.0-rc2.md) — never duplicates the prose.
// Section slugs follow VitePress heading slugs in that file (leading
// underscore + em-dash preserved, see dist ids). Full coverage of the
// canonical h2 sections, grouped (Phase C′ 2026-08-12). withBase: the
// deep links must resolve under the Pages base ('/index-ai/').
import { withBase } from 'vitepress'
const tocGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/spec/SPEC-v1.0-rc2#_1-the-problem-this-solves', label: '1. The Problem This Solves' },
      { href: '/spec/SPEC-v1.0-rc2#_2-the-agent-view-concept', label: '2. The Agent View Concept' },
      { href: '/spec/SPEC-v1.0-rc2#_3-terminology', label: '3. Terminology' },
      { href: '/spec/SPEC-v1.0-rc2#_4-design-goals', label: '4. Design Goals' },
      { href: '/spec/SPEC-v1.0-rc2#_5-discovery', label: '5. Discovery' },
    ],
  },
  {
    label: 'Conformance levels',
    items: [
      { num: '1', href: '/spec/SPEC-v1.0-rc2#_6-level-1-—-ai-manifest', label: 'Level 1 — AI Manifest' },
      { num: '2a', href: '/spec/SPEC-v1.0-rc2#_7-level-2-—-agent-view', label: 'Level 2a — Agent Index' },
      { num: '2b', href: '/spec/SPEC-v1.0-rc2#_7-level-2-—-agent-view', label: 'Level 2b — Agent Graph' },
      { num: '3', href: '/spec/SPEC-v1.0-rc2#_8-level-3-—-query-interface', label: 'Level 3 — Query Interface' },
    ],
  },
  {
    label: 'Details',
    items: [
      { href: '/spec/SPEC-v1.0-rc2#_9-token-economics', label: '9. Token Economics' },
      { href: '/spec/SPEC-v1.0-rc2#_10-policy-usage-preferences', label: '10. Policy & Usage Preferences' },
      { href: '/spec/SPEC-v1.0-rc2#_11-publisher-roles', label: '11. Publisher Roles' },
      { href: '/spec/SPEC-v1.0-rc2#_12-freshness-versioning', label: '12. Freshness & Versioning' },
    ],
  },
  {
    label: 'Standard',
    items: [
      { href: '/spec/SPEC-v1.0-rc2#_13-conformance', label: '13. Conformance' },
      { href: '/spec/SPEC-v1.0-rc2#_14-security-considerations', label: '14. Security Considerations' },
      { href: '/spec/SPEC-v1.0-rc2#_15-privacy-considerations', label: '15. Privacy Considerations' },
      { href: '/spec/SPEC-v1.0-rc2#_16-compatibility', label: '16. Compatibility' },
      { href: '/spec/SPEC-v1.0-rc2#_17-governance', label: '17. Governance' },
      { href: '/spec/SPEC-v1.0-rc2#_18-changelog', label: '18. Changelog' },
    ],
  },
]
const meta = [
  { k: 'Version', v: '1.0-rc2' },
  { k: 'Status', v: 'REQUEST FOR COMMENTS' },
  { k: 'License', v: 'MIT · CC-BY-4.0' },
  { k: 'Reference impl', v: '@hardmachinelabs/index-ai-validator' },
]
</script>

<template>
  <div class="spec-page">
    <div class="page-head">
      <p class="crumb">index-ai / Specification</p>
      <h1>index-ai — An Open Specification Proposal for Agent-Readable Web Content</h1>
      <p class="lede">
        The normative text of the specification, versioned and navigable. This site documents
        <b>version 1.0-rc2</b> — check the <a :href="withBase('/changelog')">changelog</a> for the latest published version.
      </p>
      <dl class="meta-row">
        <div v-for="m in meta" :key="m.k"><dt>{{ m.k }}</dt><dd>{{ m.v }}</dd></div>
      </dl>
    </div>

    <div class="spec-layout">
      <nav class="toc" aria-label="Table of contents">
        <b>Contents</b>
        <template v-for="g in tocGroups" :key="g.label">
          <span class="toc-group">{{ g.label }}</span>
          <a
            v-for="s in g.items"
            :key="s.label"
            :href="withBase(s.href)"
            class="toc-link"
          >
            <span v-if="s.num" class="toc-num">{{ s.num }}</span>{{ s.label }}
          </a>
        </template>
      </nav>

      <div class="spec-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  padding: 2.25rem 0 1.5rem;
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
}
.crumb {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-bottom: 0.75rem;
}
.page-head h1 {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.022em;
  line-height: 1.15;
  margin: 0 0 0.75rem;
}
.lede {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  max-width: 42.5rem;
  margin: 0;
}
.lede b {
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin: 1.25rem 0 0;
  border-top: 1px solid var(--vp-c-border);
  padding-top: 1rem;
}
.meta-row div {
  display: flex;
  gap: 0.5rem;
}
.meta-row dt {
  color: var(--vp-c-text-3);
}
.meta-row dd {
  color: var(--vp-c-text-1);
  font-weight: 600;
  margin: 0;
}

.spec-layout {
  display: grid;
  grid-template-columns: 14rem 1fr;
  gap: 2.5rem;
  padding: 0.5rem 0 4rem;
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
}
.spec-body {
  min-width: 0;
}
/* NOTE: the slot's own <h2>s (from spec/index.md) are NOT styled here — Vue
   scoped CSS does not reach slot content passed in by the parent (it would
   need :slotted()). The section-heading rule lives in the global custom.css
   instead, alongside the equivalent `.qs-body`/`.cmp-body`/`.clog-body` rules. */
.toc {
  position: sticky;
  top: calc(var(--vp-nav-height) + 1.5rem);
  align-self: start;
  font-size: 0.875rem;
  border-left: 1px solid var(--vp-c-border);
  padding-left: 1rem;
  max-height: calc(100vh - var(--vp-nav-height) - 3rem);
  overflow-y: auto;
}
.toc b {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  margin-bottom: 0.75rem;
}
.toc-group {
  display: block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-brand-1);
  margin: 0.875rem 0 0.25rem;
}
.toc-group:first-of-type {
  margin-top: 0;
}
.toc-link {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--vp-c-text-2);
  padding: 0.25rem 0;
  line-height: 1.35;
}
.toc-link:hover {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.toc-num {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-brand-1);
  min-width: 1.25rem;
}

@media (max-width: 860px) {
  .spec-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: none;
  }
  .toc {
    position: static;
    border-left: none;
    padding-left: 0;
    border-bottom: 1px solid var(--vp-c-border);
    padding-bottom: 1rem;
    margin-bottom: 0.5rem;
    max-height: none;
    overflow: visible;
  }
}
</style>
