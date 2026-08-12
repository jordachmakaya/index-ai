# index-ai

> An open specification proposal that makes websites **verifiably readable by AI agents**.

**Status: `1.0-rc2` — REQUEST FOR COMMENTS** · Spec: CC-BY-4.0 · Code: MIT

`index-ai` lets a website expose a **verifiable, agent-readable representation** of its content — structured metadata, clean content endpoints, and a measured token cost. It defines what an agent can reliably **access, extract, and budget** once it reaches the site.

It does not, and cannot, guarantee that any given agent or search engine will discover, index, or cite the site — those outcomes depend on third-party systems and are treated here as benefits to be measured, never as promises.

## Why

LLMs gained web search, but every page they fetch still pays the full token cost of markup built for human eyes. `index-ai` answers structurally: a parallel layer of the site, built exclusively for agents — structured, semantic, and token-efficient by design.

## The conformance ladder

| Level | What it provides | Effort |
|---|---|---|
| **1 — AI Manifest** | Identity, publisher, freshness, policy — one HTTP call answers “What is this site?” | ~15 minutes · `/.well-known/index-ai.json` |
| **2a — Agent Index** | A flat list of content nodes with clean-text endpoints and measured content sizes where declared | ~1–2 hours · `/agent-index.json` |
| **2b — Agent Graph** | Typed relationships between nodes — navigate without parsing HTML | +2–4 hours · relations in `/agent-index.json` |
| **3 — Query Interface** | A typed API over the Agent View (MCP) — exactly the data requested | MCP server |

Start at Level 1, climb as far as you need. **Partial conformance is valid to ship.**

> Effort figures are current implementation **targets** — they require public validation via the benchmark in the spec (§13.4).

## Benchmark (§13.4) — Running

The public benchmark that measures the retrieval benefit of each level is
**Running (pilot)**: deterministic synthetic corpus, token consumption per
query, and correct-citation rate across five query types. Reproduce it locally:

```bash
pnpm benchmark
```

Pilot results (50 synthetic sites, seed `20260812`): Level 1 cuts token
consumption ~6.5× vs full HTML while answering identity/freshness (40%
overall citation); on this corpus Levels 2a/2b answer **all** query types at
100% citation with ~6.5× fewer tokens than the page; Level 3 keeps 100% at
22% of the L0 cost. Methodology, corpus, limits, and the 50-sites-per-level
scaling path are documented in [benchmark/README.md](benchmark/README.md).

## In this repository

- `docs/spec/SPEC-v1.0-rc2.md` — the full specification (single source of truth)
- `schema/v1/` — the official JSON Schemas (manifest + Agent View)
- `docs/public/` — media assets for the docs site
- `ci/` — lint checks; `ci/refresh-dogfood.mjs` regenerates the served dogfood timestamps at build; `tests/` + `e2e/` — unit and end-to-end tests
- `benchmark/` — the public benchmark (§13.4): corpus generator, harness, protocol, and published results

## Get started

1. **Read the spec** — [docs/spec/SPEC-v1.0-rc2.md](docs/spec/SPEC-v1.0-rc2.md)
2. **Implement Level 1** — publish `/.well-known/index-ai.json` (or use scoped discovery via `rel="agent-manifest"` on sub-path hosts — see spec §5.2)
3. **Validate** — `npx @hardmachinelabs/index-ai-validator validate <url>` (consumed as-is, see the spec)

## License

- **Specification text**: CC-BY-4.0
- **Code & examples**: MIT

## Contributing

The standard is in RFC status — feedback, issues, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [issue templates](https://github.com/jordachmakaya/index-ai/issues/new/choose).
