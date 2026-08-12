/**
 * Benchmark harness (SPEC §13.4) — measures the retrieval benefit of each
 * conformance level: token consumption per query and correct-citation rate.
 *
 * Methodology (full protocol in benchmark/README.md):
 * - Corpus: deterministic synthetic sites (benchmark/corpus.mjs), one origin,
 *   each site mounted under `/<siteId>/`. Every site ships 5 queries, one per
 *   benchmark query type (identity, freshness, specific-fact, listing,
 *   cross-reference), with ground-truth answers embedded in the content.
 * - Consumption per level (the payloads the protocol requires the agent to
 *   read):
 *   L0  = the site's full HTML payload
 *   L1  = the AI Manifest (identity/publisher/freshness only)
 *   L2a = the Agent Index (+ the selected node's llm_url content, fetched
 *         only when the index does not already contain the answer — the
 *         two-phase model of §7)
 *   L2b = same as L2a (single-page views: the graph is navigated, not paid
 *         for twice — differences appear on paginated graphs, RFC-006)
 *   L3  = the query + the compact records returned by the query service
 *         (deterministic shim of the §8 MCP contract: nodes matching the
 *         query keywords, projected to id/label/facts/summary)
 * - Tokens: SPEC §9.3 heuristic, `NFC chars / 4` (English); raw char counts
 *   are also reported. A real tokenizer can be plugged in later — the
 *   heuristic is the one the spec itself uses for budget decisions.
 * - Citation: the ground-truth answer substring is present in the consumed
 *   payload (deterministic containment check).
 *
 * CLI: `node benchmark/run.mjs [--sites-per-level N] [--seed N] [--dump corpus.json]`
 * Writes `benchmark/results/<date>-seed<seed>.json` and prints a markdown summary.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { generateCorpus, serveCorpus } from './corpus.mjs'

const LEVELS = ['L0', 'L1', 'L2a', 'L2b', 'L3']

const STOPWORDS = new Set([
  'what', 'is', 'the', 'of', 'and', 'when', 'which', 'list', 'all', 'on', 'this', 'site', 'are',
  'available', 'relate', 'related', 'was', 'last', 'who', 'does', 'it', 'cover', 'covers', 'for',
  'with', 'in', 'a', 'to', 'that', 'do', 'you', 'have', 'name', 'by', 'at', 'its', 'any',
])

function keywords(q) {
  return [...new Set(q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)))]
}

function consume(payload, answer) {
  const chars = payload.length
  return { chars, tokens: Math.ceil(chars / 4), citation: payload.includes(answer) }
}

function selectNode(site, kw) {
  // Simulates a rational agent's relevance decision: score nodes by keyword
  // coverage of label+summary, and on a tie prefer the LEAF node (a specific
  // item page) over a container (overview/collection) — an agent asked for
  // "the price of X" picks the page about X, not the site overview. This is a
  // declared modeling choice (benchmark/README.md, Limits).
  const isLeaf = (n) => n.type !== 'page' && n.type !== 'collection'
  let best = null
  let bestScore = -1
  for (const n of site.nodes) {
    const hay = `${n.label} ${n.summary}`.toLowerCase()
    const score = kw.filter((k) => hay.includes(k)).length
    if (best === null || score > bestScore || (score === bestScore && isLeaf(n) && !isLeaf(best))) {
      bestScore = score
      best = n
    }
  }
  return best ?? site.nodes[0]
}

async function measure(site, query, base) {
  const get = async (path) => (await fetch(`${base}/${path}`)).text()
  const kw = keywords(query.q)

  switch (site.level) {
    case 'L0': {
      const body = await get(`${site.id}/index.html`)
      return consume(body, query.answer)
    }
    case 'L1': {
      const body = await get(`${site.id}/.well-known/index-ai.json`)
      return consume(body, query.answer)
    }
    case 'L2a':
    case 'L2b': {
      // Phase 1 (SPEC §9.2): read up to 200 chars of each node's llm_summary
      // to decide relevance. Phase 2 (SPEC §7): fetch the selected node's
      // llm_url content — only when Phase 1 did not already contain the answer.
      const view = JSON.parse(await get(`${site.id}/agent-index.json`))
      const phase1 = view.nodes
        .map((n) => (n.content?.llm_summary ?? '').slice(0, 200))
        .join('\n')
      if (phase1.includes(query.answer)) return consume(phase1, query.answer)
      const node = selectNode(site, kw)
      const content = await get(`${site.id}/content/${node.id}.md`)
      return consume(phase1 + content, query.answer)
    }
    case 'L3': {
      const view = JSON.parse(await get(`${site.id}/agent-index.json`))
      const matches = view.nodes.filter((n) => {
        const facts = JSON.stringify(n.meta?.facts ?? '')
        const hay = `${n.label} ${n.content?.llm_summary ?? ''} ${facts}`.toLowerCase()
        return kw.some((k) => hay.includes(k))
      })
      const picked = matches.length ? matches : view.nodes.slice(0, 1)
      const result = picked.map((n) => ({
        id: n.id,
        label: n.label,
        facts: n.meta?.facts ?? null,
        summary: (n.content?.llm_summary ?? '').slice(0, 200),
      }))
      return consume(`${query.q} ${JSON.stringify(result)}`, query.answer)
    }
    default:
      throw new Error(`unknown level ${site.level}`)
  }
}

/**
 * Runs the benchmark. Deterministic for a fixed (seed, sitesPerLevel).
 *
 * @param {{ sitesPerLevel?: number, seed?: number }} [opts]
 * @returns {Promise<{ meta: object, rows: Array }>}
 */
export async function runBenchmark({ sitesPerLevel = 10, seed = 20260812 } = {}) {
  const sites = generateCorpus({ sitesPerLevel, seed })
  const server = await serveCorpus(sites)
  try {
    const rows = []
    for (const site of sites) {
      for (const query of site.queries) {
        const m = await measure(site, query, server.base)
        rows.push({
          site: site.id,
          level: site.level,
          vertical: site.vertical,
          type: query.type,
          query: query.q,
          chars: m.chars,
          tokens: m.tokens,
          citation: m.citation,
        })
      }
    }
    return {
      meta: {
        spec: 'SPEC-v1.0-rc2 §13.4',
        status: 'Running (pilot)',
        seed,
        sitesPerLevel,
        siteCount: sites.length,
        levels: LEVELS,
        queryTypes: ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference'],
        tokens: 'NFC chars / 4 (SPEC §9.3 English heuristic)',
        generated: new Date().toISOString(),
      },
      rows,
    }
  } finally {
    server.close()
  }
}

/** Aggregates rows into per-level + per-query-type statistics. */
export function aggregate(rows) {
  const perLevel = {}
  for (const level of LEVELS) {
    const r = rows.filter((x) => x.level === level)
    const toks = r.map((x) => x.tokens).sort((a, b) => a - b)
    const byType = {}
    for (const row of r) {
      byType[row.type] ??= { count: 0, citations: 0 }
      byType[row.type].count += 1
      if (row.citation) byType[row.type].citations += 1
    }
    perLevel[level] = {
      queries: r.length,
      meanTokens: r.length ? Math.round(r.reduce((s, x) => s + x.tokens, 0) / r.length) : 0,
      medianTokens: toks.length ? toks[Math.floor(toks.length / 2)] : 0,
      citationRate: r.length ? r.filter((x) => x.citation).length / r.length : 0,
      byType: Object.fromEntries(
        Object.entries(byType).map(([t, v]) => [t, { count: v.count, citations: v.citations, rate: v.citations / v.count }]),
      ),
    }
  }
  return perLevel
}

function mdTable(perLevel) {
  const head = '| Level | Queries | Mean tokens | Median tokens | Citation rate |'
  const sep = '|---|---|---|---|---|'
  const rows = LEVELS.map((l) => {
    const p = perLevel[l]
    return `| ${l} | ${p.queries} | ${p.meanTokens} | ${p.medianTokens} | ${(p.citationRate * 100).toFixed(0)}% |`
  })
  return [head, sep, ...rows].join('\n')
}

function mdTypeTable(perLevel) {
  const head = '| Level | ' + ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference'].join(' | ') + ' |'
  const sep = '|---|' + '---|'.repeat(5)
  const rows = LEVELS.map((l) => {
    const cells = ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference'].map(
      (t) => `${(perLevel[l].byType[t].rate * 100).toFixed(0)}%`,
    )
    return `| ${l} | ${cells.join(' | ')} |`
  })
  return [head, sep, ...rows].join('\n')
}

async function main() {
  const args = process.argv.slice(2)
  const opt = (name) => {
    const i = args.indexOf(name)
    return i >= 0 && args[i + 1] ? args[i + 1] : undefined
  }
  const sitesPerLevel = Number(opt('--sites-per-level') ?? 10)
  const seed = Number(opt('--seed') ?? 20260812)
  const dump = opt('--dump')

  const result = await runBenchmark({ sitesPerLevel, seed })
  if (dump) {
    writeFileSync(resolve(dirname(fileURLToPath(import.meta.url)), dump), `${JSON.stringify(result.rows, null, 2)}\n`)
  }

  const perLevel = aggregate(result.rows)
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const outDir = resolve(root, 'benchmark/results')
  mkdirSync(outDir, { recursive: true })
  // Version by date + seed (immutability policy §17.2): reruns on the same day
  // with the same seed overwrite the identical dataset; a new seed is a new series.
  const slug = `${result.meta.generated.slice(0, 10)}-seed${result.meta.seed}`
  const outFile = resolve(outDir, `${slug}.json`)
  writeFileSync(outFile, `${JSON.stringify({ meta: result.meta, perLevel, rows: result.rows }, null, 2)}\n`)

  console.log(`# index-ai benchmark — ${result.meta.status}`)
  console.log(`Corpus: ${result.meta.siteCount} sites (${result.meta.sitesPerLevel} per level), seed ${result.meta.seed}`)
  console.log('')
  console.log(mdTable(perLevel))
  console.log('')
  console.log('Citation rate by query type:')
  console.log(mdTypeTable(perLevel))
  console.log('')
  console.log(`Results written to ${outFile}`)
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  await main()
}
