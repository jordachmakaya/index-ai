<script setup lang="ts">
// Validated v4 brand mark (dir_3_v4.html `.nav__mark`): 24×24 accent square with
// the mono "i", slight rotate+scale on hover. Rendered via the nav-bar-title-before
// slot so it sits directly before the "index-ai" title.
</script>

<template>
  <a class="nav-mark" href="/" aria-label="index-ai — home">
    <span class="nav-mark__box" aria-hidden="true">i</span>
  </a>
</template>

<style scoped>
.nav-mark {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
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
  font-size: 11px;
  font-weight: 700;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-mark:hover .nav-mark__box {
  transform: rotate(-6deg) scale(1.05);
}
</style>
