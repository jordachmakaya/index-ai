---
layout: page
---

# index-ai vs llms.txt

Different problems, different tools — and they coexist. Here is exactly what index-ai does that `llms.txt` does not, so you can decide with specifics rather than vibes.

## The comparison

| | **index-ai** | **llms.txt** |
|---|---|---|
| **What it is** | **A structured, verifiable standard** — machine-readable JSON schema, validated by a reference validator | **A human-readable text file** — Markdown text with links, suggested by a blog post |
| **Format** | **Valid JSON** — `/.well-known/index-ai.json` + `/agent-index.json`, both schema-validated | **Plain text / Markdown** — `/llms.txt`, no schema, no validation, no structure contract |
| **Verification** | **Measured and checked** — `content_chars` is an exact NFC code point count verified against the served content; conformance is graded by a validator | **Declared, never verified** — nothing in the file is checked against the actual site content |
| **Budget signal** | **Known before fetch** — every node declares its exact content size; the agent budgets tokens before fetching | **Unknown until fetched** — an agent must fetch each linked page to learn its size |
| **Structure** | **Nodes + optional graph** — typed relationships (2b) let agents traverse without parsing HTML | **Flat list of links** — sections and links, no data model, no relationships |
| **Query interface** | **Level 3 (MCP)** — an optional typed API over the Agent View | **None** — a text file, no query interface exists or could |
| **Policy** | **Machine-readable** — `policy.usage_preferences` declares search/summarization/citation preferences | **Absent** — no machine-readable usage or citation policy |

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
