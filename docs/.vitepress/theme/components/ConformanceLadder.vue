<script setup lang="ts">
export interface LadderRung {
  id: '1' | '2a' | '2b' | '3'
  title: string
  eta: string
  blurb: string
  file: string
  done?: boolean
}

// v4 Narrative Workflow macro: the rung number sits INLINE in the heading
// (no eyebrow row) — one column per rung. Content = the validated prototype.
const props = withDefaults(defineProps<{ rungs?: LadderRung[] }>(), {
  rungs: () => [
    {
      id: '1',
      title: 'AI Manifest',
      eta: '~15 minutes',
      done: true,
      blurb: 'Identity, publisher, freshness, policy. One HTTP call answers: “What is this site?”',
      file: '/.well-known/index-ai.json',
    },
    {
      id: '2a',
      title: 'Agent Index',
      eta: '~1–2 hours, static site',
      blurb:
        'A flat list of content nodes — each with a clean-text endpoint and an exact measured size. An agent can navigate directly, no scraping.',
      file: '/agent-index.json',
    },
    {
      id: '2b',
      title: 'Agent Graph',
      eta: '+2–4 hours',
      blurb:
        'Typed relationships between nodes forming a navigable graph. From “hotels” to “hotels-casablanca” to “hotels-casablanca-luxury” — without parsing HTML.',
      file: '/agent-index.json + relations',
    },
    {
      id: '3',
      title: 'Query Interface',
      eta: 'MCP',
      blurb: 'A typed API over the Agent View. The agent sends a query with filters and receives exactly the data requested — minimum possible tokens.',
      file: 'MCP server',
    },
  ],
})
</script>

<template>
  <div class="ladder">
    <div v-for="rung in props.rungs" :key="rung.id" class="ladder-rung" :class="{ done: rung.done }">
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
  letter-spacing: -0.015em;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}
.ladder-num {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-right: 0.75rem;
  font-variant-numeric: tabular-nums;
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
  margin-left: 0.5rem;
  font-weight: 500;
}
.ladder-blurb {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
  margin: 0.5rem 0 0;
  max-width: 60ch;
}
.ladder-file {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  margin-top: 0.75rem;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  max-width: 100%;
  overflow-wrap: break-word;
}
</style>
