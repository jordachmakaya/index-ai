import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// T-GRAPH: every Agent View example embedded in the documentation must satisfy
// the Level 2b referential rules the spec itself defines (§13 conformance):
// - node IDs are unique;
// - `total_nodes` is consistent with the actual node count (equal for a
//   single-page view — the doc examples are never paginated);
// - every id referenced in `children`, `related`, and `parent` EXISTS in the
//   view (no orphan references — the conformance block's "All node IDs
//   referenced in children and related MUST exist");
// - `parent`/`children` links are bidirectionally consistent (a node listed as
//   a child MUST list that node as its parent, and vice versa).
//
// The JSON Schema alone cannot express these cross-document constraints, so
// this test is the machine-readable gate for them.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readText(file: string): string {
  return readFileSync(resolve(root, file), 'utf8')
}

interface AgentView {
  line: number
  json: Record<string, unknown>
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function agentViews(md: string): AgentView[] {
  const views: AgentView[] = []
  const re = /```json\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    const raw = m[1]
    if (raw.trimStart().startsWith('"')) continue // single-property fragment
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      continue // invalid JSON is caught by the schema suite
    }
    if (isRecord(json) && Array.isArray(json.nodes)) {
      const line = md.slice(0, m.index).split('\n').length
      views.push({ line, json })
    }
  }
  return views
}

interface Node {
  id: string
  relations?: { parent?: string | null; children?: unknown; related?: unknown }
}

function nodesOf(view: AgentView): Node[] {
  return (view.json.nodes as unknown[]).map((n) => n as Node)
}

describe('Agent View referential integrity (spec §13 Level 2b)', () => {
  // Markdown docs embed JSON blocks; the site's own Agent View is a JSON file.
  const sources: Array<{ file: string; views: AgentView[] }> = [
    { file: 'docs/spec/SPEC-v1.0-rc2.md', views: agentViews(readText('docs/spec/SPEC-v1.0-rc2.md')) },
    { file: 'docs/quickstart.md', views: agentViews(readText('docs/quickstart.md')) },
    {
      file: 'docs/public/agent-index.json',
      views: [{ line: 0, json: JSON.parse(readText('docs/public/agent-index.json')) as Record<string, unknown> }],
    },
  ]

  for (const { file, views } of sources) {

    it(`${file}: every Agent View has unique node ids`, () => {
      for (const v of views) {
        const ids = nodesOf(v).map((n) => n.id)
        expect(new Set(ids).size, `${file}: duplicate node id at line ${v.line}`).toBe(ids.length)
      }
    })

    it(`${file}: total_nodes is consistent with the node count`, () => {
      for (const v of views) {
        const n = nodesOf(v).length
        const total = v.json.total_nodes
        if (typeof total !== 'number') continue
        const paginated =
          v.json.offset !== undefined || v.json.limit !== undefined || v.json.next_offset !== undefined
        if (paginated) {
          // §7.9: total_nodes is the count across ALL pages — ≥ the nodes on
          // this page.
          expect(total, `${file}: total_nodes < nodes.length at line ${v.line}`).toBeGreaterThanOrEqual(n)
        } else {
          // Single-page views must report exactly the nodes they carry.
          expect(total, `${file}: total_nodes != nodes.length at line ${v.line}`).toBe(n)
        }
      }
    })

    it(`${file}: no orphan references — every children/related/parent id exists`, () => {
      for (const v of views) {
        const ids = new Set(nodesOf(v).map((node) => node.id))
        for (const node of nodesOf(v)) {
          const rel = node.relations
          if (!rel) continue
          if (rel.parent !== undefined && rel.parent !== null) {
            expect(ids, `${file}: parent of "${node.id}" is orphaned`).toContain(rel.parent)
          }
          for (const key of ['children', 'related'] as const) {
            const refs = rel[key]
            if (!Array.isArray(refs)) continue
            for (const ref of refs) {
              expect(ids, `${file}: ${key} of "${node.id}" references missing node "${String(ref)}"`).toContain(ref)
            }
          }
        }
      }
    })

    it(`${file}: parent/children links are bidirectionally consistent`, () => {
      for (const v of views) {
        const byId = new Map(nodesOf(v).map((node) => [node.id, node]))
        for (const node of nodesOf(v)) {
          const rel = node.relations
          if (!rel || rel.parent === undefined || rel.parent === null) continue
          const parent = byId.get(rel.parent)
          expect(parent, `${file}: parent "${rel.parent}" of "${node.id}" missing`).toBeDefined()
          const siblings = parent!.relations?.children
          expect(
            Array.isArray(siblings) && (siblings as unknown[]).includes(node.id),
            `${file}: "${node.id}" lists parent "${rel.parent}" but is not in its children`,
          ).toBe(true)
        }
      }
    })
  }
})
