<script setup lang="ts">
// Validated status pill — version + status label, rendered from tokens only.
defineProps<{ version?: string; status?: string }>()
</script>

<template>
  <span class="status-pill" aria-label="index-ai status: {{ version }} · {{ status }}">
    {{ version ?? '1.0-rc1' }} · {{ status ?? 'RFC' }}
  </span>
</template>

<style scoped>
.status-pill {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent);
  padding: 0.3125rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
}
</style>
