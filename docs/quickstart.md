---
layout: page
---

<script setup>
import QuickstartScaffold from './.vitepress/theme/components/QuickstartScaffold.vue'
import ValidatorBlock from './.vitepress/theme/components/ValidatorBlock.vue'
</script>

<QuickstartScaffold>

## Add the AI Manifest {#step-1}

Create `/.well-known/index-ai.json` at your site root with your identity, publisher, and freshness.
Copy this minimal example and adapt it:

```json
{
  "spec_version": "1.0-rc2",
  "identity": {
    "name": "My Technical Blog",
    "description": "Personal blog on distributed systems, Rust, and backend architecture.",
    "domain": "myblog.dev",
    "category": ["blog", "developer-tools", "rust"]
  },
  "publisher": { "role": "blog" },
  "freshness": {
    "content_updated_at": "2025-05-20T00:00:00Z",
    "refresh_frequency": "monthly"
  }
}
```

::: tip Deploying under a sub-path (e.g. GitHub Project Pages)?
A project page under `user.github.io/repo/` cannot serve `/.well-known/index-ai.json` at the origin root — that path belongs to the platform. Use **scoped discovery** (SPEC §5.2) instead: serve the manifest at any public HTTPS URL and advertise it from every page's `<head>` with a `rel="agent-manifest"` link, e.g.:

```html
<link rel="agent-manifest" href="/index-ai/.well-known/index-ai.json" type="application/json">
```

Declare the Agent View relative to the sub-path too: `"access": { "agent_index": "/index-ai/agent-index.json" }`.
:::

## Expose clean content endpoints {#step-2}

For each page you want agents to reach, serve a **clean text version** — no HTML, no navigation.
The convention is a `?format=markdown` query parameter returning `Content-Type: text/markdown`:

```markdown
# /blog/rust-lifetimes?format=markdown
---
title: Understanding Rust Lifetimes
url: /blog/rust-lifetimes
updated: 2025-04-15
---

## Understanding Rust Lifetimes

Explains Rust lifetime annotations from first principles... (8400 chars)
```

## Build the Agent Index {#step-3}

Create `/agent-index.json` declaring your nodes, their `llm_url`, and their **measured** `content_chars` —
the NFC code point count of the content at that endpoint, not a guess:

```json
{
  "generated": "2025-05-28T10:00:00Z",
  "spec_version": "1.0-rc2",
  "total_nodes": 1,
  "nodes": [
    {
      "id": "article-rust-lifetimes",
      "type": "article",
      "content": {
        "llm_summary": "Explains Rust lifetime annotations from first principles…",
        "llm_url": "/blog/rust-lifetimes?format=markdown",
        "content_chars": 8400,
        "content_chars_mode": "exact"
      }
    }
  ]
}
```

## Run the validator {#step-4}

Deploy, then validate your implementation with the reference validator. The validator is **never embedded
in this site** — `npx` runs in your terminal against your deployed URL:

<ValidatorBlock />

::: tip Partial conformance is valid to ship
Passing Level 1 but not Level 2 is not failure — you ship Level 1, and the validator reports exactly
which level you reached.
:::

::: warning Already running llms.txt or robots.txt?
index-ai coexists with both — it is additive, never a replacement. See [the comparison](/compare/llms-txt).
:::

</QuickstartScaffold>
