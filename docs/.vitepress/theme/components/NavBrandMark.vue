<script setup lang="ts">
// Validated v4 brand mark (dir_3_v4.html `.nav__mark`): 24×24 accent square with
// the mono "i", slight rotate+scale on hover. Rendered via the nav-bar-title-before
// slot so it sits directly before the "index-ai" title.
</script>

<template>
  <!-- SPAN, not <a>: this renders INSIDE the VitePress title anchor
       (nav-bar-title-before slot) — a nested <a> would be invalid HTML.
       The parent <a class="title"> owns the navigation. -->
  <span class="nav-mark" aria-hidden="true">
    <span class="nav-mark__box">i</span>
  </span>
</template>

<style scoped>
.nav-mark {
  display: inline-flex;
  align-items: center;
  margin-right: 10px;
}
.nav-mark__box {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  display: grid;
  place-items: center;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-mark:hover .nav-mark__box {
  transform: rotate(-6deg) scale(1.05);
}
</style>
