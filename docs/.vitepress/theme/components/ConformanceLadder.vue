<script setup lang="ts">
export interface LadderRung {
  id: '1' | '2a' | '2b' | '3'
  title: string
  eta: string
  blurb: string
  file: string
  done?: boolean
}

defineProps<{ rungs: LadderRung[] }>()

// v4 Narrative Workflow macro: the rung number sits INLINE in the heading
// (no eyebrow row) — one column per rung.
</script>

<template>
  <div class="ladder">
    <div v-for="rung in rungs" :key="rung.id" class="ladder-rung" :class="{ done: rung.done }">
      <h3 class="ladder-title">
        <span class="ladder-num">{{ rung.id }}</span>
        {{ rung.title }}
        <em class="ladder-eta">{{ rung.eta }}</em>
      </h3>
      <p class="ladder-blurb">{{ rung.blurb }}</p>
      <code class="ladder-file">{{ rung.file }}</code>
    </div>
  </div>
</template>

<style scoped>
.ladder {
  list-style: none;
}
.ladder-rung {
  padding: 1.125rem 0;
  border-top: 1px solid var(--vp-c-border);
}
.ladder-rung:first-child {
  border-top: none;
}
.ladder-title {
  font-size: 1rem;
  letter-spacing: -0.01em;
  margin: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0 0.5rem;
}
.ladder-num {
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  font-size: 0.8125rem;
  color: var(--vp-c-text-1);
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
}
.ladder-rung.done .ladder-num {
  color: var(--vp-c-brand-1);
}
.ladder-rung.done .ladder-num::before {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  align-self: center;
  flex: none;
}
.ladder-eta {
  font-style: normal;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-brand-1);
}
.ladder-blurb {
  font-size: 0.84375rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
  margin: 0.375rem 0 0;
  max-width: 60ch;
}
.ladder-file {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.71875rem;
  color: var(--vp-c-text-1);
  margin-top: 0.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  padding: 0.1875rem 0.5rem;
  border-radius: 6px;
}
</style>
