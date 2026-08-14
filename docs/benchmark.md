---
layout: page
---

<script setup>
import BenchmarkScaffold from './.vitepress/theme/components/BenchmarkScaffold.vue'
import BenchmarkResults from './.vitepress/theme/components/BenchmarkResults.vue'
</script>

<BenchmarkScaffold>

## What it measures

The benchmark quantifies the retrieval benefit of each conformance level of the index-ai ladder (SPEC §13.1): **token consumption per query** and **correct citation rate** across five benchmark query types. For every site, the harness fetches exactly the payloads the protocol requires an agent to read at that level, then measures how many tokens that payload costs (SPEC §9.3 heuristic — NFC characters ÷ 4) and whether it contains the ground-truth answer (a deterministic citation check).

Every number below is a fact from the published run — 250 synthetic sites, one per query type embedded in the generated content, regenerated and locked by integrity tests.

<BenchmarkResults />

The headline reads: **Levels 2a/2b reach 100% citation on every query type at ~15% of the raw-HTML token cost** (147 vs 955 mean tokens), and the Level 3 query interface keeps 100% citation at 22% of the L0 cost. Level 1 is a scoped contract — it answers *who* publishes a site and *when* it changed (100%), and by design carries no content (0% on content queries). That is the ladder working as specified.

## Corpus

The corpus is **synthetic and deterministic** (`benchmark/corpus.mjs`): `generateCorpus({ seed })` always produces the same sites, and the seed is recorded in every results file — anyone can regenerate the exact dataset. Synthetic sites are used because external implementations of index-ai are still "none yet" (SPEC §13.5): the benchmark measures the *mechanism* of each level on identical, realistic content (hotels, blogs, docs, e-commerce, news verticals), not real-world adoption.

| Level | Artifacts served |
|---|---|
| `L0` | `index.html` only (realistic HTML with nav/sidebar/footer/scripts) |
| `L1` | + `.well-known/index-ai.json` (+ `index-ai.json` alias) |
| `L2a` | + `agent-index.json` (flat, no relations) + clean-text `content/*.md` |
| `L2b` | + `agent-index.json` **with** `parent`/`children`/`related` relations |
| `L3` | + the compact query service — a deterministic projection of the §8 MCP tool contract |

## Methodology

For each `(site, query)` pair the harness (`benchmark/run.mjs`) consumes exactly the payload the protocol requires, then measures it:

| Level | Payload consumed | Model |
|---|---|---|
| `L0` | the site's full HTML payload | one fetch, whole page |
| `L1` | the AI Manifest | identity/publisher/freshness only |
| `L2a`/`L2b` | the Agent Index + the selected node's `llm_url` content | **two-phase model of §7**: read ≤200 chars of each node's `llm_summary` to decide relevance, then fetch the selected node's clean text only when phase 1 did not already contain the answer |
| `L3` | the query + the compact records returned by the query service | records projected to `id`/`label`/`facts`/`summary` |

`L2a` and `L2b` consume the same payloads on this corpus (single-page graphs — the difference appears on paginated graphs, tracked as RFC-006). Full protocol, metrics, and governance: [`benchmark/README.md`](https://github.com/jordachmakaya/index-ai/blob/main/benchmark/README.md).

## Reproducibility

```bash
# reproduce the published dataset exactly
pnpm benchmark        # = node benchmark/run.mjs --sites-per-level 50 --seed 20260813 --status Published

# verify integrity (meta, aggregates, token order, citation matrix, identical regeneration)
pnpm vitest run tests/benchmark-full.spec.ts
```

The seed, the token rule, the status, and the level count are recorded in the meta block of every results file. A change of methodology or seed is a new results series, never an edit to a published one (immutability policy §17.2).

## Limits — what these numbers do *not* claim

- **Synthetic corpus**: the run measures the *mechanism* of each level, not real-world adoption or cost savings on the live web.
- **Citation by containment**: the answer is checked as a substring, not by semantic equivalence — an agent that answers without the exact substring counts as a miss.
- **English-only token heuristic** (§9.3): `chars ÷ 4` is calibrated for English; per-language rules are not exercised.
- **L3 is a projection, not a live server**: the query service exercises the §8 contract shape deterministically.
- **Node selection is modeled**: the two-phase relevance heuristic is a stand-in for a real retrieval step.
- **No network variance**: the corpus is served from localhost.

These numbers validate the *ladder's efficiency in mechanism* — they do not estimate implementation effort, real tokenizer values, or non-English content.

::: tip Specification
The normative home of the benchmark is [SPEC §13.4](/spec/) (public benchmark) and §13.5 (maturity matrix). Feedback via GitHub issues, label `rfc`, referencing §13.4.
:::

</BenchmarkScaffold>
