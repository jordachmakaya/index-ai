import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// T-SUMMARY (audit round 6): SPEC §7.8 mandates `llm_summary` between 20 and
// 300 words. JSON Schema can only enforce minLength (structural), so this test
// enforces the semantic bound over every published example and the dogfood
// Agent View — and pins the spec itself to a single, internally consistent
// bound (the old prose said "50–300" while the normative MUST said 20–300).

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readText(file: string): string {
  return readFileSync(resolve(root, file), 'utf8')
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

interface SummaryItem {
  line: number
  text: string
}

/** Extracts every `llm_summary` from the Agent View JSON blocks of a markdown doc. */
function summaryBlocks(md: string): SummaryItem[] {
  const out: SummaryItem[] = []
  const re = /```json\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    const raw = m[1]
    if (raw.trimStart().startsWith('"')) continue // single-property fragment
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      continue
    }
    if (!isRecord(json) || !Array.isArray(json.nodes)) continue
    const line = md.slice(0, m.index).split('\n').length
    for (const node of json.nodes as unknown[]) {
      const content = isRecord(node) ? node.content : undefined
      if (isRecord(content) && typeof content.llm_summary === 'string') {
        out.push({ line, text: content.llm_summary })
      }
    }
  }
  return out
}

describe('llm_summary length (SPEC §7.8)', () => {
  it('the spec itself is internally consistent on the 20–300 bound', () => {
    const spec = readText('docs/spec/SPEC-v1.0-rc2.md')
    expect(spec).toContain('between 20 and 300 words') // normative MUST list
    expect(spec).toContain('20–300 words per node') // field table + narrative
    expect(spec).not.toContain('50–300') // stale bound must be gone everywhere
  })

  const sources: Array<{ file: string; items: SummaryItem[] }> = [
    { file: 'docs/spec/SPEC-v1.0-rc2.md', items: summaryBlocks(readText('docs/spec/SPEC-v1.0-rc2.md')) },
    { file: 'docs/quickstart.md', items: summaryBlocks(readText('docs/quickstart.md')) },
    {
      file: 'docs/public/agent-index.json',
      items: ((JSON.parse(readText('docs/public/agent-index.json')) as Record<string, unknown>).nodes as unknown[])
        .filter(isRecord)
        .map((n) => ({ line: 0, text: (n.content as Record<string, unknown>).llm_summary as string })),
    },
  ]

  for (const { file, items } of sources) {
    it(`${file}: every llm_summary is between 20 and 300 words`, () => {
      expect(items.length).toBeGreaterThan(0)
      for (const item of items) {
        // Truncated excerpts in the docs end with the ellipsis character — they
        // are intentional abbreviations of a longer example, not documents.
        if (item.text.includes('…')) continue
        const n = wordCount(item.text)
        expect(
          n,
          `${file}: llm_summary at line ${item.line} is ${n} words — SPEC §7.8 requires 20–300`,
        ).toBeGreaterThanOrEqual(20)
        expect(
          n,
          `${file}: llm_summary at line ${item.line} is ${n} words — SPEC §7.8 requires 20–300`,
        ).toBeLessThanOrEqual(300)
      }
    })
  }
})
