<script setup lang="ts">
// v4 SpecToc (V-002): sticky table of contents linking INTO the canonical
// spec file (docs/spec/SPEC-v1.0-rc1.md) — never duplicates the prose.
// Section slugs follow VitePress heading slugs in that file.
// Note: VitePress slugs keep the leading underscore and the em-dash (see dist ids).
const sections = [
  { id: '1', label: 'Level 1 — AI Manifest', href: '/spec/SPEC-v1.0-rc1#_6-level-1-—-ai-manifest' },
  { id: '2a', label: 'Level 2a — Agent Index', href: '/spec/SPEC-v1.0-rc1#_7-level-2-—-agent-view' },
  { id: '2b', label: 'Level 2b — Agent Graph', href: '/spec/SPEC-v1.0-rc1#_7-level-2-—-agent-view' },
  { id: '3', label: 'Level 3 — Query Interface', href: '/spec/SPEC-v1.0-rc1#_8-level-3-—-query-interface' },
]
const meta = [
  { k: 'Version', v: '1.0-rc1' },
  { k: 'Status', v: 'REQUEST FOR COMMENTS' },
  { k: 'License', v: 'MIT · CC-BY-4.0' },
  { k: 'Reference impl', v: '@hardmachinelabs/index-ai-validator' },
]
</script>

<template>
  <div class="spec-page">
    <div class="page-head">
      <p class="crumb">index-ai / Specification</p>
      <h1>index-ai — A Verifiable Standard for Agent-Readable Web Content</h1>
      <p class="lede">
        The normative text of the specification, versioned and navigable. This site documents
        <b>version 1.0-rc1</b> — check the <a href="/changelog">changelog</a> for the latest published version.
      </p>
      <dl class="meta-row">
        <div v-for="m in meta" :key="m.k"><dt>{{ m.k }}</dt><dd>{{ m.v }}</dd></div>
      </dl>
    </div>

    <div class="spec-layout">
      <nav class="toc" aria-label="Table of contents">
        <b>Contents</b>
        <a
          v-for="s in sections"
          :key="s.id"
          :href="s.href"
          class="toc-link"
        >
          <span class="toc-num">{{ s.id }}</span>{{ s.label }}
        </a>
        <a class="toc-link" href="/spec/SPEC-v1.0-rc1#_14-security-considerations">Security</a>
        <a class="toc-link" href="/spec/SPEC-v1.0-rc1#_15-privacy-considerations">Privacy</a>
        <a class="toc-link" href="/spec/SPEC-v1.0-rc1#_18-changelog">Changelog</a>
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
}
.crumb {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-bottom: 0.75rem;
}
.page-head h1 {
  font-size: clamp(1.625rem, 3.5vw, 2rem);
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
  font-size: 0.78125rem;
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
  grid-template-columns: 15rem 1fr;
  gap: 3rem;
  padding: 0.5rem 0 4rem;
}
.toc {
  position: sticky;
  top: calc(var(--vp-nav-height) + 1.5rem);
  align-self: start;
  font-size: 0.8125rem;
  border-left: 1px solid var(--vp-c-border);
  padding-left: 1rem;
  max-height: calc(100vh - var(--vp-nav-height) - 3rem);
  overflow-y: auto;
}
.toc b {
  display: block;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  margin-bottom: 0.75rem;
}
.toc-link {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--vp-c-text-2);
  padding: 0.3125rem 0;
  line-height: 1.35;
}
.toc-link:hover {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.toc-num {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  color: var(--vp-c-brand-1);
  min-width: 1.25rem;
}

@media (max-width: 860px) {
  .spec-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
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
