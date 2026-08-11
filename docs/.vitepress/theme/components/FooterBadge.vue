<script setup lang="ts">
// Validated footer badge (v4 dir_3_v4.html `.shokunin-badge`): Shokunin Harness
// → jordach.dev, with the gradient diamond SVG mark. External link:
// rel noopener noreferrer (z6 security invariant D).
</script>

<template>
  <a
    class="shokunin-badge"
    href="https://jordach.dev/projects/shokunin-harness"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Built with Shokunin Harness — open the project page"
  >
    <svg class="sb-mark" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="sb-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--vp-c-brand-1)" />
          <stop offset="1" stop-color="var(--vp-c-brand-2)" />
        </linearGradient>
      </defs>
      <path d="M12 1.8 19.5 9.8 12 22.2 4.5 9.8Z" fill="url(#sb-grad)" />
      <path
        d="M4.5 9.8h15M12 1.8v20.4"
        stroke="var(--vp-c-bg)"
        stroke-opacity=".35"
        stroke-width="1"
        fill="none"
      />
    </svg>
    <span>Built with <b>Shokunin Harness</b></span>
  </a>
</template>

<style scoped>
.shokunin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 9999px;
  padding: 0.3125rem 0.875rem;
  text-decoration: none;
  transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.shokunin-badge:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  text-decoration: none;
}
.sb-mark {
  width: 1rem;
  height: 1rem;
  flex: none;
}
</style>
