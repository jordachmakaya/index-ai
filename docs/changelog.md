---
layout: page
---

# Changelog

Published versions are immutable. The docs site currently documents **1.0-rc1** — if this page lists a newer version, follow it.

## Maturity

| Artifact | Status | Evidence |
|---|---|---|
| Normative text | **RC** | public tag + commit |
| Schemas | **Draft** | URL + conformance tests |
| Validator L1/L2a | **Tested** | package + fixtures |
| Level 3 (MCP) | **Proposed** | runnable example |

## 1.0-rc1 — Request for Comments

*Published at launch; the exact public date is set in the [SPEC frontmatter](/spec/SPEC-v1.0-rc1) (§18.1).*

- **Added** — published the full specification as a public RFC, versioned in `docs/spec/`.
- **Added** — defined the conformance ladder: Level 1 (AI Manifest), 2a (Agent Index), 2b (Agent Graph), 3 (Query Interface).
- **Added** — introduced the `llm_url` / `content_chars` contract — measured NFC code point counts, never declared (§7).
- **Added** — added the maturity matrix (normative text = RC, schemas = Draft, validator L1/L2a = Tested, L2b = Implemented launch target, L3 = Proposed — §13.5).
- **Fixed** — removed the separate `pages` array — all content items are now `nodes` (breaking change from v0.6).

## 0.6 — Working draft

*Design history iteration (see [SPEC §18.2](/spec/SPEC-v1.0-rc1#_18-2-internal-design-history)) — not a public release.*

- **Added** — first public working draft of the Agent View schema.
- **Added** — defined the two-phase consumption model (pre-fetch decision + targeted fetch).

::: tip Version drift?
The specification text you read on [the spec page](/spec/) is the version this site documents. When a new version publishes, this changelog leads — the spec page is updated to match. Published versions are never rewritten.
:::
