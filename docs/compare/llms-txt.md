---
layout: page
---

<script setup>
import CompareScaffold from '../.vitepress/theme/components/CompareScaffold.vue'
import ComparisonTable from '../.vitepress/theme/components/ComparisonTable.vue'
import CoexistMap from '../.vitepress/theme/components/CoexistMap.vue'
import DemoVideo from '../.vitepress/theme/components/DemoVideo.vue'
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
index-ai is a distinct, deliberate convention — not an llms.txt variant. It even offers an optional bridge: an llms.txt file may point to the index-ai manifest. The normative statement lives in [§16 Compatibility of the specification](/spec/SPEC-v1.0-rc2#_16-compatibility).
:::

## Demonstration

<DemoVideo />

<p class="demo-vid-note">The AI-readiness walkthrough — the Agent View in action.</p>
<p class="demo-vid-cta"><a class="link-cta" href="../quickstart">Retry it yourself now <span class="arr" aria-hidden="true">→</span></a></p>

</CompareScaffold>
