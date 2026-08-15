<script setup lang="ts">
// v4 CompareScaffold (V-004 · hallmark Map/Diagram): page head + document
// wrapper for the comparison page. Same page-head voice as SpecToc (V-002)
// and QuickstartScaffold (V-003) — site cohesion. The table and map are
// styled via `.cmp-page` in custom.css (slot content can't be scoped).
</script>

<template>
  <div class="cmp-page">
    <header class="page-head">
      <p class="crumb">index-ai / Compare</p>
      <h1>index-ai vs llms.txt</h1>
      <p class="lede">
        Different problems, different tools — and they coexist. Here is exactly what index-ai does that
        <code>llms.txt</code> does not, so you can decide with specifics rather than vibes.
      </p>
    </header>
    <div class="cmp-body">
      <slot />
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
.lede code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875em;
  background: var(--vp-c-brand-tint);
  color: var(--vp-c-brand-3);
  border-radius: 5px;
  padding: 0.125rem 0.375rem;
}
</style>
