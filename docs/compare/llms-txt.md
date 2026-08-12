---
layout: page
---

<script setup>
import CompareScaffold from '../.vitepress/theme/components/CompareScaffold.vue'
import ComparisonTable from '../.vitepress/theme/components/ComparisonTable.vue'
import CoexistMap from '../.vitepress/theme/components/CoexistMap.vue'
</script>

<CompareScaffold>

## The comparison

<ComparisonTable />

::: tip The one-line difference
**llms.txt tells an agent what links exist; index-ai tells an agent what content exists, how big it is, how it is structured, and how to query it — measured and verifiable.**
:::

## Do they coexist?

**Yes — index-ai is additive.** Implementing index-ai MUST NOT require changes to your existing `robots.txt`, `sitemap.xml`, or `llms.txt`. You can run all of them at once; they solve different problems:

<CoexistMap />

::: warning Not a replacement, not a fork
index-ai is a distinct, deliberate convention — not an llms.txt variant. It even offers an optional bridge: an llms.txt file may point to the index-ai manifest. The normative statement lives in [§16 Compatibility of the specification](/spec/SPEC-v1.0-rc1#_16-compatibility).
:::

## Demonstration

<div class="demo-vid">
  <div class="demo-vid-frame" role="img" aria-label="Demonstration video placeholder">
    <span class="demo-vid-play" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
    </span>
  </div>
  <p class="demo-vid-note">Demonstration video placeholder — the Agent View in action.</p>
  <p class="demo-vid-cta"><a class="link-cta" href="/quickstart">Retry it yourself now <span class="arr" aria-hidden="true">→</span></a></p>
</div>

</CompareScaffold>
