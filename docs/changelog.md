---
layout: page
---

<script setup>
import ChangelogScaffold from './.vitepress/theme/components/ChangelogScaffold.vue'
import MaturityGrid from './.vitepress/theme/components/MaturityGrid.vue'
import VersionEntry from './.vitepress/theme/components/VersionEntry.vue'
</script>

<ChangelogScaffold>

## Maturity

<MaturityGrid />

<VersionEntry
  version="1.0-rc1"
  title="Request for Comments"
  status="RC"
  tone="accent"
  :meta="{ pre: 'Published at launch; the exact public date is set in the ', href: '/spec/SPEC-v1.0-rc1', link: 'SPEC frontmatter', post: ' (§18.1).' }"
  :changes="[
    { tag: 'Added', text: 'published the full specification as a public RFC, versioned in docs/spec/.' },
    { tag: 'Added', text: 'defined the conformance ladder: Level 1 (AI Manifest), 2a (Agent Index), 2b (Agent Graph), 3 (Query Interface).' },
    { tag: 'Added', text: 'introduced the llm_url / content_chars contract — measured NFC code point counts, never declared (§7).' },
    { tag: 'Added', text: 'added the maturity matrix (normative text = RC, schemas = Draft, validator L1/L2a = Tested, L2b = Implemented launch target, L3 = Proposed — §13.5).' },
    { tag: 'Fixed', text: 'removed the separate pages array — all content items are now nodes (breaking change from v0.6).' },
  ]"
/>

<VersionEntry
  version="0.6"
  title="Working draft"
  status="Draft"
  tone="dim"
  :meta="{ pre: 'Design history iteration (see ', href: '/spec/SPEC-v1.0-rc1#_18-2-internal-design-history', link: 'SPEC §18.2', post: ') — not a public release.' }"
  :changes="[
    { tag: 'Added', text: 'first public working draft of the Agent View schema.' },
    { tag: 'Added', text: 'defined the two-phase consumption model (pre-fetch decision + targeted fetch).' },
  ]"
/>

::: tip Version drift?
The specification text you read on [the spec page](/spec/) is the version this site documents. When a new version publishes, this changelog leads — the spec page is updated to match. Published versions are never rewritten.
:::

</ChangelogScaffold>
