<script setup lang="ts">
// v4 nav CTA (validated dir_3_v4.html `.nav__cta`): "Read the spec" — black-pill
// primary link in the nav bar, next to the status pill and the theme toggle.
// withBase: the link must resolve under the Pages base ('/index-ai/').
import { withBase } from 'vitepress'
</script>

<template>
  <a class="nav-cta" :href="withBase('/spec/')">Read the spec</a>
</template>

<style scoped>
.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-bg);
  background: var(--vp-c-text-1);
  white-space: nowrap;
  margin-left: 0.625rem;
  transition: background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 80ms cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-cta:hover {
  background: var(--vp-c-text-2);
  text-decoration: none;
}
.nav-cta:active {
  transform: translateY(1px);
}
@media (max-width: 860px) {
  .nav-cta {
    display: none;
  }
}
</style>
