<script setup lang="ts">
// v4 QuickstartScaffold (V-003 · hallmark Component Playground): page head +
// document wrapper for the copy-pasteable walkthrough. The step bands and code
// blocks are styled via `.qs-page` in custom.css (slot content can't be scoped
// to this component). Same page-head voice as SpecToc (V-002) — site cohesion.
// withBase: internal link must resolve under the Pages base ('/index-ai/').
import { withBase } from 'vitepress'
</script>

<template>
  <div class="qs-page">
    <header class="page-head">
      <p class="crumb">index-ai / Quickstart</p>
      <h1>Implement index-ai on your site</h1>
      <p class="lede">
        A complete, copy-pasteable walkthrough covering <b>Level 2a</b> conformance —
        ending with a validator verdict. Levels 2b and 3 are explained in the
        <a :href="withBase('/spec/')">specification</a>, but the walkthrough stops at what the validator can check today.
      </p>
    </header>
    <div class="qs-body">
      <slot />
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
</style>
