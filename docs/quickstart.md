---
layout: page
---

<script setup>
import ValidatorBlock from './.vitepress/theme/components/ValidatorBlock.vue'
</script>

# Implement index-ai on your site

A complete, copy-pasteable walkthrough covering **Level 2a** conformance — ending with a validator verdict.
Levels 2b and 3 are explained in the [specification](/spec/), but the walkthrough stops at what the validator can check today.

## Step 1 — Add the AI Manifest

Create `/.well-known/index-ai.json` at your site root with your identity, publisher, and freshness.
Copy this minimal example and adapt it:

```json
{
  "spec_version": "1.0",
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

## Step 2 — Expose clean content endpoints

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

## Step 3 — Build the Agent Index

Create `/agent-index.json` declaring your nodes, their `llm_url`, and their **measured** `content_chars` —
the NFC code point count of the content at that endpoint, not a guess:

```json
{
  "generated": "2025-05-28T10:00:00Z",
  "spec_version": "1.0",
  "total_nodes": 3,
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

## Step 4 — Run the validator

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
