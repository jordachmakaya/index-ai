import { describe, it, expect } from 'vitest'
import { generateCorpus } from '../benchmark/corpus.mjs'
import { runBenchmark, aggregate } from '../benchmark/run.mjs'

// Benchmark pilot (SPEC §13.4): the harness must be deterministic, its token
// ordering must match the spec's design (L1 < L2a ≈ L2b < L3 << L0), and the
// citation matrix must hold BY CONSTRUCTION:
// - L0 and L3 answer every query type at 100% (HTML contains all answers; the
//   query service projects exactly the matching records).
// - L1 answers only identity + freshness (the manifest carries no content).
// - L2a/L2b answer everything (index + two-phase targeted fetch, §7).
// Small corpus (4 sites per level) keeps the suite fast; determinism is
// asserted on the exact row stream.

const LEVELS = ['L0', 'L1', 'L2a', 'L2b', 'L3']
const TYPES = ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference']

describe('benchmark corpus (SPEC §13.4)', () => {
  it('generates the requested site count, one vertical per site', () => {
    const sites = generateCorpus({ sitesPerLevel: 4, seed: 20260812 })
    expect(sites).toHaveLength(5 * 4)
    for (const s of sites) {
      expect(s.level).toBeOneOf(LEVELS)
      expect(s.id).toMatch(/^[a-z]+-\d{2}$/)
      expect(s.nodes.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('every site ships exactly 5 queries, one per benchmark type', () => {
    const sites = generateCorpus({ sitesPerLevel: 4, seed: 20260812 })
    for (const s of sites) {
      expect(s.queries.map((q) => q.type)).toEqual(TYPES)
    }
  })

  it('artifact sets grow with the level (L1 adds manifest, L2+ add index)', () => {
    const sites = generateCorpus({ sitesPerLevel: 4, seed: 20260812 })
    const byLevel = (l) => sites.filter((s) => s.level === l)
    for (const s of byLevel('L0')) {
      expect(s.files.has('index.html')).toBe(true)
      expect(s.files.has('.well-known/index-ai.json')).toBe(false)
    }
    for (const s of byLevel('L1')) {
      expect(s.files.has('.well-known/index-ai.json')).toBe(true)
      expect(s.files.has('index-ai.json')).toBe(true) // canonical alias (§5.2)
      expect(s.files.has('agent-index.json')).toBe(false)
    }
    for (const l of ['L2a', 'L2b', 'L3']) {
      for (const s of byLevel(l)) {
        expect(s.files.has('agent-index.json')).toBe(true)
        expect(s.files.has(`content/${s.nodes[0].id}.md`)).toBe(true)
      }
    }
  })
})

describe('benchmark harness (SPEC §13.4)', () => {
  it('is deterministic: same seed produces the identical row stream', async () => {
    const a = await runBenchmark({ sitesPerLevel: 4, seed: 7 })
    const b = await runBenchmark({ sitesPerLevel: 4, seed: 7 })
    expect(JSON.stringify(a.rows)).toBe(JSON.stringify(b.rows))
    expect(a.meta.seed).toBe(7)
    expect(a.meta.siteCount).toBe(20)
  })

  it('token ordering: L1 < L2a ≤ L2b < L3 << L0 (empirical for this corpus, fixed seed)', async () => {
    const { rows } = await runBenchmark({ sitesPerLevel: 4, seed: 20260812 })
    const per = aggregate(rows)
    const mean = (l) => per[l].meanTokens
    // L1 = manifest only; L2 = index + targeted fetch; L3 = query + records.
    // Deterministic for the fixed seed. (L3 > L2 is a property of THIS projection
    // serializing full summaries + facts — a leaner projection could flip it,
    // so this is asserted as observed behavior, not as a normative claim.)
    expect(mean('L1')).toBeLessThan(mean('L2a'))
    // L2b's index carries the relations block, so it is never cheaper than L2a
    // (single-page graphs: the graph is navigated, not paid for twice)
    expect(mean('L2b')).toBeGreaterThanOrEqual(mean('L2a'))
    expect(mean('L2b') - mean('L2a')).toBeLessThan(mean('L0') * 0.1)
    expect(mean('L2a')).toBeLessThan(mean('L3'))
    // the headline efficiency claim: the ladder cuts token cost massively vs HTML
    expect(mean('L0')).toBeGreaterThan(mean('L1') * 4)
    expect(mean('L0')).toBeGreaterThan(mean('L2a') * 3)
  })

  it('citation matrix holds by construction', async () => {
    const { rows } = await runBenchmark({ sitesPerLevel: 4, seed: 20260812 })
    const per = aggregate(rows)
    const rate = (l, t) => per[l].byType[t].rate

    // full HTML and the query service answer everything
    for (const t of TYPES) {
      expect(rate('L0', t)).toBe(1)
      expect(rate('L3', t)).toBe(1)
    }
    // Level 1 carries identity + freshness only — content queries are 0
    expect(rate('L1', 'identity')).toBe(1)
    expect(rate('L1', 'freshness')).toBe(1)
    for (const t of ['specific-fact', 'listing', 'cross-reference']) {
      expect(rate('L1', t)).toBe(0)
    }
    // Levels 2a/2b answer everything (index summaries + targeted fetch)
    for (const l of ['L2a', 'L2b']) {
      for (const t of TYPES) {
        expect(rate(l, t), `${l}/${t}`).toBe(1)
      }
    }
  })

  it('every row records its query, type, level, and metrics', async () => {
    const { rows } = await runBenchmark({ sitesPerLevel: 2, seed: 3 })
    expect(rows).toHaveLength(10 * 5)
    for (const r of rows) {
      expect(r.query.length).toBeGreaterThan(0)
      expect(TYPES).toContain(r.type)
      expect(LEVELS).toContain(r.level)
      expect(r.chars).toBeGreaterThan(0)
      expect(r.tokens).toBeGreaterThan(0)
      expect(typeof r.citation).toBe('boolean')
    }
  })
})
