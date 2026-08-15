<script setup lang="ts">
// v4 ChangelogScaffold (V-005 · hallmark Index-First): page head + document
// wrapper for the changelog. Same page-head voice as SpecToc (V-002),
// QuickstartScaffold (V-003) and CompareScaffold (V-004) — site cohesion.
// The version index and maturity grid are styled via `.clog-page` in
// custom.css and the scoped styles of VersionEntry / MaturityGrid.
</script>

<template>
  <div class="clog-page">
    <header class="page-head">
      <p class="crumb">index-ai / Changelog</p>
      <h1>Changelog</h1>
      <p class="lede">
        Published versions are immutable. The docs site currently documents
        <b>1.0-rc2</b> — if this page lists a newer version, follow it.
      </p>
    </header>
    <div class="clog-body">
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
.lede b {
  color: var(--vp-c-text-1);
  font-weight: 600;
}
</style>
