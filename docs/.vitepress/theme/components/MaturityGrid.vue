<script setup lang="ts">
// v4 MaturityGrid (V-005): the validated 4-card maturity matrix (Phase B
// reference pages/changelog.html `.maturity`) rebuilt on the v4 token system.
// One card per artifact with a status badge — RC/Draft/Tested/Proposed.
// Badge colors are AA-safe on light surfaces (review fix 2026-08-12): the
// terminal ok/warn tokens are dark-surface only — replaced by brand-2 (tested)
// and text-2 (draft) on light tints.
type Item = { artifact: string; status: string; evidence: string; tone: 'accent' | 'ok' | 'warn' | 'dim' }

const items: Item[] = [
  { artifact: 'Normative text', status: 'RC', evidence: 'public tag + commit', tone: 'accent' },
  { artifact: 'Schemas', status: 'Draft', evidence: 'URL + conformance tests', tone: 'warn' },
  { artifact: 'Validator L1/L2a', status: 'Tested', evidence: 'package + fixtures', tone: 'ok' },
  { artifact: 'Level 3 (MCP)', status: 'Proposed', evidence: 'runnable example', tone: 'dim' },
]
</script>

<template>
  <div class="maturity-grid">
    <div v-for="it in items" :key="it.artifact" class="maturity-card">
      <span class="m-status" :class="it.tone">{{ it.status }}</span>
      <h3 class="m-artifact">{{ it.artifact }}</h3>
      <p class="m-evidence">{{ it.evidence }}</p>
    </div>
  </div>
</template>

<style scoped>
.maturity-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0;
}
.maturity-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  padding: 1.125rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}
.m-status {
  align-self: flex-start;
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.1875rem 0.5625rem;
  border-radius: 100px;
}
.m-status.accent {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.m-status.ok {
  color: var(--vp-c-brand-2);
  background: color-mix(in srgb, var(--vp-c-brand-2) 12%, transparent);
}
.m-status.warn {
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}
.m-status.dim {
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg);
}
.m-artifact {
  font-size: 0.84375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  margin: 0;
  line-height: 1.35;
}
.m-evidence {
  font-size: 0.78125rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin: 0;
}

@media (max-width: 860px) {
  .maturity-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 30rem) {
  .maturity-grid {
    grid-template-columns: 1fr;
  }
}
</style>
