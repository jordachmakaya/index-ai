<script setup lang="ts">
// v4 BenchmarkScaffold (V-006): page head + document wrapper for the public
// benchmark page. Same page-head voice as SpecToc (V-002), QuickstartScaffold
// (V-003), CompareScaffold (V-004) and ChangelogScaffold (V-005) — site
// cohesion. The results tables are styled via `.bmk-body` in custom.css and
// the scoped styles of BenchmarkResults (slot content can't be scoped here).
</script>

<template>
  <div class="bmk-page">
    <header class="page-head">
      <p class="crumb">index-ai / Benchmark</p>
      <h1>Public benchmark</h1>
      <p class="lede">
        The published <b>§13.4</b> run — 250 synthetic sites (50 per level), 1,250 queries across
        five query types. It measures what each conformance level costs an agent in
        <b>tokens</b> and whether the payload it reads contains the <b>correct citation</b>.
      </p>
    </header>
    <div class="bmk-body">
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
</style>
