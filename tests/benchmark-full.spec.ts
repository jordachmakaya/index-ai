import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBenchmark, aggregate } from '../benchmark/run.mjs'

// Published full run (SPEC §13.4 target: 50 sites per level, 250 sites).
// The committed results file is the immutable published artifact (governance
// §17.2): this suite locks its meta, its internal consistency, and — by
// regenerating the identical dataset — its reproducibility.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = resolve(ROOT, 'benchmark/results/2026-08-12-seed20260813.json')

const LEVELS = ['L0', 'L1', 'L2a', 'L2b', 'L3']
const TYPES = ['identity', 'freshness', 'specific-fact', 'listing', 'cross-reference']

const dataset = JSON.parse(readFileSync(FILE, 'utf8'))

describe('published benchmark dataset (SPEC §13.4, 50 sites/level)', () => {
  it('meta records the published full run (250 sites, status Published)', () => {
    expect(dataset.meta.status).toBe('Published')
    expect(dataset.meta.sitesPerLevel).toBe(50)
    expect(dataset.meta.siteCount).toBe(250)
    expect(dataset.meta.seed).toBe(20260813)
    expect(dataset.rows).toHaveLength(250 * 5)
  })

  it('per-level aggregates are internally consistent with the rows', () => {
    const recomputed = aggregate(dataset.rows)
    for (const l of LEVELS) {
      expect(recomputed[l].queries).toBe(dataset.perLevel[l].queries)
      expect(recomputed[l].meanTokens).toBe(dataset.perLevel[l].meanTokens)
      expect(recomputed[l].medianTokens).toBe(dataset.perLevel[l].medianTokens)
      expect(recomputed[l].citationRate).toBeCloseTo(dataset.perLevel[l].citationRate, 10)
    }
  })

  it('token ordering matches the ladder design (L1 < L2a ≤ L2b < L3 << L0)', () => {
    const mean = (l) => dataset.perLevel[l].meanTokens
    expect(mean('L1')).toBeLessThan(mean('L2a'))
    // L2b carries the relations block, so it is never cheaper than L2a
    expect(mean('L2b')).toBeGreaterThanOrEqual(mean('L2a'))
    expect(mean('L2b') - mean('L2a')).toBeLessThan(mean('L0') * 0.1)
    expect(mean('L2a')).toBeLessThan(mean('L3'))
    // headline efficiency claim: the ladder cuts token cost massively vs HTML
    expect(mean('L0')).toBeGreaterThan(mean('L1') * 4)
    expect(mean('L0')).toBeGreaterThan(mean('L2a') * 3)
  })

  it('citation matrix holds by construction at full scale', () => {
    const rate = (l, t) => dataset.perLevel[l].byType[t].rate
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
    for (const l of ['L2a', 'L2b']) {
      for (const t of TYPES) {
        expect(rate(l, t), `${l}/${t}`).toBe(1)
      }
    }
  })

  it('is reproducible: regenerating with the same params reproduces the exact rows', async () => {
    const rerun = await runBenchmark({ sitesPerLevel: 50, seed: 20260813, status: 'Published' })
    expect(rerun.meta.siteCount).toBe(250)
    expect(JSON.stringify(rerun.rows)).toBe(JSON.stringify(dataset.rows))
  })
})
