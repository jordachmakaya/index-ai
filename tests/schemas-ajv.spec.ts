import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'

// T-schema: the official JSON Schemas (schema/v1/) must exist, be valid JSON,
// and validate every JSON example embedded in the documentation (the canonical
// spec + the quickstart). This is the single-source-of-truth gate: an example
// that the spec ships as valid MUST pass the official schema, and a schema
// change MUST not reject an example the docs still publish.
//
// Manifest examples are detected by a top-level "identity" object; Agent View
// examples by a top-level "nodes" array. Fragment blocks (e.g. the
// `content_chars_measurement` snippet) are ignored — they are not documents.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const manifestSchemaPath = resolve(root, 'schema/v1/index-ai.schema.json')
const agentIndexSchemaPath = resolve(root, 'schema/v1/agent-index.schema.json')

function readText(file: string): string {
  return readFileSync(resolve(root, file), 'utf8')
}

// Field-fragment blocks (e.g. `"content_chars_measurement": { ... }` alone) are
// NOT documents — they are inline excerpts of a single property. They begin with
// a quote. Documents begin with `{`.
function isFragment(raw: string): boolean {
  return raw.trimStart().startsWith('"')
}

function jsonBlocks(md: string): Array<{ line: number; json: unknown; raw: string }> {
  const blocks: Array<{ line: number; json: unknown; raw: string }> = []
  const re = /```json\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    const raw = m[1]
    // line number = count of newlines before the match start
    const line = md.slice(0, m.index).split('\n').length
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch (err) {
      if (isFragment(raw)) continue // intentional single-property excerpt
      throw new Error(`docs JSON block at line ${line} is not valid JSON: ${(err as Error).message}`)
    }
    blocks.push({ line, json, raw })
  }
  return blocks
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

describe('official JSON Schemas (schema/v1/)', () => {
  it('both schemas exist and are valid JSON documents', () => {
    const manifest = JSON.parse(readText('schema/v1/index-ai.schema.json')) as unknown
    const agent = JSON.parse(readText('schema/v1/agent-index.schema.json')) as unknown
    expect(isRecord(manifest)).toBe(true)
    expect(isRecord(agent)).toBe(true)
    expect((manifest as Record<string, unknown>).type).toBe('object')
    expect((agent as Record<string, unknown>).type).toBe('object')
  })

  it('schema $id URLs point at the real public repo (no index-ai/standard 404s)', () => {
    const manifest = JSON.parse(readText('schema/v1/index-ai.schema.json')) as { $id?: string }
    const agent = JSON.parse(readText('schema/v1/agent-index.schema.json')) as { $id?: string }
    expect(manifest.$id).toBe('https://raw.githubusercontent.com/jordachmakaya/index-ai/main/schema/v1/index-ai.schema.json')
    expect(agent.$id).toBe('https://raw.githubusercontent.com/jordachmakaya/index-ai/main/schema/v1/agent-index.schema.json')
  })

  it('no docs example still references the dead index-ai/standard URLs', () => {
    for (const file of ['docs/spec/SPEC-v1.0-rc1.md', 'docs/quickstart.md']) {
      expect(readText(file), file).not.toContain('index-ai/standard')
    }
  })
})

describe('docs examples validate against the official schemas', () => {
  const ajv = new Ajv({ allErrors: true })
  const validateManifest = ajv.compile(JSON.parse(readText('schema/v1/index-ai.schema.json')))
  const validateAgentIndex = ajv.compile(JSON.parse(readText('schema/v1/agent-index.schema.json')))

  for (const file of ['docs/spec/SPEC-v1.0-rc1.md', 'docs/quickstart.md']) {
    const blocks = jsonBlocks(readText(file))

    it(`${file}: every JSON block is valid JSON`, () => {
      // jsonBlocks already throws on invalid JSON — this test documents the intent
      expect(blocks.length).toBeGreaterThan(0)
    })

    it(`${file}: manifest examples pass the official index-ai.schema.json`, () => {
      const manifests = blocks.filter((b) => isRecord(b.json) && 'identity' in b.json && !('nodes' in b.json))
      expect(manifests.length, `${file} should embed ≥1 manifest example`).toBeGreaterThan(0)
      for (const b of manifests) {
        const ok = validateManifest(b.json)
        expect(
          ok,
          `${file}: manifest example at line ${b.line} failed the official schema:\n${ajv.errorsText(validateManifest.errors)}`,
        ).toBe(true)
      }
    })

    it(`${file}: Agent View examples pass the official agent-index.schema.json`, () => {
      const views = blocks.filter((b) => isRecord(b.json) && 'nodes' in b.json)
      expect(views.length, `${file} should embed ≥1 Agent View example`).toBeGreaterThan(0)
      for (const b of views) {
        const ok = validateAgentIndex(b.json)
        expect(
          ok,
          `${file}: Agent View example at line ${b.line} failed the official schema:\n${ajv.errorsText(validateAgentIndex.errors)}`,
        ).toBe(true)
      }
    })
  }
})
