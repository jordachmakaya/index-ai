<script setup lang="ts">
// Validated footer badge (v4 design): Shokunin Harness → jordach.dev.
// External link: rel noopener noreferrer (z6 security invariant D).
</script>

<template>
  <a class="footer-badge" href="https://jordach.dev/projects/shokunin-harness" target="_blank" rel="noopener noreferrer">
    <span class="badge-dot" aria-hidden="true"></span>
    Shokunin Harness
  </a>
</template>

<style scoped>
.footer-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 9999px;
  padding: 0.3125rem 0.75rem;
  text-decoration: none;
  transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.footer-badge:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  text-decoration: none;
}
.badge-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}
</style>
