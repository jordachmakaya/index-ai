# index-ai — An Open Specification Proposal for Agent-Readable Web Content

**Version:** 1.0-rc1  
**Status:** REQUEST FOR COMMENTS  
**Published:** 2026-08-12  
**Comment period ends:** 2026-08-26  
**Specification text:** CC-BY-4.0 · **Code and examples:** MIT  
**Repository:** https://github.com/jordachmakaya/index-ai  
**Issue tracker:** https://github.com/jordachmakaya/index-ai/issues  
**Reference implementation:** `@hardmachinelabs/index-ai-validator` (maintained by Hard Machine Labs)

> **Status.** This document is a public proposal under review. Normative text,
> JSON Schemas, validator behavior, and examples MAY change before a stable 1.0
> release. `STABLE` will be declared only after the criteria in §17.3 are met
> with public, verifiable evidence. Efficiency, retrieval, and citation gains
> stated anywhere in this document are **illustrative** until the public
> benchmark (§13.4) is completed.

---

## Abstract

`index-ai` is an open specification proposal that lets websites expose a **verifiable, agent-readable representation** of their content — structured metadata, clean content endpoints, and measured token cost. It defines what an agent can reliably **access, extract, and budget once it reaches the site**. It does not, and cannot, guarantee that any given agent or search engine will discover, index, or cite the site; those outcomes depend on third-party systems and are treated here as benefits to be measured, never as promises.

It introduces the concept of an **Agent View**: a parallel, structured representation of a website's content, designed exclusively for machine consumption. Just as React's Virtual DOM gave developers a lightweight mirror of the HTML tree optimized for diffing, the Agent View gives LLM agents a lightweight mirror of the web optimized for querying.

The standard is organized in three progressive levels:

| Level | File | Purpose |
|-------|------|---------|
| **1 — AI Manifest** | `/.well-known/index-ai.json` | Identity, publisher, freshness, policy |
| **2a — Agent Index** | `/agent-index.json` | Flat list of content nodes, clean text endpoints, measured size |
| **2b — Agent Graph** | `/agent-index.json` + relations | Navigable graph with typed relationships between nodes |
| **3 — Query Interface** | MCP server | Typed API over the Agent View |

Level 2a and 2b share the same file. 2b extends 2a with optional relation fields.

---

## Table of Contents

1. [The Problem This Solves](#1-the-problem-this-solves)
2. [The Agent View Concept](#2-the-ai-agent-index-concept)
3. [Terminology](#3-terminology)
4. [Design Goals](#4-design-goals)
5. [Discovery](#5-discovery)
6. [Level 1 — AI Manifest](#6-level-1--ai-manifest)
7. [Level 2 — Agent View](#7-level-2--ai-agent-index)
8. [Level 3 — Query Interface](#8-level-3--query-interface)
9. [Token Economics](#9-token-economics)
10. [Policy & Usage Preferences](#10-policy--usage-preferences)
11. [Publisher Roles](#11-publisher-roles)
12. [Freshness & Versioning](#12-freshness--versioning)
13. [Conformance](#13-conformance)
14. [Security Considerations](#14-security-considerations)
15. [Privacy Considerations](#15-privacy-considerations)
16. [Compatibility](#16-compatibility)
17. [Governance](#17-governance)
18. [Changelog](#18-changelog)

---

## 1. The Problem This Solves

### 1.1 A brief history of LLM reliability

**2022–2023 — The hallucination problem**

The first wave of public LLM deployment exposed a fundamental limitation: models invented facts. They generated confident, fluent answers with no grounding in reality. The term *hallucination* entered the mainstream.

The industry response was twofold. First, **Retrieval-Augmented Generation (RAG)**: ground the model's answers in retrieved documents before generating. RAG worked — but it was expensive to set up, required custom pipelines per domain, and remained inaccessible to most publishers. Second, **web search integration**: give the model live access to the web.

Both responses shared the same core insight: *a model that can verify against a source hallucinates less*. The problem shifted from "how do we make models less wrong?" to "how do we give models access to the right sources, efficiently?"

**2023–2024 — The web search era and its new problem**

LLMs gained web search. Hallucination dropped dramatically. But a new bottleneck emerged: **token cost**.

When an agent searches the web, it fetches pages. Pages are built for humans. A typical modern web page contains a mix of structural markup, styling, scripts, navigation chrome, and actual content. The informational content often represents a minority of the total character count.

An agent that fetches a page to answer a query pays the full token cost of the entire page — including every character of markup that carries no information for the agent. LLM providers responded by optimizing system prompts, building context compression tools, and developing smarter chunking strategies. These are workarounds. They treat the symptom — too many tokens consumed — not the cause: **websites are built for human eyes, not machine minds**.

**2025 — The structural solution**

The web has not changed. Pages are still built for visual rendering. LLMs navigate this infrastructure every day, paying token costs on markup that was never meant for them.

`index-ai` proposes a structural answer: **let websites expose a parallel layer of themselves, built exclusively for agents**. Not a simplified version of the page. A different representation entirely — structured, semantic, token-efficient by design.

### 1.2 Why existing standards are insufficient

`robots.txt` tells crawlers what they cannot access. It says nothing about what they will find.

`sitemap.xml` lists URLs. It gives no information about content, structure, or freshness.

`llms.txt` provides human-readable context. It is a text file, not a queryable structure.

None of these standards address the agent's core need: **access to structured information without the cost of parsing a human-facing interface**.

### 1.3 The core insight

Two groups of consumers visit the same website with fundamentally different needs:

```
Human visitor
├── Needs: visual hierarchy, images, interaction, aesthetics
├── Interface: HTML + CSS + JavaScript
└── Cost model: bandwidth (cheap)

LLM agent
├── Needs: structured facts, relationships, freshness signals
├── Interface: (nothing optimized exists today)
└── Cost model: tokens (expensive)
```

The web has spent 30 years optimizing the human interface. It has built nothing for the agent interface.

`index-ai` builds that interface.

---

## 2. The Agent View Concept

### 2.1 The Virtual DOM analogy

In 2013, React introduced the Virtual DOM. The insight was simple: the browser's DOM is expensive to manipulate directly. React maintains a lightweight in-memory mirror of the DOM, and reconciles changes against it before touching the real tree. The result: better performance, because operations happen on the right representation for the task.

`index-ai` Level 2 applies the same principle to websites:

```
                    ┌─────────────────────────────┐
                    │         Website              │
                    │                              │
 HTML/CSS/JS ───────┤── Human Interface            │
                    │   (visual, interactive)      │
                    │                              │
 Agent View ────────┤── Agent Interface            │
                    │   (structured, queryable)    │
                    │                              │
                    └─────────────────────────────┘
```

The content is the same. The representation is different. Each consumer gets the interface built for them.

> **Clarification:** The Agent View is public, publisher-declared, and publisher-controlled. It is not hidden, inferred, or generated by third parties. It is an explicit, opt-in representation of the site's content.

### 2.2 What the Agent View is

The Agent View (`/agent-index.json`) is a structured representation of the site's information as nodes, stripped of all markup.

**Minimum (Level 2a — Agent Index):**

```
Node = a unit of information
├── id            unique identifier
├── type          what kind of information
├── label         human-readable name
├── content
│   ├── llm_summary   pre-fetch signal (what the node contains)
│   ├── llm_url       clean text endpoint
│   └── content_chars exact character count of content at llm_url
└── meta          freshness, count, language
```

**Extended (Level 2b — Agent Graph):**

Everything in 2a, plus:

```
├── relations
│   ├── parent    id of parent node
│   ├── children  ids of child nodes
│   └── related   ids of semantically related nodes
```

Relations MUST form a directed acyclic graph (DAG) for `parent`/`children` links. Cycles in the parent/child hierarchy are a schema violation. The `related` field MAY reference any node without acyclicity constraint.

### 2.3 The two-phase decision model

The Agent View enables a two-phase consumption model that eliminates speculative token spend:

**Phase 1 — Pre-fetch decision (near-zero cost)**

The agent reads `llm_summary` (50–300 words per node) from the Agent View. This is enough to decide: *is this node relevant to my query?* If no — skip entirely, zero additional tokens spent. If yes — proceed to Phase 2.

**Phase 2 — Targeted fetch (known, bounded cost)**

The agent fetches only the relevant node(s) via `llm_url`. The content arrives as clean text. `content_chars` was computed against this exact endpoint at generation time. The token budget is known before the fetch.

```
Standard path:
  Phase 1: read llm_summary  → ~200 chars → decide relevance
  Phase 2: fetch llm_url     → content_chars (declared, exact)

Without standard:
  No Phase 1
  Phase 2: fetch HTML page   → unknown chars → parse → extract useful content
           (pays full page cost including markup)
```

The illustrative efficiency gain depends on the signal-to-markup ratio of the site. For a page where useful content represents 20–30% of total HTML size, the reduction in token consumption may be significant, but the actual gain must be measured through the public benchmark described in §13.4.

---

## 3. Terminology

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

| Term | Definition |
|------|-----------|
| **Agent** | Any LLM-based system that makes autonomous HTTP requests to retrieve and use web content |
| **Agent View** | The parallel, agent-optimized representation of a website's content, exposed via `/agent-index.json` |
| **Agent Index (Level 2a)** | An Agent View containing nodes without relation fields |
| **Agent Graph (Level 2b)** | An Agent View containing nodes with relation fields forming a DAG |
| **Manifest** | The `index-ai.json` file described in Level 1 |
| **Node** | A unit of information in the Agent View |
| **`content_chars`** | The Unicode NFC code point count of clean content served by `llm_url`, measured at Agent View generation time. Its interpretation depends on `content_chars_mode`. |
| **`content_chars_mode`** | Declares how `content_chars` was computed: `"exact"` for static content, `"max"` for continuously updated content (upper bound) |
| **Clean content** | Text content stripped of HTML, CSS, JavaScript, navigation, and non-informational markup |
| **`llm_url`** | A URL that serves clean content for a given node. MUST return `Content-Type: text/markdown` or `text/plain`. |
| **Role declaration** | A self-asserted claim about publisher type — not a verified trust signal |
| **Conformance level** | The highest level (1, 2a, 2b, or 3) for which a site satisfies all requirements |

---

## 4. Design Goals

### 4.1 Token-efficient by design

The standard's primary optimization target is token cost. Every design decision SHOULD reduce the number of tokens an agent consumes to retrieve accurate, useful information. This is the economic foundation of the standard.

### 4.2 Progressive adoption

Four independent conformance tiers. Level 1 is designed to provide explicit, machine-readable identity, publisher, freshness, and policy signals. The current implementation target is under 15 minutes for Level 1 and under 2 hours for Level 2a. These targets require public validation.

### 4.3 Measured, not estimated

Metrics exposed by the standard MUST be computed from actual content, not declared manually. `content_chars` is a measurement — the Unicode NFC code point count of the content served by `llm_url` at the time of Agent View generation. The SDK is the recommended mechanism for verifying this at generation time. Manual implementations MUST compute `content_chars` by fetching `llm_url` and counting NFC code points.

### 4.4 Two representations, one source of truth

The site's content exists once. The Agent View is a representation of that content, not a copy. The SDK generates the Agent View from the site's content. Freshness metadata ensures agents know when to re-fetch.

### 4.5 Human and machine readable

All standard-defined metadata files (`index-ai.json`, `agent-index.json`) MUST be valid JSON. No binary formats. No proprietary schemas. Clean content endpoints (`llm_url`) MAY return Markdown or plain text.

### 4.6 Agent-agnostic

The standard MUST function without dependency on any specific LLM provider. The Agent View is plain JSON over HTTP. Any agent that can make HTTP requests can consume it.

> **Note on MCP:** Level 3 uses the Model Context Protocol, currently stewarded by Anthropic but designed as an open standard. Should an equivalent protocol emerge with broader adoption, a future RFC will define an alternative Level 3 transport.

### 4.7 Backward compatible

Implementing `index-ai` MUST NOT require changes to existing `robots.txt`, `sitemap.xml`, `llms.txt`, or any SEO configuration. It is additive.

### 4.8 Non-goals

This standard does **not**:

- Replace `robots.txt`, `sitemap.xml`, or `llms.txt`
- Guarantee that any specific agent will read or respect the manifest
- Create legally enforceable permissions
- Provide cryptographic verification of publisher identity (see RFC-004)
- Prevent agents from scraping sites that do not implement the standard
- Eliminate token cost entirely — it reduces unnecessary token spend

---

## 5. Discovery

### 5.1 The bootstrap problem

An agent reads `index-ai.json` only if it knows to look for it. This section defines how agents discover the standard, and how sites advertise compliance.

### 5.2 Canonical location

The manifest MUST be served at:

```
https://example.com/.well-known/index-ai.json
```

Following [RFC 8615](https://datatracker.ietf.org/doc/html/rfc8615).

A fallback alias at `/index-ai.json` SHOULD be supported.

### 5.3 Discovery mechanisms

In recommended priority order:

#### HTML `<link>` tag (RECOMMENDED)

```html
<link rel="agent-manifest" href="/.well-known/index-ai.json" type="application/json">
```

Add to every page's `<head>`. An agent reading HTML SHOULD detect this tag and switch to the structured interface.

#### HTTP `Link` header (RECOMMENDED)

```
Link: </.well-known/index-ai.json>; rel="agent-manifest"
```

For agents that do not parse HTML. SHOULD be present on all responses. This is the only mechanism that works for all agent types including headless, non-HTML agents.

#### `robots.txt` directive (RECOMMENDED)

```
Agent-Manifest: /.well-known/index-ai.json
```

Leverages existing crawler infrastructure.

#### `llms.txt` bridge (OPTIONAL)

```markdown
## Resources
- Agent-Manifest: https://example.com/.well-known/index-ai.json
```

#### DNS TXT record (OPTIONAL)

```
_agent-manifest.example.com. IN TXT "v=1; path=/.well-known/index-ai.json"
```

### 5.4 Agent behavior on HTTP errors

| Status | Behavior |
|--------|---------|
| `200 OK` | Parse and use |
| `301/302` | Follow redirect once |
| `404 Not Found` | Try `/index-ai.json` fallback once. If also 404, site does not implement standard. |
| `429 Too Many Requests` | Back off per `Retry-After`. Minimum 1 hour. |
| `5xx` | Do not retry within 24 hours |

### 5.5 Agent validation behavior

| Condition | Behavior |
|-----------|---------|
| Invalid JSON | Ignore manifest. Fall back to normal retrieval. |
| Schema validation failure | Use only recognized valid fields. Mark as non-conformant. |
| `identity.domain` mismatch with serving host | Treat as suspicious. Do not elevate trust signal. |
| `freshness.valid_until` expired | Re-fetch. If still expired, down-rank freshness signal. |
| File exceeds 50 KB | Reject manifest. |
| `robots.txt` returns 404 | Treat as no crawler restrictions, consistent with standard crawler behavior. Proceed with manifest access. |
| `robots.txt` disallows path | Respect `robots.txt`. It takes precedence over manifest permissions. |

---

## 6. Level 1 — AI Manifest

### 6.1 Purpose

The AI Manifest answers: **"What is this site?"**

One HTTP call. The agent learns the site's identity, what it covers, who is responsible for it, how fresh its content is, what agents are permitted to do, and where to find the Agent View and query interface.

### 6.2 HTTP requirements

| Requirement | Value |
|-------------|-------|
| Canonical path | `/.well-known/index-ai.json` |
| Fallback path | `/index-ai.json` |
| HTTP method | `GET` |
| Response status | `200 OK` |
| Content-Type | `application/json` |
| Encoding | UTF-8 |
| Recommended max size | 10 KB |
| Hard max size | 50 KB |
| CORS | `Access-Control-Allow-Origin: *` RECOMMENDED |
| Cache-Control | `max-age` SHOULD NOT exceed 3600 |

### 6.3 Full schema

```json
{
  "$schema": "https://raw.githubusercontent.com/index-ai/standard/main/schema/v1/index-ai.schema.json",
  "spec_version": "1.0",
  "manifest_version": 1,

  "identity": {
    "name": "Atlas Hotels",
    "description": "Real-time hotel booking covering 12 cities in Morocco. 247 hotels. Prices in MAD.",
    "domain": "atlashotels.ma",
    "category": ["hotels", "booking", "travel"],
    "language": ["fr", "ar", "en"],
    "geo": {
      "country": "MA",
      "regions": ["Casablanca", "Marrakech", "Rabat", "Agadir"]
    }
  },

  "publisher": {
    "name": "Atlas Hotels SAS",
    "role": "official-platform",
    "contact": "ai@atlashotels.ma",
    "verification_hint": "dns-txt"
  },

  "freshness": {
    "content_updated_at": "2025-05-28T14:30:00Z",
    "manifest_generated_at": "2025-05-28T14:31:00Z",
    "refresh_frequency": "continuous",
    "valid_until": "2025-12-31T23:59:59Z",
    "cache_max_age_seconds": 300
  },

  "policy": {
    "usage_preferences": {
      "search": true,
      "summarization": true,
      "citation": true,
      "agent_navigation": true,
      "training": false,
      "commercial_reuse": "requires_permission"
    },
    "citation": {
      "required": true,
      "preferred_format": "Atlas Hotels — {title} — {url} — prices in MAD"
    },
    "rate_limits": {
      "requests_per_minute": 60,
      "crawl_delay_seconds": 1
    }
  },

  "entrypoints": [
    {
      "topic": "search",
      "description": "Search available hotels by city, dates, budget, and star rating",
      "url": "/search",
      "params": ["location", "checkin", "checkout", "budget_max", "stars_min", "guests"]
    }
  ],

  "access": {
    "agent_index": "/agent-index.json",
    "llms_txt": "/llms.txt",
    "mcp_server": "https://atlashotels.ma/mcp",
    "mcp_auth": "none",
    "mcp_tools": ["search_hotels", "get_hotel", "check_availability", "list_cities"]
  },

  "llm_instructions": "Prices in MAD. Availability real-time. Always include booking URL. Mention cancellation policy when available."
}
```

### 6.4 Field rules

#### `spec_version`
MUST be present. String. Identifies the version of this standard the manifest targets (e.g. `"1.0"`). Allows agents and validators to apply the correct parsing rules.

#### `manifest_version`
OPTIONAL. Integer. Incrementing counter. Bump when manifest content changes. Allows agents to detect stale cached versions without re-fetching.

#### `identity.description`
MUST be factual. MUST be written for an LLM consumer, not for marketing. MUST NOT contain promotional superlatives.

✅ `"Real-time hotel booking covering 12 cities in Morocco. Prices in MAD."`  
❌ `"Morocco's premier hotel experience — book your dream stay today!"`

#### `identity.category`
MUST use lowercase slug format (`[a-z0-9-]+`). See §11.3 for recommended taxonomy.

#### `publisher.role`
A **self-asserted role declaration**. Not a verified trust claim. Any site can declare any role. Agents SHOULD use it as a weak prior signal. See §11 for taxonomy.

#### `freshness.content_updated_at`
MUST reflect the date of the most recently updated **content** on the site. MUST NOT reflect the manifest generation date, server restart time, or deployment date. This is the field agents use to weight time-sensitive queries.

#### `freshness.manifest_generated_at`
SHOULD be present. Allows agents to distinguish between "the manifest file is old" and "the content is old".

#### `access.agent_index`
URL of the Agent View file. REQUIRED for Level 2 conformance. Default path: `/agent-index.json`.

#### `policy`
Expresses machine-readable usage preferences. Not a legal contract. See §10.

#### `rate_limits`
Advisory declarations only. Not enforced by this standard. Sites MUST enforce limits independently at the infrastructure level.

#### `llm_instructions`
Free-text guidance. MUST NOT exceed 500 characters. Written for the agent. Factual and operational.

### 6.5 Minimal valid Level 1 example

```json
{
  "$schema": "https://raw.githubusercontent.com/index-ai/standard/main/schema/v1/index-ai.schema.json",
  "spec_version": "1.0",
  "identity": {
    "name": "My Technical Blog",
    "description": "Personal blog on distributed systems, Rust, and backend architecture. Monthly articles.",
    "domain": "myblog.dev",
    "category": ["blog", "developer-tools", "rust"]
  },
  "publisher": {
    "role": "blog"
  },
  "freshness": {
    "content_updated_at": "2025-05-20T00:00:00Z",
    "refresh_frequency": "monthly"
  },
  "entrypoints": [
    {
      "topic": "articles",
      "description": "All published articles on systems programming and backend development",
      "url": "/"
    }
  ]
}
```

---

## 7. Level 2 — Agent View

### 7.1 The concept

A website exists in two representations:

**The human interface** — HTML, CSS, JavaScript. Visual. Interactive. Designed for human attention and engagement.

**The Agent View** — A parallel representation of the same content. No HTML. No CSS. No navigation chrome. No cookie banners. Just the information, organized as a collection of nodes. This is what agents should have been able to query from the beginning.

```
Website content (single source of truth)
        │
        ├──► HTML/CSS/JS render   ──► Human sees a beautiful page
        │
        └──► Agent View     ──► Agent queries structured data
             /agent-index.json           No HTML parsed, no markup tokens burned
```

### 7.2 Two conformance tiers

Level 2 is split into two tiers with different implementation effort:

**Level 2a — Agent Index**

A flat collection of nodes. No relation fields required. Each node declares its content endpoint and exact clean-content size. An agent can navigate directly to any node without scraping.

Implementation time: ~1–2 hours for a static site, ~4–8 hours for a dynamic site.

**Level 2b — Agent Graph**

Everything in 2a, plus typed relationships between nodes forming a navigable DAG. An agent can traverse the graph — from "hotels" to "hotels-casablanca" to "hotels-casablanca-luxury" — without parsing HTML anchor tags.

Implementation time: additional 2–4 hours above 2a.

Both tiers share the same `/agent-index.json` file. 2b adds optional `relations` fields to each node.

### 7.3 Location and HTTP requirements

MUST be served at the URL declared in `access.agent_index` in the Level 1 manifest.

Default path: `/agent-index.json`

> **Important:** Agents MUST NOT assume `/agent-index.json` exists unless the URL is explicitly declared in `access.agent_index`. The manifest is the single source of truth for the Agent View location. No well-known path polling for the Agent View is defined.

Same HTTP requirements as Level 1: `application/json`, UTF-8, CORS `*`.

Recommended max size: 100 KB. Sites with more content SHOULD expose queryable endpoints (see §7.9).

### 7.4 Full schema

The following example shows a Level 2b Agent View. A minimal Level 2a example follows in §7.4.1.

```json
{
  "$schema": "https://raw.githubusercontent.com/index-ai/standard/main/schema/v1/agent-index.schema.json",
  "generated": "2025-05-28T14:30:00Z",
  "spec_version": "1.0",
  "total_nodes": 4,

  "nodes": [ ... ]
}
```

**Top-level fields:**

| Field | Requirement | Description |
|-------|------------|-------------|
| `$schema` | OPTIONAL | JSON Schema reference URL |
| `generated` | REQUIRED | ISO 8601 datetime of Agent View generation |
| `spec_version` | REQUIRED | index-ai spec version this Agent View targets |
| `total_nodes` | RECOMMENDED | Total node count across all pages (including paginated) |
| `nodes` | REQUIRED | Array of content nodes. All content items go here — pages, articles, collections, etc. |

> **Breaking change from v0.6:** The separate `pages` array is removed. All content items are `nodes`. Use `"type": "page"` to distinguish single informational pages from collections. This eliminates structural redundancy and simplifies schema validation.

**Node content fields:**

| Field | Requirement | Description |
|-------|------------|-------------|
| `llm_url` | RECOMMENDED | Clean text endpoint |
| `content_chars` | OPTIONAL | NFC code point count at `llm_url` |
| `content_chars_mode` | **MUST if `content_chars` present** | `"exact"` or `"max"` — see §7.6 |
| `content_sha256` | OPTIONAL | Lowercase hex SHA-256 of the NFC-normalized content served at `llm_url`. Makes `content_chars` verifiable and drift-proof. Valid only with `content_chars_mode: "exact"` (see §7.6). |
| `content_version` | OPTIONAL | Opaque content-version label (e.g. `git:abc123`). Informational; no cryptographic meaning. |
| `content_chars_measurement` | OPTIONAL, RECOMMENDED for `"max"` | Measurement window metadata |
| `summary_method` | RECOMMENDED | `"truncate"` \| `"llm"` \| `"manual"` |
| `language` | OPTIONAL | ISO 639-1 code |

**`content_chars_measurement` block** (OPTIONAL, RECOMMENDED when `content_chars_mode: "max"`):

```json
"content_chars_measurement": {
  "window_seconds": 3600,
  "measured_at": "2025-05-28T14:30:00Z"
}
```

This tells agents how the `"max"` value was computed: over what time window, and when. `window_seconds` is the observation period over which the maximum was measured. `measured_at` is the end of that observation window.

Without this block, agents SHOULD assume the maximum was observed over the Agent View's generation window (the period between the previous `generated` timestamp and the current one).

For the **first generation** of an Agent View (no prior `generated` timestamp exists), `window_seconds` refers to the measurement period before initial Agent View creation. If absent on first generation, agents SHOULD treat `content_chars` as an approximation with unknown confidence.

```json
{
  "$schema": "https://raw.githubusercontent.com/index-ai/standard/main/schema/v1/agent-index.schema.json",
  "generated": "2025-05-28T14:30:00Z",
  "spec_version": "1.0",
  "total_nodes": 4,

  "nodes": [
    {
      "id": "hotels-casablanca",
      "type": "collection",
      "label": "Hotels in Casablanca",
      "description": "All hotels available in the Greater Casablanca region",

      "content": {
        "llm_summary": "84 hotels in Casablanca covering all categories and budgets. Price range: 250–4500 MAD/night. All listings include GPS coordinates, real-time availability, amenities, and direct booking links. Top districts: Maarif, Anfa, CIL, Ain Diab, Centre-ville.",
        "llm_url": "/hotels/casablanca?format=markdown",
        "content_chars": 18400,
        "content_chars_mode": "max",
        "content_chars_measurement": {
          "window_seconds": 3600,
          "measured_at": "2025-05-28T14:30:00Z"
        },
        "summary_method": "llm",
        "language": "fr"
      },

      "meta": {
        "updated": "2025-05-28",
        "count": 84,
        "refresh_frequency": "continuous"
      },

      "relations": {
        "parent": null,
        "children": [
          "hotels-casablanca-luxury",
          "hotels-casablanca-midrange",
          "hotels-casablanca-budget"
        ],
        "related": ["transport-casablanca", "restaurants-casablanca"]
      }
    },
    {
      "id": "hotels-casablanca-luxury",
      "type": "collection",
      "label": "5-star hotels in Casablanca",
      "description": "Luxury hotels in Casablanca with premium amenities",

      "content": {
        "llm_summary": "12 five-star hotels in Casablanca. Average price: 3200 MAD/night. Key properties include Four Seasons, Hyatt Regency, Sofitel. All include spa, pool, and concierge service.",
        "llm_url": "/hotels/casablanca?stars=5&format=markdown",
        "content_chars": 4800,
        "content_chars_mode": "max",
        "content_chars_measurement": {
          "window_seconds": 3600,
          "measured_at": "2025-05-28T14:30:00Z"
        },
        "summary_method": "truncate",
        "language": "fr"
      },

      "meta": {
        "updated": "2025-05-28",
        "count": 12,
        "refresh_frequency": "continuous"
      },

      "relations": {
        "parent": "hotels-casablanca",
        "children": [],
        "related": ["hotels-marrakech-luxury"]
      }
    },
    {
      "id": "about",
      "type": "page",
      "label": "About Atlas Hotels",
      "description": "Company overview, coverage, booking guarantees",

      "content": {
        "llm_summary": "Atlas Hotels SAS operates a booking platform covering 12 Moroccan cities since 2018. Offers price-match guarantee, free cancellation on most bookings, 24/7 customer support in FR/AR/EN.",
        "llm_url": "/about?format=markdown",
        "content_chars": 2100,
        "content_chars_mode": "exact",
        "summary_method": "truncate"
      },

      "meta": {
        "updated": "2025-01-15",
        "refresh_frequency": "monthly"
      }
    }
  ]
}
```

### 7.4.1 Minimal Level 2a example — technical blog

A minimal Agent Index for a blog with three articles. No relations required.

```json
{
  "$schema": "https://raw.githubusercontent.com/index-ai/standard/main/schema/v1/agent-index.schema.json",
  "generated": "2025-05-28T10:00:00Z",
  "spec_version": "1.0",
  "total_nodes": 3,

  "nodes": [
    {
      "id": "article-rust-lifetimes",
      "type": "article",
      "label": "Understanding Rust Lifetimes",
      "description": "Deep dive into Rust lifetime annotations and borrow checker rules",
      "content": {
        "llm_summary": "Explains Rust lifetime annotations from first principles. Covers 'a syntax, lifetime elision rules, and common patterns. Includes 12 code examples. Assumes familiarity with ownership and borrowing.",
        "llm_url": "/blog/rust-lifetimes?format=markdown",
        "content_chars": 8400,
        "content_chars_mode": "exact",
        "summary_method": "truncate",
        "language": "en"
      },
      "meta": {
        "updated": "2025-04-15",
        "refresh_frequency": "static"
      }
    },
    {
      "id": "article-distributed-consensus",
      "type": "article",
      "label": "Raft Consensus in Practice",
      "description": "Implementation notes on the Raft consensus algorithm",
      "content": {
        "llm_summary": "Practical guide to implementing Raft consensus. Covers leader election, log replication, and cluster membership changes. References the original Raft paper with corrections. Includes a Go implementation sketch.",
        "llm_url": "/blog/raft-consensus?format=markdown",
        "content_chars": 11200,
        "content_chars_mode": "exact",
        "summary_method": "truncate",
        "language": "en"
      },
      "meta": {
        "updated": "2025-03-02",
        "refresh_frequency": "static"
      }
    },
    {
      "id": "article-zero-copy",
      "type": "article",
      "label": "Zero-Copy Networking in Linux",
      "description": "Using sendfile, splice, and io_uring for zero-copy I/O",
      "content": {
        "llm_summary": "Overview of zero-copy networking techniques available in Linux. Compares sendfile(2), splice(2), and io_uring. Includes benchmarks showing 40% throughput improvement on a 10GbE interface under sustained load.",
        "llm_url": "/blog/zero-copy-networking?format=markdown",
        "content_chars": 9600,
        "content_chars_mode": "exact",
        "summary_method": "truncate",
        "language": "en"
      },
      "meta": {
        "updated": "2025-02-18",
        "refresh_frequency": "static"
      }
    }
  ]
}
```

This is a complete, valid Level 2a Agent View. No relations. No graph structure. Implementation time: approximately 30 minutes for a static site generator.

| Type | Description |
|------|-------------|
| `collection` | A group of items (hotel listings, articles, products) |
| `page` | A single informational page |
| `article` | A dated editorial piece |
| `product` | A purchasable or bookable item |
| `category` | A classification node with no content of its own |
| `dataset` | A structured data resource |

Custom types MAY be used with the `x-` prefix (e.g. `x-legal-ruling`).

### 7.6 The `llm_url` and `content_chars` contract

This is the architectural core of Level 2. The two fields form an indivisible contract.

**`llm_url`** — A URL that serves the node's content as clean text. No HTML. No CSS. No navigation. MUST return `Content-Type: text/markdown` or `text/plain`.

**`content_chars`** — The Unicode NFC code point count of the content served by `llm_url`, measured at Agent View generation time. Its exact interpretation depends on `content_chars_mode`.

**`content_chars_mode`** — Declares how to interpret `content_chars`:

| Value | Meaning | When to use |
|-------|---------|-------------|
| `"exact"` | `content_chars` = exact NFC code point count at generation time | Static, daily, weekly, monthly sites |
| `"max"` | `content_chars` = maximum observed size over recent generation window | Sites with `refresh_frequency: continuous` |

`content_chars_mode` MUST be present on every node that declares `content_chars`. Its absence when `content_chars` is present is a schema error.

> **Definition:** "Unicode NFC code point count" means the count of Unicode scalar values after UTF-8 decoding and Unicode Normalization Form C (NFC). This is `len(text)` in Python 3 on a normalized string, NOT byte count, NOT UTF-16 code unit count.

The contract rule:

> If `content_chars_mode` is `"exact"`: `content_chars` MUST equal the NFC code point count of content served by `llm_url` at generation time.
>
> If `content_chars_mode` is `"max"`: `content_chars` MUST be greater than or equal to the NFC code point count of content served by `llm_url` at validation time. Publishers SHOULD keep the declared value close to the observed maximum for the declared measurement window.
>
> `content_chars` MUST NOT be declared if `llm_url` is absent.
>
> If `llm_url` is absent, agents MUST NOT assume any token budget for this node.

**`content_sha256` (OPTIONAL, drift-proof attestation).** When
`content_chars_mode` is `"exact"`, a publisher MAY declare
`content_sha256`: the lowercase hexadecimal SHA-256 of the content served
at `llm_url`, decoded as UTF-8 and normalized to NFC — the *same* normalized
string whose NFC code points `content_chars` counts:
`content_sha256 = hex( sha256( NFC(utf8_decode(body)).encode("utf-8") ) )`.
A validator that supports it MUST re-fetch `llm_url`, recompute the hash, and
compare; a mismatch is a conformance failure (the declared content has
drifted from what is served). `content_sha256` has no meaning with
`content_chars_mode: "max"` and MUST be ignored there. `content_version`
is an opaque label only and is never verified cryptographically.

**The measurement process:**

```
SDK generates Agent View:
  1. Fetch llm_url (e.g. /hotels/casablanca?format=markdown)
  2. Decode response as UTF-8
  3. Normalize to NFC
  4. content_chars = Unicode code point count of normalized text
  5. content_chars_mode = "exact" (static) or "max" (continuous)
  6. Store in Agent View node

Agent consumes Agent View:
  1. Read content_chars = 18,400 and content_chars_mode = "max"
  2. Interpret: up to 18,400 NFC code points of clean content
  3. Estimate token budget: 18,400 / 4 ≈ 4,600 tokens max (English heuristic)
  4. Decide: fits in budget? Yes.
  5. Fetch llm_url → receive content whose NFC code point count ≤ 18,400
```

### 7.7 The clean content endpoint

When an agent fetches `llm_url`, the response MUST contain:

- `Content-Type: text/markdown` or `text/plain`
- The node's informational content as clean text
- No HTML wrapper, no navigation, no footer, no cookie banners, no ads

Agents MUST follow HTTP 301/302 redirects when fetching `llm_url`, limited to a maximum of 3 hops. If the redirect chain exceeds 3 hops or results in an error, the agent SHOULD treat the node as temporarily unavailable and fall back to `llm_summary` only.

RECOMMENDED: a front matter block for structured metadata:

```markdown
---
title: Hotels in Casablanca
url: /hotels/casablanca
updated: 2025-05-28
count: 84
language: fr
---

## Hotels in Casablanca

84 hotels available across all categories...
```

**Convention `?format=markdown`:**

This query parameter SHOULD be used to trigger the clean content response. It is RECOMMENDED, not REQUIRED. Sites MAY use any URL pattern for `llm_url` (e.g. `/api/ai/hotels-casablanca`, `/content/hotels-casa.md`). What matters is that the URL returns clean content and that `content_chars` was measured against that URL.

### 7.8 `llm_summary` rules

The `llm_summary` is the agent's pre-fetch signal. It enables Phase 1 decision-making without consuming the full content.

MUST:
- Be factual and neutral in tone
- Be between 20 and 300 words
- Accurately represent the current content
- Be sufficient for an agent to judge relevance without fetching

MUST NOT:
- Contain promotional or marketing language
- Make claims not verifiable from the content

**`summary_method`** declares how the summary was produced:

| Value | Meaning |
|-------|---------|
| `truncate` | First N words of the clean content, truncated at sentence boundary |
| `llm` | Generated by a language model |
| `manual` | Written by a human |

`summary_method` SHOULD be present. If absent, agents SHOULD treat the summary as unverified.

**Truncate method (default, no LLM cost):**

The SDK generates `llm_summary` by taking the first 300 words of `content_at_llm_url`, truncated at the last sentence boundary before word 300. This is deterministic, reproducible, and requires no LLM call. It is the RECOMMENDED default for static sites and sites with infrequent content updates.

**LLM method:**

Sites MAY generate `llm_summary` using an LLM call for higher quality. When `summary_method: "llm"`, the summary SHOULD be regenerated whenever the content changes significantly.

### 7.9 Static vs dynamic Agent Views

**Static (for `daily`, `weekly`, `monthly`, `static` sites):**

Generated at build time, served as a JSON file. The SDK generates the file during deployment. Simple, fast, no infrastructure overhead.

**Dynamic (for `continuous` sites):**

Generated on request or on a tight schedule, reflecting current state. For dynamic sites, the Agent View SHOULD support query parameters:

```
GET /agent-index.json                        → full Agent View
GET /agent-index.json?node=hotels-casa       → single node by id
GET /agent-index.json?type=collection        → nodes by type
GET /agent-index.json?updated_since=DATE     → recently updated nodes (ISO 8601)
GET /agent-index.json?limit=50&offset=0      → paginated results
```

**Pagination convention (offset-based):**

Query parameters:
- `limit` — integer, MUST be between 1 and 200. Default: 50.
- `offset` — integer ≥ 0. Default: 0.

Paginated response MUST include:

```json
{
  "generated": "2025-05-28T14:30:00Z",
  "total_nodes": 247,
  "returned_nodes": 50,
  "offset": 0,
  "limit": 50,
  "next_offset": 50,
  "nodes": [...]
}
```

`next_offset` MUST be `null` when no further results exist. Cursor-based pagination is deferred to RFC-006 (appropriate for Level 3 MCP tools on large live datasets).

Paginated responses SHOULD NOT exceed 2 MB total. If a request with a given `limit` would produce a response exceeding 2 MB, the server SHOULD reduce the effective limit and set `next_offset` accordingly.

**Note on `continuous` sites and offset pagination:**

Offset-based pagination can produce inconsistencies on rapidly changing datasets (new nodes inserted between page fetches cause items to shift). For sites with `refresh_frequency: continuous` and large, frequently changing node sets, Level 3 MCP (§8) is RECOMMENDED for complex queries. Level 2 dynamic pagination is appropriate for moderately dynamic sites where the Agent View is regenerated on a schedule (every few minutes), not modified record-by-record in real time.

The `generated` field MUST reflect the actual generation time, not a hardcoded build timestamp.

### 7.10 DAG constraint for Agent Graph (Level 2b)

In Level 2b, the `parent`/`children` relation fields MUST form a directed acyclic graph (DAG):

- A node MUST NOT be its own ancestor
- If node A declares B as a child, B MUST declare A as its parent
- The graph MAY have multiple root nodes (nodes with `parent: null`)

The `related` field is not subject to DAG constraints. It MAY reference any node, including ancestors and descendants.

Validators MUST check for cycles in `parent`/`children` links and report them as schema errors.

### 7.11 Agent View generation — SDK approach

Manually maintaining an Agent View leads to stale `content_chars`, outdated summaries, and drift from actual content. The RECOMMENDED approach is SDK-based generation.

**SDK generation pipeline:**

```
For each declared entrypoint or page:
  1. Fetch the llm_url endpoint
  2. Decode UTF-8, normalize NFC
  3. content_chars = Unicode NFC code point count
  4. If summary_method = "truncate":
       llm_summary = first 300 words, truncated at sentence boundary
  5. If summary_method = "llm":
       llm_summary = LLM call on clean content
  6. Build Agent View node with measured metrics

Resolve parent/children relations (if Level 2b)
Validate DAG constraint
Write /agent-index.json
```

The SDK MUST fetch `llm_url` directly — not compute `content_chars` from the raw HTML page. The contract is: `content_chars` = `strlen_nfc(content_at_llm_url)`.

---

## 8. Level 3 — Query Interface

### 8.1 Purpose

Level 3 exposes a typed query interface over the Agent View. Where Level 2 gives agents a structured index to navigate, Level 3 gives them a parameterized API to query.

```
Level 2: "Here is the structure of my content. Navigate it."
Level 3: "Ask me anything. I will query my Agent View and return exactly what you need."
```

### 8.2 Protocol

Level 3 uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). MCP is an open protocol for structured tool-based interactions between agents and external systems.

### 8.3 Declaration in manifest

```json
{
  "access": {
    "agent_index": "/agent-index.json",
    "mcp_server": "https://atlashotels.ma/mcp",
    "mcp_version": "2025-03-26",
    "mcp_auth": "none",
    "mcp_tools": ["search_hotels", "get_hotel", "check_availability", "list_cities"]
  }
}
```

### 8.4 Minimum tool requirements

A Level 3 conformant implementation MUST expose at least one tool satisfying:

| Requirement | Rule |
|-------------|------|
| `name` | MUST be snake_case, descriptive, unique within the server |
| `description` | MUST be written for an LLM consumer. Include return value, accepted filters, units. |
| `inputSchema` | MUST be valid JSON Schema with descriptions on all fields |
| Response `_meta` | MUST include `generated_at` (ISO 8601) and `source` (domain) |

### 8.5 Complete tool example

```typescript
// NestJS + Mastra implementation

{
  name: "search_hotels",
  description:
    "Search available hotels by location, dates, and filters. " +
    "Returns hotels with prices in MAD, availability, GPS, and booking URLs. " +
    "Call check_availability for real-time confirmation after filtering.",

  inputSchema: z.object({
    location: z.string()
      .describe("City name (e.g. 'Casablanca') or GPS coordinates ('33.5731,-7.5898')"),
    radius_km: z.number().default(10)
      .describe("Search radius in kilometers. Default: 10"),
    checkin: z.string().optional()
      .describe("Check-in date in YYYY-MM-DD format"),
    checkout: z.string().optional()
      .describe("Check-out date in YYYY-MM-DD format"),
    budget_max_mad: z.number().optional()
      .describe("Maximum price per night in MAD"),
    stars_min: z.number().int().min(1).max(5).optional()
      .describe("Minimum star rating (1–5)"),
    guests: z.number().int().min(1).default(1)
      .describe("Number of guests")
  }),

  execute: async (input) => ({
    _meta: {
      generated_at: new Date().toISOString(),
      source: "atlashotels.ma",
      currency: "MAD",
      total: results.length
    },
    results: results.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      stars: hotel.stars,
      location: {
        city: hotel.city,
        district: hotel.district,
        coordinates: { lat: hotel.lat, lng: hotel.lng },
        distance_km: hotel.distanceKm
      },
      price_per_night_mad: hotel.price,
      availability: hotel.available,
      booking_url: `https://atlashotels.ma/hotels/${hotel.slug}`,
      cancellation_policy: hotel.cancellationPolicy
    }))
  })
}
```

### 8.6 Recommended tool patterns

```
search_{resource}     search with filters → list of results
get_{resource}        single item by id or slug → full detail
list_{categories}     enumerate available filters → taxonomy
check_{availability}  real-time state → current status
```

### 8.7 Authentication

| Value | Behavior |
|-------|---------|
| `none` | Public access. RECOMMENDED for public informational sites. |
| `api-key` | `X-API-Key` header. RECOMMENDED for commercial or sensitive data. |
| `bearer` | `Authorization: Bearer {token}` header. |

> **`oauth2` is deferred to RFC-005.** OAuth2 requires an interactive token exchange that autonomous agents cannot complete without user intervention. Sites requiring OAuth2 SHOULD expose a public `none` or `api-key` tier with limited scope, and a separate authenticated tier for user-specific operations.

### 8.8 Security requirements

Sites exposing Level 3 MUST implement:
- Rate limiting at the infrastructure level (RECOMMENDED: 100 req/min per IP for public endpoints)
- Input validation on all tool parameters
- Output filtering to prevent unintended data exposure

SHOULD implement:
- Agent activity logging
- Anomaly detection for unusual query patterns
- A dedicated MCP service isolated from core application logic

> **Session-based authentication (cookies + CSRF) is NOT RECOMMENDED for agent access.** Agents do not maintain cookie sessions. The MCP layer SHOULD use stateless authentication (API key or bearer token) and SHOULD be a separate service from the application's session-authenticated routes.

---

## 9. Token Economics

### 9.1 Why token cost is a first-class concern

Token cost is the primary economic constraint of LLM inference at scale. Every character an agent processes has a cost. A standard that ignores this constraint will be deprioritized by agents optimizing for efficiency.

`index-ai` is designed so that implementing the standard makes a site **economically rational to consume** from an agent's perspective. Not just discoverable — cost-efficient to query.

### 9.2 Token efficiency by level

| Level | Token consumption model |
|-------|------------------------|
| L0 — None | Agent fetches full HTML. Pays for markup, scripts, navigation, ads. Useful content is a fraction of total. |
| L1 — Manifest | Agent reads manifest (~500 chars). Knows identity, structure, freshness without fetching any content. |
| L2a — Agent Index | Agent reads `llm_summary` (~200 chars per node) to decide. If relevant: fetches `llm_url` for `content_chars` chars of clean content (`exact` or `max` bound). |
| L2b — Agent Graph | Agent traverses graph to reach specific sub-nodes. Only fetches what is relevant. |
| L3 — MCP | Agent sends typed query with filters. Receives exactly the data requested. Minimum possible tokens. |

### 9.3 `content_chars` — a measurement, not a declaration

`content_chars` is computed, not declared. This distinction is fundamental.

```
content_chars = Unicode_NFC_codepoint_count(content_served_by_llm_url)
```

This value:
- Is computed by the SDK at Agent View generation time by fetching `llm_url`
- Is exact (`content_chars_mode: "exact"`) for static and infrequently updated sites
- Is a measured upper bound (`content_chars_mode: "max"`) for `continuous` sites
- Is invalidated when content changes significantly

An agent reading `content_chars: 18400` with `content_chars_mode: "exact"` knows precisely what it will receive. With `"max"`, it knows the upper bound. Either way, the token budget decision is made before the fetch — with no HTML parsing, no markup to discard.

```
content_chars / 4   ≈ tokens (English)
content_chars / 3.5 ≈ tokens (French, Spanish)
content_chars / 2   ≈ tokens (Arabic, Chinese)
content_chars / 3   ≈ tokens (code)
```

These are heuristics. Agents SHOULD apply their own conversion based on the node's declared `language`.

### 9.4 Why characters, not tokens

Characters are the canonical size metric because:

- **Exact**: `strlen_nfc()` is deterministic and universal
- **Stable**: same text = same count across all models, forever
- **Auditable**: anyone can verify the value independently
- **Tokenizer-agnostic**: each agent applies its own conversion

Token counts vary by tokenizer (`cl100k_base`, `llama3`, `gemma` give different counts for the same text). Publishing a token count without specifying the tokenizer creates ambiguity. Publishing a character count removes it entirely.

---

## 10. Policy & Usage Preferences

### 10.1 Purpose

The `policy` block lets publishers declare how they prefer agents to interact with their content. This is a machine-readable statement of preference, not a legal contract.

### 10.2 Complete schema

```json
{
  "policy": {
    "usage_preferences": {
      "search": true,
      "summarization": true,
      "citation": true,
      "agent_navigation": true,
      "training": false,
      "commercial_reuse": "requires_permission"
    },
    "citation": {
      "required": true,
      "preferred_format": "Site name — Page title — URL — Access date"
    },
    "rate_limits": {
      "requests_per_minute": 60,
      "crawl_delay_seconds": 1
    }
  }
}
```

### 10.3 Legal disclaimer

> The `policy` block expresses the publisher's usage preferences in machine-readable form. It does not constitute a legally binding agreement, does not override applicable law or regulation, and does not supersede existing contractual obligations. `robots.txt` directives take precedence over `policy` permissions for crawler behavior. Publishers seeking legal protection SHOULD consult legal counsel and implement appropriate licensing, `robots.txt` directives, and terms of service.

### 10.4 Default behavior

If `policy` is absent, agents SHOULD NOT assume any permissions are explicitly granted. The absence of a policy block is not equivalent to `training: true`.

---

## 11. Publisher Roles

### 11.1 Role declarations are not trust claims

`publisher.role` is self-asserted. Agents SHOULD use it as a weak prior signal, not as a guarantee. Any site can declare any role. Cryptographic verification is deferred to RFC-004.

### 11.2 Role taxonomy

| Value | Description |
|-------|-------------|
| `official-platform` | Direct service operator — booking, marketplace, SaaS |
| `official-docs` | Technical documentation of a product or framework |
| `aggregator` | Compiles third-party data |
| `news` | Editorial, dated content. Freshness is critical. |
| `blog` | Personal or editorial non-journalistic content |
| `community` | User-generated content — forums, wikis, Q&A |
| `ecommerce` | Product catalog with prices |
| `government` | Official public institution |
| `research` | Academic or scientific content |

Custom roles MUST use the `x-` prefix (e.g. `x-legal-database`, `x-financial-data`).

### 11.3 Category taxonomy

Recommended values for `identity.category`. Not exhaustive. Custom values accepted.

**Verticals:** `hotels` `restaurants` `travel` `real-estate` `jobs` `ecommerce` `healthcare` `finance` `legal` `education` `news` `entertainment` `sports` `weather` `insurance` `logistics`

**Technical:** `documentation` `developer-tools` `api` `open-source` `saas` `framework` `library` `cli` `sdk`

**Content type:** `blog` `reference` `tutorial` `community` `wiki` `dataset` `research`

---

## 12. Freshness & Versioning

### 12.1 Content date vs generation date

`freshness.content_updated_at` MUST reflect the most recently updated content — not the manifest generation date, deployment date, or server restart time.

For dynamic sites, this SHOULD be computed automatically: `MAX(updated_at)` across all relevant content records.

`freshness.manifest_generated_at` SHOULD be present and MUST reflect the time the manifest file was generated, not the content update time.

### 12.2 Refresh frequency values

| Value | Meaning |
|-------|---------|
| `continuous` | Real-time or near-real-time (booking availability, live data, news feeds) |
| `daily` | Updated at most once per day |
| `weekly` | Updated at most once per week |
| `monthly` | Updated at most once per month |
| `static` | Rarely or never changes |

> `realtime` is deprecated. Use `continuous`.

For `continuous` sites:
- `cache_max_age_seconds` SHOULD be 60–300
- `content_chars_mode` MUST be `"max"` on nodes whose size varies
- `content_chars` SHOULD represent the maximum observed content size over the last generation window
- `llm_summary` SHOULD be regenerated on significant content changes

### 12.3 Agent View regeneration

The Agent View SHOULD be regenerated when content changes significantly. For static sites: at each build. For dynamic sites: maintain a live endpoint.

An Agent View is considered stale when `content_chars_mode` is `"exact"` and the current NFC code point count of `content_at_llm_url` has changed significantly from the declared `content_chars`. For `"max"` nodes, the Agent View SHOULD be regenerated when the actual content size consistently exceeds the declared maximum.

---

## 13. Conformance

### 13.1 Levels and requirements

**Level 1:**
- Valid manifest at `/.well-known/index-ai.json`
- Validates against JSON Schema v1
- `spec_version` present
- Publicly accessible without authentication

**Level 2a (Agent Index):**
- Level 1 conformance
- Valid Agent View at URL declared in `access.agent_index`
- No `pages` array — all items in `nodes` array
- Every node with `content_chars` MUST have `llm_url`
- Every node with `content_chars` MUST have `content_chars_mode`
- `llm_url` endpoints MUST return `Content-Type: text/markdown` or `text/plain`
- `content_chars` MUST be measured by fetching `llm_url` (not the HTML page)
- For `content_chars_mode: "exact"`: validator MUST verify `content_chars` matches NFC code point count of `llm_url` content
- For `content_chars_mode: "max"`: validator MUST verify `content_chars` ≥ NFC code point count of `llm_url` content at validation time

**Level 2b (Agent Graph):**
- Level 2a conformance
- At least one root node (a node with `relations.parent: null`)
- At least one valid `parent`/`children` relation pair
- All `parent`/`children` links MUST form a valid DAG (no cycles, bidirectional consistency enforced)
- All node IDs referenced in `children` and `related` MUST exist in the Agent View

**Level 3:**
- Level 2a conformance (minimum — 2b recommended)
- Accessible MCP server at URL declared in `access.mcp_server`
- At least one tool satisfying §8.4 requirements

### 13.2 Implementation vs conformance

A site MAY implement a Level 3 MCP server without claiming Level 3 conformance. Implementation and conformance are separate concepts.

### 13.3 Validation

```bash
npx @hardmachinelabs/index-ai-validator validate https://example.com
```

Expected output:

```
  ✓ /.well-known/index-ai.json found (3.1 KB)
  ✓ Schema valid — Level 1
  ✓ /agent-index.json found (24 KB)
  ✓ No pages array — all content in nodes ✓
  ✓ Agent View schema valid
  ✓ content_chars_mode present on all nodes with content_chars
  ✓ content_chars verified against llm_url (18,400 NFC code points, mode: exact)
  ✓ 6 nodes with content_chars and llm_url — Level 2a
  ✓ DAG constraint satisfied, orphan check passed — Level 2b
  ⚠ publisher.verification_hint not set
  → Conformance: Level 2b
```

> The Level 2b line requires a reference-validator version that implements
> Agent Graph (DAG) validation. Check the installed
> `@hardmachinelabs/index-ai-validator` version's supported levels; earlier
> versions report up to Level 2a.

### 13.4 Public benchmark

A benchmark to measure the retrieval benefit of each conformance level is a primary contribution target. Until completed, all efficiency claims are labeled as illustrative examples.

Benchmark methodology target:
- 50 sites per level (L0, L1, L2a, L2b, L3)
- Correct citation rate across 5 query types per site
- Token consumption measurement per query
- Open methodology, reproducible, publicly published

---

### 13.5 Maturity matrix

A document, its schemas, its validator, and its adoption mature at different
rates. This release ships a per-artifact status matrix; a status is claimed
only with the evidence listed.

| Artifact | Allowed status | Evidence required |
|---|---|---|
| Normative text | Draft / RC / Stable | public tag + commit |
| Manifest schema | Draft / Stable | URL + conformance tests |
| Agent Index schema | Draft / Stable | URL + conformance tests |
| Validator L1 | Implemented / Tested | package + fixtures |
| Validator L2a | Implemented / Tested | package + fixtures |
| Validator L2b | Planned / Experimental / Implemented | real DAG tests |
| Level 3 (MCP) | Proposed / Experimental | runnable server or example |
| Benchmark (§13.4) | Planned / Running / Published | protocol + dataset + results |
| RFCs | Proposed / Open / Accepted | public issue + decision |
| External implementations | Pilot / Production | verifiable URLs |

At `1.0-rc1`: normative text = RC; schemas = Draft; validator L1/L2a = Tested;
validator L2b = Implemented (launch target); L3 = Proposed; benchmark =
Planned; RFCs = Proposed; external implementations = none yet.

## 14. Security Considerations

### 14.1 No sensitive data

Manifest and Agent View files MUST NOT contain:
- API keys, tokens, or credentials
- Personally identifiable information (PII)
- Internal infrastructure details
- Database schemas, internal IDs, or service names

### 14.2 Prompt injection

`llm_instructions`, `llm_summary`, and `description` fields are consumed by agents as text. Malicious publishers may attempt to inject adversarial instructions.

Agents MUST treat these fields as untrusted input, equivalent to any web-sourced content. String fields MUST NOT be interpreted as executable instructions or override the agent's system prompt.

Agents MUST sanitize content retrieved from `llm_url` as they would any web content.

### 14.3 Domain integrity

Agents SHOULD verify that `identity.domain` matches the hostname serving the manifest. A mismatch SHOULD be treated as suspicious and MUST NOT elevate the source's trust signal.

### 14.4 `robots.txt` precedence

Agents MUST fetch and respect `robots.txt` before accessing any resource including the manifest. `robots.txt` restrictions take precedence over any permissions declared in `policy`.

### 14.5 MCP endpoint security

- Rate limiting MUST be implemented at the infrastructure level
- Session-based auth (cookies + CSRF) is NOT RECOMMENDED
- MCP service SHOULD be isolated from core application logic
- Input validation MUST be applied to all tool parameters
- Circular traversal: agents MUST implement a maximum traversal depth of 5 hops when following `related` links. Agents SHOULD maintain a visited-node set during any graph traversal session to prevent revisiting nodes.

### 14.6 CORS

CORS `*` is RECOMMENDED for manifest and Agent View files.

CORS `*` is NOT RECOMMENDED on MCP endpoints unless explicitly designed for browser access.

---

## 15. Privacy Considerations

### 15.1 Agent View content scope

The Agent View is publicly accessible without authentication. Publishers MUST NOT expose private, personalized, or user-specific content through it.

The Agent View MUST represent **public, non-personalized information only**. Examples of what MUST NOT appear:

- User-specific data (account details, purchase history, personalized recommendations)
- Prices that vary by user session, geography, or negotiated agreement
- Internal product catalog items not publicly available
- Partial health, legal, or financial records
- Employee or candidate data

### 15.2 Dynamic sites and privacy

Sites that serve personalized content to human users MUST ensure that `llm_url` endpoints serve **public, non-personalized versions** of content — equivalent to what an anonymous visitor would see.

The `?format=markdown` endpoint SHOULD NOT accept session cookies or authentication tokens. It SHOULD serve the same content regardless of caller identity.

### 15.3 Sensitive verticals

Sites in healthcare, legal, financial, insurance, and HR verticals SHOULD exercise particular caution. The Agent View SHOULD contain only aggregate, anonymized, or publicly available information.

### 15.4 `llm_summary` content

`llm_summary` fields are indexed by agents and may be cached. They MUST NOT contain:

- Individual user data
- Confidential pricing
- Unpublished content
- Data subject to regulatory restrictions

---

## 16. Compatibility

`index-ai` complements existing standards. It does not replace them.

| Standard | Purpose | Relationship |
|----------|---------|-------------|
| `robots.txt` | Crawler access rules | Add `Agent-Manifest:` directive. `robots.txt` always takes precedence. |
| `sitemap.xml` | URL index for search engines | `/agent-index.json` provides a richer, agent-optimized complement |
| `llms.txt` | Human-readable LLM context | Link via `access.llms_txt`. index-ai adds structure, exact sizing, and queryability. |
| `schema.org` / JSON-LD | Structured data for search | Different consumers (search engines vs agents). Both can coexist. |
| OpenAPI | API documentation for developers | Level 3 MCP tools expose a curated, agent-optimized subset of the API |

---

## 17. Governance

### 17.1 RFC process

Significant changes go through a public RFC process:

1. Open a GitHub issue with label `RFC`
2. Describe the problem, proposed change, and trade-offs
3. Minimum 2-week public comment period
4. Decision by maintainers with documented rationale
5. Consensus → PR to update spec + RFC closed

Minor clarifications and bug fixes MAY be merged via PR without an RFC. Breaking changes to required fields require an RFC and a major version bump.

### 17.2 Versioning policy

This spec follows Semantic Versioning:
- **Patch** (e.g. `0.7.1`): clarifications, typo fixes, no schema changes
- **Minor** (e.g. `0.8`): new optional fields, new optional mechanisms, backward-compatible additions
- **Major** (e.g. `1.0`): breaking changes to required fields or core architecture

`spec_version` in manifests MUST be updated when the site's manifest uses features introduced in a new minor or major version.

### 17.3 Path to 1.0

`index-ai` is currently a **public proposal under review**. The normative
text, JSON Schemas, validator behavior, and reference implementations MAY
change before the stable 1.0 release.

Version 1.0 will be declared `STABLE` only after, with public evidence:

1. the normative specification and JSON Schemas are publicly available at the declared URLs;
2. the reference validator (`@hardmachinelabs/index-ai-validator`) is published and tested against shared fixtures;
3. runnable examples exist for every claimed conformance level (L2b and L3 clearly marked by availability);
4. at least one public release candidate has completed a real minimum two-week comment period;
5. blocking feedback has been resolved through documented public decisions;
6. at least two independent implementers have tested the specification.

Efficiency and retrieval claims remain illustrative until the public
benchmark (§13.4) is completed. Future breaking changes follow the RFC
process (§17.1) and result in a major version; backward-compatible additions
increment the minor version.

### 17.4 Proposed RFCs (not yet opened publicly)

> These are internal design intentions, listed for transparency. None has
> been opened as a public RFC yet. Each will receive an id, a public URL, an
> author, a status, and an open date when the process (§17.1) is actually
> exercised.

- **RFC-001** — Discovery registry
- **RFC-002** — Versioned content snapshots
- **RFC-003** — `llm_summary` quality enforcement
- **RFC-004** — Cryptographic publisher verification
- **RFC-005** — M2M authentication for Level 3
- **RFC-006** — Cursor-based pagination for Level 3 MCP

---

## 18. Changelog

### 18.1 Public releases

_None yet._ The first public release is `1.0-rc1` (REQUEST FOR COMMENTS),
published at launch — see the frontmatter for its real date. `STABLE` is
declared only after §17.3.

### 18.2 Internal design history

The entries below are **internal working iterations** produced during design.
They are not public releases and do not represent a public standardization
cycle. Dates reflect the design sprint, not public comment periods.

| Iteration | Date | Summary |
|---------|------|---------|
| 1.0 internal draft | 2025-05-28 | Internal design iteration. Never published as a stable release. Abstract rewritten: "without relying on unstructured HTML scraping" replaces absolute claims. `content_chars_mode: "max"` contract rewritten: testable rule (MUST be ≥ validation-time count) replaces untestable "2× typical size". `spec_version` updated to `"1.0"`. |
| 1.0-rc1 | 2025-05-28 | Release Candidate. `llm_url` redirect rule (3-hop max). Paginated response 2 MB cap. `content_chars_measurement` first-generation behavior clarified. 2-week comment period. |
| 0.7 | 2025-05-28 | `content_chars_mode` MUST. `pages` array removed. `content_chars_measurement` block. `robots.txt` 404 behavior. Offset pagination + `continuous` note. Agents MUST NOT assume `/agent-index.json`. |
| 0.6 | 2025-05-28 | `content_chars_mode` field. Pagination standardized. Level 2b qualitative conformance. Orphan detection. `related` depth MUST 5 hops. SDK "verifies". JSON scope clarified. Minimal Level 2a example. RFC-006. |
| 0.5 | 2025-05-28 | `estimated_chars` → `content_chars`. `estimated_tokens` removed. Level 2a/2b split. Unicode NFC definition. `?format=markdown` RECOMMENDED. `summary_method`. Privacy section. DAG constraint. |
| 0.4 | 2025-05-28 | Agent View concept. Token economics. `content_chars` contract. Two-phase model. `spec_version`. `manifest_generated_at`. oauth2 deferred. Governance. |
| 0.3 | 2025-05-28 | RFC 2119 language. Security section. Conformance section. `verification_hint`. `estimated_chars`. `continuous` replaces `realtime`. |
| 0.2 | 2025-05-28 | Discovery mechanisms. `publisher.role`. Policy block. `ai-content-map.json`. `llms.txt` compatibility. |
| 0.1 | 2025-05-28 | Initial draft — 3-level model, basic manifest, MCP. |

---

*index-ai is an open proposal, not affiliated with any LLM provider.*  
*Contributions via GitHub Issues and Pull Requests.*  
*https://github.com/jordachmakaya/index-ai*
