# index-ai public benchmark (§13.4)

> **Status: Running (pilot)** — open methodology, reproducible, results published
> under `benchmark/results/`. The specification (§13.4) targets **50 sites per
> level**; this pilot ships the full methodology at the default 10 sites per
> level (50 sites) and can scale to the 50-per-level target with one flag.

## What it measures

The benchmark quantifies the retrieval benefit of each conformance level of the
index-ai ladder (SPEC §13.1): **token consumption per query** and **correct
citation rate** across five benchmark query types.

| Query type | Question the agent must answer |
|---|---|
| `identity` | Who publishes this site, and what does it cover? |
| `freshness` | When was a specific item last updated? |
| `specific-fact` | What is the price/length of a specific item? |
| `listing` | List all items available on the site. |
| `cross-reference` | Which items relate to another node? |

## Corpus

The corpus is **synthetic and deterministic** (`benchmark/corpus.mjs`):
`generateCorpus({ seed })` always produces the same sites, and the seed is
recorded in every results file — anyone can regenerate the exact dataset.

Synthetic sites are used because external implementations of index-ai are still
"none yet" (SPEC §13.5): a real-world corpus is impossible, and synthetic sites
let the benchmark measure the *mechanism* of each level on identical, realistic
content (hotels, blogs, docs, e-commerce, news verticals).

Each site ships the artifacts of its level under its own origin sub-path:

| Level | Artifacts served |
|---|---|
| `L0` | `index.html` only (realistic HTML with nav/sidebar/footer/scripts) |
| `L1` | + `.well-known/index-ai.json` (+ `index-ai.json` alias) |
| `L2a` | + `agent-index.json` (flat, no relations) + clean-text `content/*.md` |
| `L2b` | + `agent-index.json` **with** `parent`/`children`/`related` relations |
| `L3` | + the compact query service — a deterministic **projection inside the harness** of the §8 MCP tool contract (the corpus server itself serves the same files as `L2b`) |

Every site ships 5 queries, one per benchmark type, with **ground-truth answers
embedded as substrings** in the content the generator writes — citation is
therefore verifiable by containment, deterministically.

## Methodology per level

For each `(site, query)` pair the harness (`benchmark/run.mjs`) fetches exactly
the payloads the protocol requires the agent to read, then measures them:

| Level | Payload consumed | Model |
|---|---|---|
| `L0` | the site's full HTML payload | one fetch, whole page |
| `L1` | the AI Manifest | identity/publisher/freshness only |
| `L2a`/`L2b` | the Agent Index + the selected node's `llm_url` content | **two-phase model of §7**: read ≤200 chars of each node's `llm_summary` to decide relevance (phase 1); fetch the selected node's clean text **only when phase 1 did not already contain the answer** (phase 2) |
| `L3` | the query + the compact records returned by the query service | records projected to `id`/`label`/`facts`/`summary` (deterministic shim of the §8 MCP tool contract) |

`L2a` and `L2b` consume the same payloads in this corpus (single-page graphs:
the graph is navigated, not paid for twice — differences appear on paginated
graphs, tracked as RFC-006).

## Metrics

- **Tokens**: SPEC §9.3 English heuristic — `NFC chars / 4`, rounded up. Raw
  character counts are also reported per row. A real tokenizer can be plugged
  into `measure()` later; the heuristic is the one the spec itself uses for
  budget decisions.
- **Citation**: the ground-truth answer substring is present in the consumed
  payload (deterministic containment check).
- **Aggregates**: per-level mean/median tokens, overall citation rate, and the
  citation rate per query type.

## Reproducibility

```bash
# default pilot: 10 sites per level (50 sites), seed 20260812
pnpm benchmark

# spec target: 50 sites per level (250 sites)
node benchmark/run.mjs --sites-per-level 50

# different seed, or dump raw rows
node benchmark/run.mjs --seed 42 --dump rows.json
```

Each run writes `benchmark/results/<date>.json` (meta + per-level aggregates +
full rows) and prints a markdown summary. The seed, the token rule, and the
level count are recorded in the meta block of every results file.

## Results

| File | Seed | Sites | Notes |
|---|---|---|---|
| `results/2026-08-12-seed20260812.json` | `20260812` | 50 (10/level) | first pilot run |

Headline pilot results (50 sites, seed `20260812`):

| Level | Mean tokens | Median tokens | Citation rate |
|---|---|---|---|
| `L0` | 953 | 949 | 100% |
| `L1` | 146 | 149 | 40% |
| `L2a` | 147 | 161 | 100% |
| `L2b` | 148 | 166 | 100% |
| `L3` | 212 | 209 | 100% |

Citation by query type:

| Level | identity | freshness | specific-fact | listing | cross-reference |
|---|---|---|---|---|---|
| `L0` | 100% | 100% | 100% | 100% | 100% |
| `L1` | 100% | 100% | 0% | 0% | 0% |
| `L2a` | 100% | 100% | 100% | 100% | 100% |
| `L2b` | 100% | 100% | 100% | 100% | 100% |
| `L3` | 100% | 100% | 100% | 100% | 100% |

Reads:

1. **The ladder's efficiency claim holds in mechanism**: reading the manifest
   instead of the HTML cuts token consumption ~6.5× (146 vs 953 mean), and
   Levels 2a/2b answer **every** query type at 100% citation while consuming
   ~6.5× fewer tokens than the full HTML page (147 vs 953 mean).
2. **Level 1 is a scoped contract, not a search layer**: it answers identity
   and freshness at 100% but structurally cannot answer content queries
   (0% on specific-fact/listing/cross-reference — the manifest carries no
   content). That is the design: Level 1 tells the agent *what the site is*;
   Levels 2+ give it *the content*.
3. **Levels 2a/2b reach full retrieval at ~15% of the L0 token cost**, and the
   Level 3 query service keeps 100% citation while staying at 22% of the L0
   cost (212 vs 953) — the end-state the spec designs for: the agent receives
   exactly the requested records.

## Limits (declared, not hidden)

- **Synthetic corpus**: measures the *mechanism* of each level, not real-world
  adoption. External implementations are still "none yet" (§13.5).
- **English-only token heuristic** (§9.3): `chars / 4` is calibrated for
  English; non-English content would need the per-language rules of §9.3.
- **Deterministic citation check**: substring containment, not semantic
  equivalence — an agent that answers without the exact substring is counted
  as a miss.
- **L3 shim**: the query service is a deterministic projection, not a live MCP
  server; it exercises the contract shape (§8), not a production server.
- **Node selection is modeled, not real**: the two-phase fetch decision uses a
  keyword-scoring relevance heuristic with a leaf-node tie-break (an agent
  asked "the price of X" picks the page about X, not the site overview). A
  real retrieval step may score differently.
- **No network variance**: the corpus is served from localhost; latency,
  redirects, and robots policies are out of scope for this pilot.

## Governance

- Owned by the spec's §13.4 (Public benchmark) and §13.5 (Maturity matrix):
  the status moves from **Running** to **Published** when the methodology and
  results are externally reproducible and independently reviewed.
- The 50-sites-per-level target (SPEC §13.4) is reachable with
  `--sites-per-level 50`; publishing that run is the next milestone.
- Results are versioned by date + seed (`results/<date>-seed<seed>.json`); a
  change of methodology or seed is a new results series, not an edit to an old
  one (immutability policy §17.2). The committed results file is frozen; local
  reruns with the same seed/date overwrite the identical dataset, so the
  published artifact only ever changes by deliberate intent.
- Feedback via GitHub issues (label `rfc`), referencing SPEC §13.4.
