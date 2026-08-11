---
layout: page
---

<script setup>
import ComparisonTable from '../.vitepress/theme/components/ComparisonTable.vue'
</script>

# index-ai vs llms.txt

Different problems, different tools — and they coexist. Here is exactly what index-ai does that `llms.txt` does not, so you can decide with specifics rather than vibes.

## The comparison

<ComparisonTable />

::: tip The one-line difference
**llms.txt tells an agent what links exist; index-ai tells an agent what content exists, how big it is, how it is structured, and how to query it — measured and verifiable.**
:::

## Do they coexist?

**Yes — index-ai is additive.** Implementing index-ai MUST NOT require changes to your existing `robots.txt`, `sitemap.xml`, or `llms.txt`. You can run all of them at once; they solve different problems:

- **robots.txt** says what agents *cannot* access.
- **sitemap.xml** lists URLs.
- **llms.txt** gives human-readable context.
- **index-ai** gives structured, measured, queryable content.

::: warning Not a replacement, not a fork
index-ai is a distinct, deliberate convention — not an llms.txt variant. It even offers an optional bridge: an llms.txt file may point to the index-ai manifest. The normative statement lives in [§16 Compatibility of the specification](/spec/SPEC-v1.0-rc1#_16-compatibility).
:::
